// Subscription Service - Core business logic for subscription management

import { createClient } from '@supabase/supabase-js';
import type {
  SubscriptionPlan,
  UserSubscription,
  UsageTracking,
  UsageCheckResult,
  SubscriptionWithUsage,
  SubscriptionPlanName,
} from '@/types/subscription';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class SubscriptionService {
  /**
   * Get all active subscription plans
   */
  static async getPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('Error fetching subscription plans:', error);
      throw new Error('Failed to fetch subscription plans');
    }

    return data || [];
  }

  /**
   * Get a specific plan by name
   */
  static async getPlanByName(name: SubscriptionPlanName): Promise<SubscriptionPlan | null> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', name)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching plan:', error);
      return null;
    }

    return data;
  }

  /**
   * Get tutor's current subscription with plan details
   */
  static async getTutorSubscription(tutorId: string): Promise<SubscriptionWithUsage | null> {
    // Get subscription with plan
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('tutor_id', tutorId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subError || !subscription) {
      console.error('Error fetching subscription:', subError);
      return null;
    }

    // Get current usage
    const { data: usage } = await supabase
      .rpc('get_current_usage', { p_tutor_id: tutorId });

    if (!usage || usage.length === 0) {
      return null;
    }

    return {
      subscription: subscription as UserSubscription,
      usage: usage[0] as UsageTracking,
      plan: subscription.plan as SubscriptionPlan,
    };
  }

  /**
   * Check if tutor can perform an action based on their plan limits
   */
  static async checkUsageLimit(
    tutorId: string,
    usageType: 'lessons_generated' | 'vocabulary_sessions_created' | 'discussion_prompts_created' | 'students_count'
  ): Promise<UsageCheckResult> {
    const subscriptionData = await this.getTutorSubscription(tutorId);

    if (!subscriptionData) {
      return {
        allowed: false,
        current: 0,
        limit: 0,
        message: 'No active subscription found',
      };
    }

    const { usage, plan } = subscriptionData;

    // Map usage type to plan limit field
    const limitMap = {
      lessons_generated: plan.lessons_per_month,
      vocabulary_sessions_created: plan.vocabulary_sessions_per_month,
      discussion_prompts_created: plan.discussion_prompts_per_month,
      students_count: plan.max_students,
    };

    const limit = limitMap[usageType];
    const current = usage[usageType];

    // null limit means unlimited
    if (limit === null) {
      return {
        allowed: true,
        current,
        limit: null,
      };
    }

    const allowed = current < limit;

    return {
      allowed,
      current,
      limit,
      message: allowed ? undefined : `You've reached your plan limit of ${limit} ${usageType.replace('_', ' ')} per month`,
    };
  }

  /**
   * Increment usage counter
   */
  static async incrementUsage(
    tutorId: string,
    usageType: 'lessons_generated' | 'vocabulary_sessions_created' | 'discussion_prompts_created' | 'students_count',
    increment: number = 1
  ): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('increment_usage', {
        p_tutor_id: tutorId,
        p_usage_type: usageType,
        p_increment: increment,
      });

    if (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }

    return data === true;
  }

  /**
   * Create a new subscription for a tutor
   */
  static async createSubscription(
    tutorId: string,
    planName: SubscriptionPlanName,
    tranzakSubscriptionId?: string
  ): Promise<UserSubscription | null> {
    const plan = await this.getPlanByName(planName);
    if (!plan) {
      throw new Error(`Plan ${planName} not found`);
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const { data, error } = await supabase
      .from('user_subscriptions')
      .insert({
        tutor_id: tutorId,
        plan_id: plan.id,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        tranzak_subscription_id: tranzakSubscriptionId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      return null;
    }

    // Update tutor record
    await supabase
      .from('tutors')
      .update({
        current_subscription_id: data.id,
        subscription_status: planName,
      })
      .eq('id', tutorId);

    // Log subscription history
    await supabase
      .from('subscription_history')
      .insert({
        tutor_id: tutorId,
        subscription_id: data.id,
        action: 'created',
        to_plan_id: plan.id,
        reason: 'New subscription created',
      });

    return data;
  }

  /**
   * Upgrade/downgrade subscription
   */
  static async changeSubscription(
    tutorId: string,
    newPlanName: SubscriptionPlanName
  ): Promise<UserSubscription | null> {
    const currentSub = await this.getTutorSubscription(tutorId);
    if (!currentSub) {
      throw new Error('No active subscription found');
    }

    const newPlan = await this.getPlanByName(newPlanName);
    if (!newPlan) {
      throw new Error(`Plan ${newPlanName} not found`);
    }

    // Cancel current subscription
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', currentSub.subscription.id);

    // Create new subscription
    const newSub = await this.createSubscription(tutorId, newPlanName);

    if (newSub) {
      // Log the change
      await supabase
        .from('subscription_history')
        .insert({
          tutor_id: tutorId,
          subscription_id: newSub.id,
          action: currentSub.plan.sort_order < newPlan.sort_order ? 'upgraded' : 'downgraded',
          from_plan_id: currentSub.plan.id,
          to_plan_id: newPlan.id,
          reason: 'Plan change requested by user',
        });
    }

    return newSub;
  }

  /**
   * Cancel subscription at period end
   */
  static async cancelSubscription(tutorId: string): Promise<boolean> {
    const currentSub = await this.getTutorSubscription(tutorId);
    if (!currentSub) {
      return false;
    }

    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        cancel_at_period_end: true,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', currentSub.subscription.id);

    if (error) {
      console.error('Error cancelling subscription:', error);
      return false;
    }

    // Log cancellation
    await supabase
      .from('subscription_history')
      .insert({
        tutor_id: tutorId,
        subscription_id: currentSub.subscription.id,
        action: 'cancelled',
        from_plan_id: currentSub.plan.id,
        reason: 'User requested cancellation',
      });

    return true;
  }

  /**
   * Get subscription history for a tutor
   */
  static async getSubscriptionHistory(tutorId: string) {
    const { data, error } = await supabase
      .from('subscription_history')
      .select(`
        *,
        from_plan:subscription_plans!subscription_history_from_plan_id_fkey(*),
        to_plan:subscription_plans!subscription_history_to_plan_id_fkey(*)
      `)
      .eq('tutor_id', tutorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscription history:', error);
      return [];
    }

    return data || [];
  }
}

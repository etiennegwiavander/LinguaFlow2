// Hook to check and enforce subscription limits
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SubscriptionLimits {
  lessons_per_month: number | null;
  max_students: number | null;
  vocabulary_sessions_per_month: number | null;
  discussion_prompts_per_month: number | null;
  calendar_sync_enabled: boolean;
}

interface CurrentUsage {
  lessons_generated: number;
  vocabulary_sessions_created: number;
  discussion_prompts_created: number;
  students_count: number;
}

interface UsageStatus {
  loading: boolean;
  limits: SubscriptionLimits | null;
  usage: CurrentUsage | null;
  planName: string | null;
  canGenerateLesson: boolean;
  canAddStudent: boolean;
  canCreateVocabulary: boolean;
  canCreateDiscussion: boolean;
  hasCalendarSync: boolean;
  usagePercentage: {
    lessons: number;
    students: number;
    vocabulary: number;
    discussions: number;
  };
}

export function useSubscriptionLimits(): UsageStatus {
  const { user } = useAuth();
  const [status, setStatus] = useState<UsageStatus>({
    loading: true,
    limits: null,
    usage: null,
    planName: null,
    canGenerateLesson: true,
    canAddStudent: true,
    canCreateVocabulary: true,
    canCreateDiscussion: true,
    hasCalendarSync: false,
    usagePercentage: {
      lessons: 0,
      students: 0,
      vocabulary: 0,
      discussions: 0,
    },
  });

  useEffect(() => {
    if (!user) {
      setStatus(prev => ({ ...prev, loading: false }));
      return;
    }

    fetchSubscriptionStatus();
  }, [user]);

  async function fetchSubscriptionStatus() {
    try {
      // Get subscription with plan details
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('tutor_id', user!.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (subError || !subscription) {
        // No subscription found - use free plan limits
        setStatus({
          loading: false,
          limits: {
            lessons_per_month: 3,
            max_students: 2,
            vocabulary_sessions_per_month: 1,
            discussion_prompts_per_month: 1,
            calendar_sync_enabled: false,
          },
          usage: {
            lessons_generated: 0,
            vocabulary_sessions_created: 0,
            discussion_prompts_created: 0,
            students_count: 0,
          },
          planName: 'free',
          canGenerateLesson: true,
          canAddStudent: true,
          canCreateVocabulary: true,
          canCreateDiscussion: true,
          hasCalendarSync: false,
          usagePercentage: {
            lessons: 0,
            students: 0,
            vocabulary: 0,
            discussions: 0,
          },
        });
        return;
      }

      const plan = subscription.plan;

      // Get current usage
      const { data: usageData, error: usageError } = await supabase
        .rpc('get_current_usage', { p_tutor_id: user!.id });

      const usage = usageData && usageData.length > 0 ? usageData[0] : {
        lessons_generated: 0,
        vocabulary_sessions_created: 0,
        discussion_prompts_created: 0,
        students_count: 0,
      };

      // Calculate permissions
      const limits: SubscriptionLimits = {
        lessons_per_month: plan.lessons_per_month,
        max_students: plan.max_students,
        vocabulary_sessions_per_month: plan.vocabulary_sessions_per_month,
        discussion_prompts_per_month: plan.discussion_prompts_per_month,
        calendar_sync_enabled: plan.calendar_sync_enabled,
      };

      const canGenerateLesson = limits.lessons_per_month === null || 
        usage.lessons_generated < limits.lessons_per_month;

      const canAddStudent = limits.max_students === null || 
        usage.students_count < limits.max_students;

      const canCreateVocabulary = limits.vocabulary_sessions_per_month === null || 
        usage.vocabulary_sessions_created < limits.vocabulary_sessions_per_month;

      const canCreateDiscussion = limits.discussion_prompts_per_month === null || 
        usage.discussion_prompts_created < limits.discussion_prompts_per_month;

      // Calculate usage percentages
      const usagePercentage = {
        lessons: limits.lessons_per_month 
          ? Math.round((usage.lessons_generated / limits.lessons_per_month) * 100)
          : 0,
        students: limits.max_students 
          ? Math.round((usage.students_count / limits.max_students) * 100)
          : 0,
        vocabulary: limits.vocabulary_sessions_per_month 
          ? Math.round((usage.vocabulary_sessions_created / limits.vocabulary_sessions_per_month) * 100)
          : 0,
        discussions: limits.discussion_prompts_per_month 
          ? Math.round((usage.discussion_prompts_created / limits.discussion_prompts_per_month) * 100)
          : 0,
      };

      setStatus({
        loading: false,
        limits,
        usage,
        planName: plan.name,
        canGenerateLesson,
        canAddStudent,
        canCreateVocabulary,
        canCreateDiscussion,
        hasCalendarSync: limits.calendar_sync_enabled,
        usagePercentage,
      });

    } catch (error) {
      console.error('Error fetching subscription status:', error);
      setStatus(prev => ({ ...prev, loading: false }));
    }
  }

  return status;
}

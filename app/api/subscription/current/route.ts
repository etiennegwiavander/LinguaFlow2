// Get current user's subscription details
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SubscriptionService } from '@/lib/subscription-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Get subscription with usage
    const subscriptionData = await SubscriptionService.getTutorSubscription(user.id);

    if (!subscriptionData) {
      // User is on free plan - return free plan details
      const freePlan = await SubscriptionService.getPlanByName('free');
      
      if (!freePlan) {
        return NextResponse.json(
          { error: 'Free plan not found in database' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        subscription: null,
        plan: freePlan,
        usage: {
          lessons_generated: 0,
          vocabulary_sessions_created: 0,
          discussion_prompts_created: 0,
          students_count: 0,
        },
      });
    }

    return NextResponse.json({
      subscription: subscriptionData.subscription,
      plan: subscriptionData.plan,
      usage: subscriptionData.usage,
    });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

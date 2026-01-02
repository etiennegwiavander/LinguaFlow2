// Subscription system types

export type SubscriptionPlanName = 'free' | 'starter' | 'professional' | 'enterprise';

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'past_due';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type PaymentMethod = 'mobile_money' | 'card' | 'bank_transfer';

export interface SubscriptionPlan {
  id: string;
  name: SubscriptionPlanName;
  display_name: string;
  price_usd: number;
  price_xaf: number;
  annual_price_usd: number | null;
  annual_price_xaf: number | null;
  
  // Limits
  lessons_per_month: number | null;
  max_students: number | null;
  vocabulary_sessions_per_month: number | null;
  discussion_prompts_per_month: number | null;
  calendar_sync_enabled: boolean;
  multi_user_accounts: number;
  
  // Features
  priority_support: boolean;
  phone_support: boolean;
  white_label_enabled: boolean;
  api_access_enabled: boolean;
  
  // Metadata
  features: {
    description: string;
    highlights: string[];
    popular?: boolean;
  };
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  tutor_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  tranzak_subscription_id: string | null;
  payment_method: PaymentMethod | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  
  // Joined data
  plan?: SubscriptionPlan;
}

export interface UsageTracking {
  id: string;
  tutor_id: string;
  period_start: string;
  period_end: string;
  lessons_generated: number;
  vocabulary_sessions_created: number;
  discussion_prompts_created: number;
  students_count: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  tutor_id: string;
  subscription_id: string | null;
  tranzak_transaction_id: string | null;
  tranzak_request_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod | null;
  metadata: Record<string, any> | null;
  error_message: string | null;
  initiated_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionHistory {
  id: string;
  tutor_id: string;
  subscription_id: string | null;
  action: 'created' | 'upgraded' | 'downgraded' | 'cancelled' | 'renewed';
  from_plan_id: string | null;
  to_plan_id: string | null;
  reason: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

// Usage check result
export interface UsageCheckResult {
  allowed: boolean;
  current: number;
  limit: number | null;
  message?: string;
}

// Subscription with usage data
export interface SubscriptionWithUsage {
  subscription: UserSubscription;
  usage: UsageTracking;
  plan: SubscriptionPlan;
}

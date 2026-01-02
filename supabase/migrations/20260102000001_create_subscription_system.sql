-- Create subscription system tables
-- This migration adds the complete subscription infrastructure

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE, -- 'free', 'starter', 'professional', 'enterprise'
  display_name VARCHAR(100) NOT NULL,
  price_usd DECIMAL(10, 2) NOT NULL,
  price_xaf DECIMAL(10, 2) NOT NULL,
  annual_price_usd DECIMAL(10, 2), -- Annual pricing with discount
  annual_price_xaf DECIMAL(10, 2),
  
  -- Limits
  lessons_per_month INTEGER,
  max_students INTEGER,
  vocabulary_sessions_per_month INTEGER,
  discussion_prompts_per_month INTEGER,
  calendar_sync_enabled BOOLEAN DEFAULT false,
  multi_user_accounts INTEGER DEFAULT 1,
  
  -- Features
  priority_support BOOLEAN DEFAULT false,
  phone_support BOOLEAN DEFAULT false,
  white_label_enabled BOOLEAN DEFAULT false,
  api_access_enabled BOOLEAN DEFAULT false,
  
  -- Metadata
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  
  -- Subscription status
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired', 'past_due'
  
  -- Billing cycle
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Payment info
  tranzak_subscription_id VARCHAR(255),
  payment_method VARCHAR(50), -- 'mobile_money', 'card', 'bank_transfer'
  
  -- Cancellation
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(tutor_id, current_period_start)
);

-- 3. Create usage_tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  
  -- Period tracking
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Usage counters
  lessons_generated INTEGER DEFAULT 0,
  vocabulary_sessions_created INTEGER DEFAULT 0,
  discussion_prompts_created INTEGER DEFAULT 0,
  students_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(tutor_id, period_start)
);

-- 4. Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id),
  
  -- Tranzak details
  tranzak_transaction_id VARCHAR(255) UNIQUE,
  tranzak_request_id VARCHAR(255),
  
  -- Transaction info
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  payment_method VARCHAR(50),
  
  -- Metadata
  metadata JSONB,
  error_message TEXT,
  
  -- Timestamps
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create subscription_history table
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id),
  
  -- Change tracking
  action VARCHAR(50) NOT NULL, -- 'created', 'upgraded', 'downgraded', 'cancelled', 'renewed'
  from_plan_id UUID REFERENCES subscription_plans(id),
  to_plan_id UUID REFERENCES subscription_plans(id),
  
  -- Metadata
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Modify tutors table to add subscription columns (if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tutors' AND column_name='current_subscription_id') THEN
    ALTER TABLE tutors ADD COLUMN current_subscription_id UUID REFERENCES user_subscriptions(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tutors' AND column_name='subscription_status') THEN
    ALTER TABLE tutors ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'free';
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tutor_id ON user_subscriptions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period ON user_subscriptions(current_period_start, current_period_end);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_tutor_period ON usage_tracking(tutor_id, period_start);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_tutor_id ON payment_transactions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_tranzak_id ON payment_transactions(tranzak_transaction_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_tutor_id ON subscription_history(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutors_subscription_status ON tutors(subscription_status);

-- Insert default subscription plans (only if they don't exist)
INSERT INTO subscription_plans (
  name, 
  display_name, 
  price_usd, 
  price_xaf, 
  annual_price_usd, 
  annual_price_xaf, 
  lessons_per_month, 
  max_students, 
  vocabulary_sessions_per_month, 
  discussion_prompts_per_month, 
  calendar_sync_enabled, 
  priority_support, 
  phone_support,
  white_label_enabled,
  api_access_enabled,
  multi_user_accounts,
  sort_order,
  features
) VALUES
-- Free Plan
(
  'free', 
  'Free', 
  0.00, 
  0, 
  0.00, 
  0, 
  3, 
  2, 
  1, 
  1, 
  false, 
  false, 
  false,
  false,
  false,
  1,
  1,
  '{"description": "Perfect for trying out LinguaFlow", "highlights": ["3 lessons per month", "2 students max", "Community support"]}'::jsonb
),
-- Starter Plan
(
  'starter', 
  'Starter', 
  12.00, 
  7000, 
  120.00, 
  70000, 
  30, 
  10, 
  15, 
  15, 
  true, 
  false, 
  false,
  false,
  false,
  1,
  2,
  '{"description": "Great for part-time tutors", "highlights": ["30 lessons per month", "10 students max", "Calendar sync", "Email support"]}'::jsonb
),
-- Professional Plan (Most Popular)
(
  'professional', 
  'Professional', 
  25.00, 
  14500, 
  250.00, 
  145000, 
  100, 
  30, 
  NULL, 
  NULL, 
  true, 
  true, 
  false,
  false,
  false,
  1,
  3,
  '{"description": "Perfect for full-time tutors", "highlights": ["100 lessons per month", "30 students max", "Unlimited vocabulary & discussion", "Priority support"], "popular": true}'::jsonb
),
-- Enterprise Plan
(
  'enterprise', 
  'Enterprise', 
  50.00, 
  29000, 
  500.00, 
  290000, 
  NULL, 
  NULL, 
  NULL, 
  NULL, 
  true, 
  true, 
  true,
  true,
  true,
  5,
  4,
  '{"description": "For language schools and agencies", "highlights": ["Unlimited everything", "5 tutor accounts", "White-label option", "Phone support", "API access"]}'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- Create function to automatically create usage tracking for new periods
CREATE OR REPLACE FUNCTION create_usage_tracking_for_period(
  p_tutor_id UUID,
  p_period_start TIMESTAMP WITH TIME ZONE,
  p_period_end TIMESTAMP WITH TIME ZONE
)
RETURNS UUID AS $$
DECLARE
  usage_id UUID;
BEGIN
  INSERT INTO usage_tracking (
    tutor_id,
    period_start,
    period_end,
    lessons_generated,
    vocabulary_sessions_created,
    discussion_prompts_created,
    students_count
  ) VALUES (
    p_tutor_id,
    p_period_start,
    p_period_end,
    0,
    0,
    0,
    0
  )
  ON CONFLICT (tutor_id, period_start) DO NOTHING
  RETURNING id INTO usage_id;
  
  -- If no insert happened due to conflict, get existing ID
  IF usage_id IS NULL THEN
    SELECT id INTO usage_id 
    FROM usage_tracking 
    WHERE tutor_id = p_tutor_id AND period_start = p_period_start;
  END IF;
  
  RETURN usage_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get current usage for a tutor
CREATE OR REPLACE FUNCTION get_current_usage(p_tutor_id UUID)
RETURNS TABLE (
  lessons_generated INTEGER,
  vocabulary_sessions_created INTEGER,
  discussion_prompts_created INTEGER,
  students_count INTEGER,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  current_period_start TIMESTAMP WITH TIME ZONE;
  current_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate current billing period (monthly)
  current_period_start := date_trunc('month', NOW());
  current_period_end := current_period_start + INTERVAL '1 month';
  
  -- Ensure usage tracking record exists
  PERFORM create_usage_tracking_for_period(p_tutor_id, current_period_start, current_period_end);
  
  -- Return current usage
  RETURN QUERY
  SELECT 
    ut.lessons_generated,
    ut.vocabulary_sessions_created,
    ut.discussion_prompts_created,
    ut.students_count,
    ut.period_start,
    ut.period_end
  FROM usage_tracking ut
  WHERE ut.tutor_id = p_tutor_id 
    AND ut.period_start = current_period_start;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment usage counters
CREATE OR REPLACE FUNCTION increment_usage(
  p_tutor_id UUID,
  p_usage_type VARCHAR(50),
  p_increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  current_period_start TIMESTAMP WITH TIME ZONE;
  current_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate current billing period
  current_period_start := date_trunc('month', NOW());
  current_period_end := current_period_start + INTERVAL '1 month';
  
  -- Ensure usage tracking record exists
  PERFORM create_usage_tracking_for_period(p_tutor_id, current_period_start, current_period_end);
  
  -- Increment the appropriate counter
  CASE p_usage_type
    WHEN 'lessons_generated' THEN
      UPDATE usage_tracking 
      SET lessons_generated = lessons_generated + p_increment,
          updated_at = NOW()
      WHERE tutor_id = p_tutor_id AND period_start = current_period_start;
      
    WHEN 'vocabulary_sessions_created' THEN
      UPDATE usage_tracking 
      SET vocabulary_sessions_created = vocabulary_sessions_created + p_increment,
          updated_at = NOW()
      WHERE tutor_id = p_tutor_id AND period_start = current_period_start;
      
    WHEN 'discussion_prompts_created' THEN
      UPDATE usage_tracking 
      SET discussion_prompts_created = discussion_prompts_created + p_increment,
          updated_at = NOW()
      WHERE tutor_id = p_tutor_id AND period_start = current_period_start;
      
    WHEN 'students_count' THEN
      -- For students, we set the actual count, not increment
      UPDATE usage_tracking 
      SET students_count = (
        SELECT COUNT(*) FROM students WHERE tutor_id = p_tutor_id
      ),
      updated_at = NOW()
      WHERE tutor_id = p_tutor_id AND period_start = current_period_start;
      
    ELSE
      RETURN FALSE;
  END CASE;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies for subscription tables
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Subscription plans are readable by everyone (public pricing)
DROP POLICY IF EXISTS "Subscription plans are publicly readable" ON subscription_plans;
CREATE POLICY "Subscription plans are publicly readable" ON subscription_plans
  FOR SELECT USING (is_active = true);

-- Users can only see their own subscription data
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
  FOR SELECT USING (tutor_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own usage" ON usage_tracking;
CREATE POLICY "Users can view own usage" ON usage_tracking
  FOR SELECT USING (tutor_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own transactions" ON payment_transactions;
CREATE POLICY "Users can view own transactions" ON payment_transactions
  FOR SELECT USING (tutor_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own subscription history" ON subscription_history;
CREATE POLICY "Users can view own subscription history" ON subscription_history
  FOR SELECT USING (tutor_id = auth.uid());

-- Service role can manage all subscription data
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON user_subscriptions;
CREATE POLICY "Service role can manage subscriptions" ON user_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage usage" ON usage_tracking;
CREATE POLICY "Service role can manage usage" ON usage_tracking
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage transactions" ON payment_transactions;
CREATE POLICY "Service role can manage transactions" ON payment_transactions
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage history" ON subscription_history;
CREATE POLICY "Service role can manage history" ON subscription_history
  FOR ALL USING (auth.role() = 'service_role');

-- Add helpful comments
COMMENT ON TABLE subscription_plans IS 'Available subscription plans with pricing and limits';
COMMENT ON TABLE user_subscriptions IS 'User subscription records with billing periods';
COMMENT ON TABLE usage_tracking IS 'Monthly usage tracking for each tutor';
COMMENT ON TABLE payment_transactions IS 'Payment transaction records from Tranzak';
COMMENT ON TABLE subscription_history IS 'Audit trail of subscription changes';

COMMENT ON FUNCTION get_current_usage(UUID) IS 'Get current month usage statistics for a tutor';
COMMENT ON FUNCTION increment_usage(UUID, VARCHAR, INTEGER) IS 'Increment usage counter for a tutor';
COMMENT ON FUNCTION create_usage_tracking_for_period(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'Create usage tracking record for a billing period';

/*
  # Account Deletion and Recovery System

  1. New Tables
    - `account_deletions`
      - `id` (uuid, primary key)
      - `tutor_id` (uuid, references tutors)
      - `deletion_timestamp` (timestamp)
      - `recovery_token` (text, unique)
      - `reason` (text, nullable)
      - `ip_address` (text, nullable)
      - `user_agent` (text, nullable)
      - `created_at` (timestamp)
      - `recovered_at` (timestamp, nullable)
    
    - `deletion_logs`
      - `id` (uuid, primary key)
      - `tutor_id` (uuid, references tutors)
      - `action` (text) - 'deletion_requested', 'recovery_email_sent', 'account_recovered', 'permanent_deletion'
      - `details` (jsonb, nullable)
      - `ip_address` (text, nullable)
      - `user_agent` (text, nullable)
      - `created_at` (timestamp)

  2. Changes to existing tables
    - Add `deleted_at` column to tutors table for soft delete
    - Add `deletion_scheduled` boolean to tutors table

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
    - Add indexes for performance
*/

-- Add soft delete columns to tutors table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tutors' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE tutors ADD COLUMN deleted_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tutors' AND column_name = 'deletion_scheduled'
  ) THEN
    ALTER TABLE tutors ADD COLUMN deletion_scheduled boolean DEFAULT false;
  END IF;
END $$;

-- Create account_deletions table
CREATE TABLE IF NOT EXISTS account_deletions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid REFERENCES tutors(id) ON DELETE CASCADE NOT NULL,
  deletion_timestamp timestamptz NOT NULL,
  recovery_token text UNIQUE NOT NULL,
  reason text,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  recovered_at timestamptz,
  UNIQUE(tutor_id)
);

ALTER TABLE account_deletions ENABLE ROW LEVEL SECURITY;

-- Create deletion_logs table
CREATE TABLE IF NOT EXISTS deletion_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid REFERENCES tutors(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE deletion_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for account_deletions
CREATE POLICY "Users can view own deletion records"
  ON account_deletions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = tutor_id);

CREATE POLICY "Users can insert own deletion records"
  ON account_deletions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Users can update own deletion records"
  ON account_deletions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = tutor_id)
  WITH CHECK (auth.uid() = tutor_id);

-- RLS Policies for deletion_logs
CREATE POLICY "Users can view own deletion logs"
  ON deletion_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = tutor_id);

CREATE POLICY "Users can insert own deletion logs"
  ON deletion_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = tutor_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_account_deletions_tutor_id ON account_deletions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_account_deletions_recovery_token ON account_deletions(recovery_token);
CREATE INDEX IF NOT EXISTS idx_account_deletions_deletion_timestamp ON account_deletions(deletion_timestamp);
CREATE INDEX IF NOT EXISTS idx_deletion_logs_tutor_id ON deletion_logs(tutor_id);
CREATE INDEX IF NOT EXISTS idx_deletion_logs_action ON deletion_logs(action);
CREATE INDEX IF NOT EXISTS idx_tutors_deleted_at ON tutors(deleted_at);
CREATE INDEX IF NOT EXISTS idx_tutors_deletion_scheduled ON tutors(deletion_scheduled);

-- Function to generate secure recovery token
CREATE OR REPLACE FUNCTION generate_recovery_token()
RETURNS text AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- Function to schedule account deletion
CREATE OR REPLACE FUNCTION schedule_account_deletion(
  p_tutor_id uuid,
  p_reason text DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS text AS $$
DECLARE
  v_recovery_token text;
  v_deletion_timestamp timestamptz;
BEGIN
  -- Generate recovery token
  v_recovery_token := generate_recovery_token();
  
  -- Set deletion timestamp to 30 days from now
  v_deletion_timestamp := now() + interval '30 days';
  
  -- Mark tutor as scheduled for deletion
  UPDATE tutors 
  SET deletion_scheduled = true 
  WHERE id = p_tutor_id;
  
  -- Insert deletion record
  INSERT INTO account_deletions (
    tutor_id,
    deletion_timestamp,
    recovery_token,
    reason,
    ip_address,
    user_agent
  ) VALUES (
    p_tutor_id,
    v_deletion_timestamp,
    v_recovery_token,
    p_reason,
    p_ip_address,
    p_user_agent
  );
  
  -- Log the action
  INSERT INTO deletion_logs (
    tutor_id,
    action,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_tutor_id,
    'deletion_requested',
    jsonb_build_object(
      'deletion_timestamp', v_deletion_timestamp,
      'reason', p_reason
    ),
    p_ip_address,
    p_user_agent
  );
  
  RETURN v_recovery_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to recover account
CREATE OR REPLACE FUNCTION recover_account(p_recovery_token text)
RETURNS boolean AS $$
DECLARE
  v_tutor_id uuid;
  v_deletion_record record;
BEGIN
  -- Find the deletion record
  SELECT * INTO v_deletion_record
  FROM account_deletions
  WHERE recovery_token = p_recovery_token
    AND recovered_at IS NULL
    AND deletion_timestamp > now();
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  v_tutor_id := v_deletion_record.tutor_id;
  
  -- Mark tutor as not scheduled for deletion
  UPDATE tutors 
  SET deletion_scheduled = false 
  WHERE id = v_tutor_id;
  
  -- Mark deletion record as recovered
  UPDATE account_deletions
  SET recovered_at = now()
  WHERE id = v_deletion_record.id;
  
  -- Log the recovery
  INSERT INTO deletion_logs (
    tutor_id,
    action,
    details
  ) VALUES (
    v_tutor_id,
    'account_recovered',
    jsonb_build_object(
      'recovery_token', p_recovery_token,
      'original_deletion_timestamp', v_deletion_record.deletion_timestamp
    )
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to permanently delete expired accounts
CREATE OR REPLACE FUNCTION cleanup_expired_accounts()
RETURNS integer AS $$
DECLARE
  v_deleted_count integer := 0;
  v_tutor_record record;
BEGIN
  -- Find all accounts scheduled for deletion that have passed their deletion timestamp
  FOR v_tutor_record IN
    SELECT t.id, t.email, ad.deletion_timestamp
    FROM tutors t
    JOIN account_deletions ad ON t.id = ad.tutor_id
    WHERE t.deletion_scheduled = true
      AND ad.deletion_timestamp <= now()
      AND ad.recovered_at IS NULL
  LOOP
    -- Log the permanent deletion
    INSERT INTO deletion_logs (
      tutor_id,
      action,
      details
    ) VALUES (
      v_tutor_record.id,
      'permanent_deletion',
      jsonb_build_object(
        'email', v_tutor_record.email,
        'deletion_timestamp', v_tutor_record.deletion_timestamp
      )
    );
    
    -- Delete the tutor (cascade will handle related data)
    DELETE FROM tutors WHERE id = v_tutor_record.id;
    
    v_deleted_count := v_deleted_count + 1;
  END LOOP;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
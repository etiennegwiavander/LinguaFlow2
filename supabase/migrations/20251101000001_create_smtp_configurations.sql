-- Create SMTP configurations table
CREATE TABLE IF NOT EXISTS smtp_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    username VARCHAR(255) NOT NULL,
    password_encrypted TEXT NOT NULL,
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255),
    use_tls BOOLEAN DEFAULT true,
    use_ssl BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES tutors(id),
    last_tested_at TIMESTAMPTZ,
    test_status VARCHAR(50),
    test_error_message TEXT
);

-- Create index for faster lookups
CREATE INDEX idx_smtp_configurations_active ON smtp_configurations(is_active) WHERE is_active = true;
CREATE INDEX idx_smtp_configurations_default ON smtp_configurations(is_default) WHERE is_default = true;

-- Create unique partial indexes to ensure only one active/default config
CREATE UNIQUE INDEX idx_smtp_configurations_unique_active ON smtp_configurations(is_active) WHERE is_active = true;
CREATE UNIQUE INDEX idx_smtp_configurations_unique_default ON smtp_configurations(is_default) WHERE is_default = true;

-- Enable RLS
ALTER TABLE smtp_configurations ENABLE ROW LEVEL SECURITY;

-- Admin-only access policy
CREATE POLICY "Admin users can manage SMTP configurations"
    ON smtp_configurations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM tutors
            WHERE tutors.id = auth.uid()
            AND tutors.is_admin = true
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_smtp_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_smtp_configurations_updated_at
    BEFORE UPDATE ON smtp_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_smtp_configurations_updated_at();

-- Insert default Resend configuration (using environment variable)
-- Note: Password will need to be set via admin portal
INSERT INTO smtp_configurations (
    name,
    provider,
    host,
    port,
    username,
    password_encrypted,
    from_email,
    from_name,
    use_tls,
    use_ssl,
    is_active,
    is_default
) VALUES (
    'Default Resend Configuration',
    'resend',
    'smtp.resend.com',
    587,
    'resend',
    'PLACEHOLDER_NEEDS_CONFIGURATION',
    'onboarding@resend.dev',
    'LinguaFlow',
    true,
    false,
    false,
    true
) ON CONFLICT DO NOTHING;

COMMENT ON TABLE smtp_configurations IS 'Stores SMTP server configurations for sending emails';
COMMENT ON COLUMN smtp_configurations.password_encrypted IS 'Encrypted SMTP password - should be encrypted before storage';
COMMENT ON COLUMN smtp_configurations.is_active IS 'Only one configuration can be active at a time';
COMMENT ON COLUMN smtp_configurations.is_default IS 'Default configuration to use when no active config is set';

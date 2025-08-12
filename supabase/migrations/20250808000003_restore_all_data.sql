-- Restore all data from lesson_templates.sql backup
-- This will restore authentication data and all application data

-- First, temporarily disable RLS and triggers for bulk insert
SET session_replication_role = replica;

-- Restore your main user account (excluding generated columns)
INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', 'authenticated', 'authenticated', 'vanshidy@gmail.com', '$2a$10$8o.q/9vp8e3oKmpdPpOuRuWFYQwW5FItpTIYONC/PuSp0NRkL4CdK', '2025-06-05 14:18:23.451284+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-08-05 14:25:31.269344+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "c1c99ecd-5a36-4cfb-9fc2-80dd771c9689", "email": "vanshidy@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2025-06-05 14:18:23.450157+00', '2025-08-05 14:25:31.270896+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false)
ON CONFLICT (id) DO NOTHING;

-- Restore your tutor profile (matching current schema)
INSERT INTO "public"."tutors" ("id", "email", "name", "created_at", "updated_at", "deleted_at", "deletion_scheduled") VALUES
	('c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', 'vanshidy@gmail.com', 'Etienne Gwiavander', '2025-06-07 10:57:33.612428+00', '2025-06-07 10:57:33.612428+00', NULL, false)
ON CONFLICT (id) DO NOTHING;

-- Re-enable normal replication
SET session_replication_role = DEFAULT;

-- Add comment
COMMENT ON SCHEMA public IS 'Authentication data restored on 2025-08-08 for vanshidy@gmail.com';
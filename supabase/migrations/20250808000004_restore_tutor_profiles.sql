-- Add missing columns to tutors table and restore full profile data

-- First, make the name column nullable to match original schema
ALTER TABLE tutors ALTER COLUMN name DROP NOT NULL;

-- Add missing columns to tutors table
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS primary_teaching_language text;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS avatar_url text;

-- Update your tutor profile with complete information
UPDATE tutors 
SET 
  primary_teaching_language = 'English',
  is_admin = true,
  avatar_url = 'https://urmuwjcjcyohsrkgyapl.supabase.co/storage/v1/object/public/profiles/avatars/c1c99ecd-5a36-4cfb-9fc2-80dd771c9689-0.7668527482552047.png'
WHERE id = 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689';

-- Restore other tutors from the original data
INSERT INTO "public"."tutors" ("id", "email", "name", "primary_teaching_language", "is_admin", "created_at", "updated_at", "avatar_url", "deleted_at", "deletion_scheduled") VALUES
  ('0dc0e0d9-6b52-4605-a63f-5dd920150b64', 'Beiblessing@gmail.com', NULL, NULL, false, '2025-06-18 19:52:10.315067+00', '2025-06-18 19:52:10.315067+00', NULL, NULL, false),
  ('f1697f1b-756a-446c-a285-b317ee0195eb', 'fongwa14@yahoo.com', NULL, NULL, false, '2025-06-28 01:50:49.080248+00', '2025-06-28 01:50:49.080248+00', NULL, NULL, false),
  ('2653fcbc-3e74-4676-ac29-b95582c6e3ac', 'judecho899@gmail.com', NULL, NULL, false, '2025-06-27 07:30:51.486069+00', '2025-06-27 07:30:51.486069+00', NULL, NULL, false),
  ('a55f3995-16ef-4d55-8316-cba30dcda65c', 'Atangcho97@gmail.coa', NULL, NULL, false, '2025-06-27 07:37:04.097739+00', '2025-06-27 07:37:04.097739+00', NULL, NULL, false),
  ('508d03b0-2a05-445e-84f0-a76ebb72be4b', 'kufaustameme@gmail.com', NULL, NULL, false, '2025-06-18 19:00:53.603185+00', '2025-06-18 19:00:53.603185+00', NULL, NULL, false),
  ('6f8173dc-a917-48a3-a7c4-65f232a4d4c6', 'fritzgermain@gmail.com', NULL, NULL, false, '2025-07-01 17:12:28.556245+00', '2025-07-01 17:12:28.556245+00', NULL, NULL, false),
  ('cda1fc60-06b9-4482-a897-7483906a9ca7', 'maximilianmuster@gmail.com', NULL, NULL, false, '2025-07-02 07:52:15.612789+00', '2025-07-02 07:52:15.612789+00', NULL, NULL, false),
  ('ce495018-2be1-4661-a438-a48d2417ec43', 'lloydfarrel@gmail.com', NULL, NULL, false, '2025-07-03 09:02:37.583489+00', '2025-07-03 09:02:37.583489+00', NULL, NULL, false),
  ('71b68f1e-159b-4940-8c4a-a928b5f3b60f', 'testinguser@gmail.com', NULL, NULL, false, '2025-07-04 21:22:53.205016+00', '2025-07-04 21:22:53.205016+00', NULL, NULL, false),
  ('d7b5eb68-e28f-4041-a7cd-86119250b737', 'petituser@gmail.com', NULL, NULL, false, '2025-07-08 18:02:05.092882+00', '2025-07-08 18:02:05.092882+00', NULL, NULL, false),
  ('71f6b53d-5f13-45ac-a183-a5ada55a0b4d', 'cihaduser@gmail.com', NULL, NULL, false, '2025-07-08 18:56:15.294199+00', '2025-07-08 18:56:15.294199+00', NULL, NULL, false),
  ('92162225-bbfd-454d-bc08-a105df5b6fc4', 'johnstonesuser@gmail.com', NULL, NULL, false, '2025-07-11 07:31:43.455536+00', '2025-07-11 07:31:43.455536+00', NULL, NULL, false),
  ('5f8ce6ae-c01a-499d-b20d-062b02a974ed', 'tonyuser@gmail.com', NULL, NULL, false, '2025-07-17 12:50:50.366158+00', '2025-07-17 12:50:50.366158+00', NULL, NULL, false)
ON CONFLICT (id) DO NOTHING;

-- Add comment
COMMENT ON TABLE tutors IS 'Tutor profiles restored with complete information on 2025-08-08';
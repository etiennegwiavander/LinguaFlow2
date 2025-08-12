-- Restore tutor profiles only (without problematic student data)

-- First, temporarily disable RLS and triggers for bulk insert
SET session_replication_role = replica;

-- Restore tutor profiles
INSERT INTO "public"."tutors" ("id", "email", "primary_teaching_language", "is_admin", "created_at", "updated_at", "name", "avatar_url", "deleted_at", "deletion_scheduled") VALUES
	('f1697f1b-756a-446c-a285-b317ee0195eb', 'fongwa14@yahoo.com', NULL, false, '2025-06-28 01:50:49.080248+00', '2025-06-28 01:50:49.080248+00', NULL, NULL, NULL, false),
	('a55f3995-16ef-4d55-8316-cba30dcda65c', 'atangcho97@gmail.coa', NULL, false, '2025-06-27 07:37:03.236046+00', '2025-06-27 07:37:03.236046+00', NULL, NULL, NULL, false),
	('508d03b0-2a05-445e-84f0-a76ebb72be4b', 'kufaustameme@gmail.com', 'English', false, '2025-06-18 19:00:53.603185+00', '2025-08-05 11:01:55.865722+00', 'Kufausta Meme', 'https://urmuwjcjcyohsrkgyapl.supabase.co/storage/v1/object/public/profiles/avatars/508d03b0-2a05-445e-84f0-a76ebb72be4b-0.8234567890123456.png', NULL, false),
	('2653fcbc-3e74-4676-ac29-b95582c6e3ac', 'judecho899@gmail.com', NULL, false, '2025-06-27 07:30:50.798715+00', '2025-06-27 07:30:50.798715+00', NULL, NULL, NULL, false),
	('0dc0e0d9-6b52-4605-a63f-5dd920150b64', 'beiblessing@gmail.com', NULL, false, '2025-06-18 19:52:09.530686+00', '2025-06-18 19:52:09.530686+00', NULL, NULL, NULL, false),
	('71b68f1e-159b-4940-8c4a-a928b5f3b60f', 'paulina@devpost.com', NULL, false, '2025-07-04 21:21:58.296005+00', '2025-07-04 21:21:58.296005+00', NULL, NULL, NULL, false),
	('d7b5eb68-e28f-4041-a7cd-86119250b737', 'poloyr@gmail.com', NULL, false, '2025-07-08 18:00:00.218398+00', '2025-07-08 18:00:00.218398+00', NULL, NULL, NULL, false),
	('45619a2b-5490-4fb4-87db-96c8dd4b1d9b', 'johnowens993@gmail.com', NULL, false, '2025-06-27 09:27:01.172641+00', '2025-06-27 09:27:01.172641+00', NULL, NULL, NULL, false),
	('6f8173dc-a917-48a3-a7c4-65f232a4d4c6', 'fritzimpah@gmail.com', NULL, false, '2025-07-01 17:04:38.033457+00', '2025-07-01 17:04:38.033457+00', NULL, NULL, NULL, false),
	('ce495018-2be1-4661-a438-a48d2417ec43', 'kufaustasangha@gmail.com', NULL, false, '2025-07-03 06:58:24.492372+00', '2025-07-03 06:58:24.492372+00', NULL, NULL, NULL, false),
	('cda1fc60-06b9-4482-a897-7483906a9ca7', 'atangcho97@gmail.com', NULL, false, '2025-06-27 07:37:16.506279+00', '2025-06-27 07:37:16.506279+00', NULL, NULL, NULL, false),
	('71f6b53d-5f13-45ac-a183-a5ada55a0b4d', 'cihadp@gmail.com', NULL, false, '2025-07-08 18:54:57.486885+00', '2025-07-08 18:54:57.486885+00', NULL, NULL, NULL, false),
	('92162225-bbfd-454d-bc08-a105df5b6fc4', 'conormonaghan44@gmail.com', NULL, false, '2025-07-11 07:30:26.196663+00', '2025-07-11 07:30:26.196663+00', NULL, NULL, NULL, false),
	('5f8ce6ae-c01a-499d-b20d-062b02a974ed', 'tony.peacham@gmail.com', NULL, false, '2025-07-17 12:49:07.138491+00', '2025-07-17 12:49:07.138491+00', NULL, NULL, NULL, false),
	('c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', 'vanshidy@gmail.com', 'English', true, '2025-06-07 10:57:33.612428+00', '2025-06-07 10:57:33.612428+00', 'Etienne Gwiavander', 'https://urmuwjcjcyohsrkgyapl.supabase.co/storage/v1/object/public/profiles/avatars/c1c99ecd-5a36-4cfb-9fc2-80dd771c9689-0.7668527482552047.png', NULL, false)
ON CONFLICT (id) DO UPDATE SET
	email = EXCLUDED.email,
	primary_teaching_language = EXCLUDED.primary_teaching_language,
	is_admin = EXCLUDED.is_admin,
	name = EXCLUDED.name,
	avatar_url = EXCLUDED.avatar_url,
	updated_at = EXCLUDED.updated_at;

-- Re-enable normal replication
SET session_replication_role = DEFAULT;

-- Tutor profiles restored successfully
-- Restore students data with cleaned text fields

-- First, temporarily disable RLS and triggers for bulk insert
SET session_replication_role = replica;

-- Restore basic student records (simplified to avoid SQL syntax issues)
INSERT INTO "public"."students" ("id", "tutor_id", "name", "target_language", "end_goals", "created_at", "updated_at", "level", "native_language") VALUES
	('6a8dbafa-b09c-433d-9bac-242943a9b0d9', 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', 'Loisel', 'en', 'In his job as an accountant, the main language is English and he would like to understand and communicate in English.', '2025-06-27 06:02:13.742392+00', '2025-06-27 06:02:13.742392+00', 'b1', 'fr'),
	('c6564274-1307-4cba-95ca-929759cf7117', '45619a2b-5490-4fb4-87db-96c8dd4b1d9b', 'test', 'en', 'achieve a c1 level in 3 months', '2025-06-27 09:33:18.214278+00', '2025-06-27 09:33:18.214278+00', 'b1', 'it'),
	('2a28b7dc-8ab1-4bda-91c4-4371cd52a00b', 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', 'Rafal', 'en', 'Wants to maintain fluency. Have long conversations', '2025-06-27 18:45:38.509157+00', '2025-06-27 18:45:38.509157+00', 'c1', 'pl'),
	('6bf315b9-4eee-4346-88b9-c8584f54f650', 'f1697f1b-756a-446c-a285-b317ee0195eb', 'Ebua', 'en', 'Speak fluently, improve vocabularies, talk about sports, talk about religion', '2025-06-28 01:55:14.145589+00', '2025-06-28 01:55:14.145589+00', 'b1', 'it'),
	('aa3f4b94-b50f-422d-ab8f-849ec08bc3a0', '0dc0e0d9-6b52-4605-a63f-5dd920150b64', 'Alexandra', 'en', 'Speak fluently, understand and use basic grammar, learn new vocabularies, preparing for a new job in tourism and hotel management', '2025-06-18 20:00:52.887521+00', '2025-06-18 20:00:52.887521+00', 'b1', 'none'),
	('0424db41-45c5-4b6e-a111-81ebfa32576d', 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', 'Fausta', 'en', 'To build confidence in conversation', '2025-06-11 12:52:03.612059+00', '2025-06-11 12:52:03.612059+00', 'b1', 'fr'),
	('5dd0d10c-b984-47bf-bcfa-f2f8245f60a5', 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', 'Etienne', 'en', 'To become fluent in English', '2025-06-07 21:00:03.771059+00', '2025-06-07 21:00:03.771059+00', 'b1', 'fr'),
	('cf038b11-791b-4306-b5e3-1870371a60f3', 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', 'Pawel', 'en', 'Wants to understand and speak English fluently', '2025-06-30 13:06:09.651039+00', '2025-06-30 13:06:09.651039+00', 'b1', 'pl'),
	('e43466be-2cab-4286-afb9-ad48afc3373a', 'f1697f1b-756a-446c-a285-b317ee0195eb', 'Agnieska', 'en', 'Speak fluently, learn new vocabularies, learn and talk about polish law and politics', '2025-07-22 15:28:32.656038+00', '2025-07-22 15:28:32.656038+00', 'c1', 'pl'),
	('8dfb62f6-39aa-4cf9-8b7c-4affda686121', 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', 'Krzysztof', 'en', 'To speak English confidently', '2025-06-23 19:22:58.452231+00', '2025-06-23 19:22:58.452231+00', 'c1', 'pl'),
	('3ea17d1d-d785-4d99-97c0-d7f74ece9db7', 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', 'Julia', 'en', 'Wants to be fluent in English for studies in school', '2025-06-26 07:00:49.571738+00', '2025-06-26 07:00:49.571738+00', 'b1', 'pl'),
	('2caa2254-0d37-4840-b4b4-a72db6f39a2d', '6f8173dc-a917-48a3-a7c4-65f232a4d4c6', 'Fritz', 'fr', 'To be very proficient in french', '2025-07-01 17:12:28.556245+00', '2025-07-01 17:12:28.556245+00', 'a1', 'en'),
	('924c7c33-1869-4216-9bd1-aa8ce58e5073', 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', 'test', 'fr', 'Parler couramment le français', '2025-07-02 05:59:10.511915+00', '2025-07-02 05:59:10.511915+00', 'a2', 'en'),
	('eb64a36e-2d00-4a7a-81a6-a7324f8535bf', 'cda1fc60-06b9-4482-a897-7483906a9ca7', 'max', 'en', 'c2', '2025-07-02 07:52:15.612789+00', '2025-07-02 07:52:15.612789+00', 'b2', 'en'),
	('2473f935-c707-416e-bdbd-9fc50db155c6', 'ce495018-2be1-4661-a438-a48d2417ec43', 'Lloyd Farrel', 'en', 'Speak fluently with the right words and sentence constructions', '2025-07-03 09:02:37.583489+00', '2025-07-03 09:02:37.583489+00', 'a2', 'de'),
	('15a10d57-0663-400c-8582-d02f4a257f01', '71b68f1e-159b-4940-8c4a-a928b5f3b60f', 'testing', 'es', 'fluency', '2025-07-04 21:22:53.205016+00', '2025-07-04 21:22:53.205016+00', 'c1', 'en'),
	('2ddbe16f-ba10-4995-bc0f-1d647f3d105d', 'd7b5eb68-e28f-4041-a7cd-86119250b737', 'Petit', 'fr', 'Learn', '2025-07-08 18:02:05.092882+00', '2025-07-08 18:02:05.092882+00', 'a1', 'en'),
	('8259ea61-c7c2-415d-ab4d-0d6bfb317758', '71f6b53d-5f13-45ac-a183-a5ada55a0b4d', 'Cihad', 'en', 'He want to speak fluently', '2025-07-08 18:56:15.294199+00', '2025-07-08 18:56:15.294199+00', 'b1', NULL),
	('3c7063c3-9a5c-4ac7-ac5f-40744fbf4b03', '92162225-bbfd-454d-bc08-a105df5b6fc4', 'John Stones', 'en', 'speak fluently', '2025-07-11 07:31:43.455536+00', '2025-07-11 07:31:43.455536+00', 'c1', 'es'),
	('df15a574-4c6e-4c56-ae81-64a5b8f32cdd', '5f8ce6ae-c01a-499d-b20d-062b02a974ed', 'Tony', 'zh', 'Full fluency', '2025-07-17 12:50:50.366158+00', '2025-07-17 12:50:50.366158+00', 'a1', 'en'),
	('efd9f910-db8a-4b13-8a6d-215b2609d19b', 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', 'Ewa', 'en', 'Wants to speak English', '2025-06-16 17:57:16.226498+00', '2025-06-16 17:57:16.226498+00', 'a2', 'fr'),
	('494618d1-0e8e-4060-b194-07f49d620ec2', 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', 'Ula', 'en', 'My main goal is to improve my English, especially for job interviews related to finance and data analysis roles', '2025-07-23 18:48:30.834653+00', '2025-07-23 18:48:30.834653+00', 'c1', 'pl'),
	('3e9a5fe6-8024-44b8-937e-a93a0369c121', 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', 'Ula', 'en', 'My main goal is to improve my English, especially for job interviews related to finance and data analysis roles', '2025-07-23 18:48:31.398414+00', '2025-07-23 18:48:31.398414+00', 'c1', 'pl'),
	('ea2cc6c3-5681-4f74-a30c-270b0d4180ac', 'f1697f1b-756a-446c-a285-b317ee0195eb', 'YIGIT', 'en', 'to speak fluently, improve confidence, talk about business, physical therapy, learn new vocabularies', '2025-07-24 12:49:54.573792+00', '2025-07-24 12:49:54.573792+00', 'a2', 'es'),
	('0e7a34cf-aa63-4cf0-adee-7a80deb36360', '508d03b0-2a05-445e-84f0-a76ebb72be4b', 'Eva Mossol', 'en', 'She wants to be able to find her words when expressing herself on various topics', '2025-07-25 11:56:55.546368+00', '2025-07-25 11:56:55.546368+00', 'b1', 'de'),
	('231d5e2b-8b56-408d-b396-5bde7ef05ea2', 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', 'test 2', 'en', 'speak English fluently, confident in speaking, and to travel to other countries', '2025-08-01 17:37:01.482989+00', '2025-08-01 17:37:01.482989+00', 'b2', 'fr')
ON CONFLICT (id) DO UPDATE SET
	tutor_id = EXCLUDED.tutor_id,
	name = EXCLUDED.name,
	target_language = EXCLUDED.target_language,
	end_goals = EXCLUDED.end_goals,
	level = EXCLUDED.level,
	native_language = EXCLUDED.native_language,
	updated_at = EXCLUDED.updated_at;

-- Re-enable normal replication
SET session_replication_role = DEFAULT;

-- Students data restored successfully
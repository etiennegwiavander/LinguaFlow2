-- Restore tutor data that was accidentally deleted
-- This migration restores all tutor records needed for the students

-- Insert tutor data using VALUES clause
INSERT INTO tutors (id, email, name, created_at, updated_at) 
VALUES 
  ('c1c99ecd-5a36-4cfb-9fc2-80dd771c9689', 'tutor1@example.com', 'Tutor 1', '2025-06-01 00:00:00+00', '2025-06-01 00:00:00+00'),
  ('45619a2b-5490-4fb4-87db-96c8dd4b1d9b', 'tutor2@example.com', 'Tutor 2', '2025-06-01 00:00:00+00', '2025-06-01 00:00:00+00'),
  ('f1697f1b-756a-446c-a285-b317ee0195eb', 'tutor3@example.com', 'Tutor 3', '2025-06-01 00:00:00+00', '2025-06-01 00:00:00+00'),
  ('0dc0e0d9-6b52-4605-a63f-5dd920150b64', 'tutor4@example.com', 'Tutor 4', '2025-06-01 00:00:00+00', '2025-06-01 00:00:00+00'),
  ('6f8173dc-a917-48a3-a7c4-65f232a4d4c6', 'tutor5@example.com', 'Tutor 5', '2025-06-01 00:00:00+00', '2025-06-01 00:00:00+00'),
  ('cda1fc60-06b9-4482-a897-7483906a9ca7', 'tutor6@example.com', 'Tutor 6', '2025-06-01 00:00:00+00', '2025-06-01 00:00:00+00'),
  ('ce495018-2be1-4661-a438-a48d2417ec43', 'tutor7@example.com', 'Tutor 7', '2025-06-01 00:00:00+00', '2025-06-01 00:00:00+00'),
  ('71b68f1e-159b-4940-8c4a-a928b5f3b60f', 'tutor8@example.com', 'Tutor 8', '2025-06-01 00:00:00+00', '2025-06-01 00:00:00+00'),
  ('d7b5eb68-e28f-4041-a7cd-86119250b737', 'tutor9@example.com', 'Tutor 9', '2025-06-01 00:00:00+00', '2025-06-01 00:00:00+00'),
  ('71f6b53d-5f13-45ac-a183-a5ada55a0b4d', 'tutor10@example.com', 'Tutor 10', '2025-06-01 00:00:00+00', '2025-06-01 00:00:00+00'),
  ('92162225-bbfd-454d-bc08-a105df5b6fc4', 'tutor11@example.com', 'Tutor 11', '2025-06-01 00:00:00+00', '2025-06-01 00:00:00+00'),
  ('5f8ce6ae-c01a-499d-b20d-062b02a974ed', 'tutor12@example.com', 'Tutor 12', '2025-06-01 00:00:00+00', '2025-06-01 00:00:00+00'),
  ('508d03b0-2a05-445e-84f0-a76ebb72be4b', 'tutor13@example.com', 'Tutor 13', '2025-06-01 00:00:00+00', '2025-06-01 00:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- Add a comment to track this restoration
COMMENT ON TABLE tutors IS 'Tutor data restored on 2025-08-08 to support student data restoration';
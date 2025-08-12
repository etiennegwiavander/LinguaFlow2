-- Remove sample data that may be causing new students to have pre-existing lessons
-- This migration cleans up any sample data that shouldn't be in production

-- First, let's identify and remove any sample lessons that might be causing issues
DELETE FROM lessons 
WHERE tutor_id IN (
  -- Remove lessons from specific sample tutor IDs that appear to be test data
  'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689',
  '45619a2b-5490-4fb4-87db-96c8dd4b1d9b',
  'f1697f1b-756a-446c-a285-b317ee0195eb',
  '0dc0e0d9-6b52-4605-a63f-5dd920150b64',
  '6f8173dc-a917-48a3-a7c4-65f232a4d4c6',
  'cda1fc60-06b9-4482-a897-7483906a9ca7',
  'ce495018-2be1-4661-a438-a48d2417ec43',
  '71b68f1e-159b-4940-8c4a-a928b5f3b60f',
  'd7b5eb68-e28f-4041-a7cd-86119250b737',
  '71f6b53d-5f13-45ac-a183-a5ada55a0b4d',
  '92162225-bbfd-454d-bc08-a105df5b6fc4',
  '5f8ce6ae-c01a-499d-b20d-062b02a974ed',
  '508d03b0-2a05-445e-84f0-a76ebb72be4b'
);

-- Remove sample students that might be causing confusion
DELETE FROM students 
WHERE tutor_id IN (
  -- Remove students from specific sample tutor IDs that appear to be test data
  'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689',
  '45619a2b-5490-4fb4-87db-96c8dd4b1d9b',
  'f1697f1b-756a-446c-a285-b317ee0195eb',
  '0dc0e0d9-6b52-4605-a63f-5dd920150b64',
  '6f8173dc-a917-48a3-a7c4-65f232a4d4c6',
  'cda1fc60-06b9-4482-a897-7483906a9ca7',
  'ce495018-2be1-4661-a438-a48d2417ec43',
  '71b68f1e-159b-4940-8c4a-a928b5f3b60f',
  'd7b5eb68-e28f-4041-a7cd-86119250b737',
  '71f6b53d-5f13-45ac-a183-a5ada55a0b4d',
  '92162225-bbfd-454d-bc08-a105df5b6fc4',
  '5f8ce6ae-c01a-499d-b20d-062b02a974ed',
  '508d03b0-2a05-445e-84f0-a76ebb72be4b'
);

-- Remove any calendar events associated with sample data
DELETE FROM calendar_events 
WHERE tutor_id IN (
  'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689',
  '45619a2b-5490-4fb4-87db-96c8dd4b1d9b',
  'f1697f1b-756a-446c-a285-b317ee0195eb',
  '0dc0e0d9-6b52-4605-a63f-5dd920150b64',
  '6f8173dc-a917-48a3-a7c4-65f232a4d4c6',
  'cda1fc60-06b9-4482-a897-7483906a9ca7',
  'ce495018-2be1-4661-a438-a48d2417ec43',
  '71b68f1e-159b-4940-8c4a-a928b5f3b60f',
  'd7b5eb68-e28f-4041-a7cd-86119250b737',
  '71f6b53d-5f13-45ac-a183-a5ada55a0b4d',
  '92162225-bbfd-454d-bc08-a105df5b6fc4',
  '5f8ce6ae-c01a-499d-b20d-062b02a974ed',
  '508d03b0-2a05-445e-84f0-a76ebb72be4b'
);

-- Add a comment to track this cleanup
COMMENT ON SCHEMA public IS 'Sample data cleanup performed on 2025-08-08 to prevent new students from inheriting pre-existing lessons';

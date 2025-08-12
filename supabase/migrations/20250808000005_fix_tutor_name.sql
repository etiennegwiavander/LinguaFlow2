-- Fix tutor name that wasn't updated in the previous migration

-- Update your tutor profile with the name
UPDATE tutors 
SET 
  name = 'Etienne Gwiavander'
WHERE id = 'c1c99ecd-5a36-4cfb-9fc2-80dd771c9689';

-- Verify the update worked
COMMENT ON TABLE tutors IS 'Tutor name updated for Etienne Gwiavander on 2025-08-08';
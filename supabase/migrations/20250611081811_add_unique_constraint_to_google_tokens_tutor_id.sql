DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'google_tokens_tutor_id_key'
  ) THEN
    ALTER TABLE google_tokens ADD CONSTRAINT google_tokens_tutor_id_key UNIQUE (tutor_id);
  END IF;
END $$;

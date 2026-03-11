-- Remove duplicate rows keeping only the earliest one per group
DELETE FROM public.challenge_staging
WHERE id NOT IN (
  SELECT DISTINCT ON (workshop_id, subject_id, card_id, user_id) id
  FROM public.challenge_staging
  ORDER BY workshop_id, subject_id, card_id, user_id, created_at ASC
);

-- Now add the unique constraint
ALTER TABLE public.challenge_staging 
ADD CONSTRAINT challenge_staging_unique_card 
UNIQUE (workshop_id, subject_id, card_id, user_id);
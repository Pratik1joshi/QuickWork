-- SQL Query to add workers_needed column to jobs table
-- Copy and paste this in Supabase SQL Editor

-- Add the workers_needed column
ALTER TABLE public.jobs 
ADD COLUMN workers_needed INTEGER DEFAULT 1 NOT NULL;

-- Update existing jobs to have 1 worker needed by default
UPDATE public.jobs 
SET workers_needed = 1 
WHERE workers_needed IS NULL;

-- Add constraint to ensure workers_needed is positive
ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_workers_needed_positive 
CHECK (workers_needed > 0 AND workers_needed <= 100);

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'jobs' AND column_name = 'workers_needed';

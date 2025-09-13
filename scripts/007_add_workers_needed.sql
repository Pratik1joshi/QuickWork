-- Add workers_needed column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN workers_needed INTEGER DEFAULT 1 NOT NULL;

-- Update existing jobs to have 1 worker needed by default
UPDATE public.jobs 
SET workers_needed = 1 
WHERE workers_needed IS NULL;

-- Add constraint to ensure workers_needed is positive
ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_workers_needed_positive 
CHECK (workers_needed > 0);

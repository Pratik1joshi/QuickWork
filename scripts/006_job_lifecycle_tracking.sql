-- Add job lifecycle tracking columns
-- Run this script in your Supabase SQL editor

-- Add completion and cancellation timestamps to jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Add comment to track job lifecycle
COMMENT ON COLUMN jobs.completed_at IS 'Timestamp when the job was marked as completed';
COMMENT ON COLUMN jobs.cancelled_at IS 'Timestamp when the job was cancelled';

-- Create index for efficient queries on completed jobs
CREATE INDEX IF NOT EXISTS idx_jobs_completed_at ON jobs(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_cancelled_at ON jobs(cancelled_at) WHERE cancelled_at IS NOT NULL;

-- Update existing completed jobs (optional - sets current timestamp for existing completed jobs)
-- UPDATE jobs SET completed_at = NOW() WHERE status = 'completed' AND completed_at IS NULL;

-- Update existing cancelled jobs (optional - sets current timestamp for existing cancelled jobs)  
-- UPDATE jobs SET cancelled_at = NOW() WHERE status = 'cancelled' AND cancelled_at IS NULL;

-- Add archived status option (if not already present)
-- This script will not fail if the status type already includes 'archived'
DO $$ 
BEGIN
    BEGIN
        ALTER TYPE job_status ADD VALUE 'archived';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

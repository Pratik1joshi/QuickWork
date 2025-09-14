-- Simple migration to ensure job status enum has all needed values
-- Run this script in your Supabase SQL editor

-- Check current job_status enum values
-- SELECT unnest(enum_range(NULL::job_status));

-- Add missing status values if they don't exist
DO $$ 
BEGIN
    -- Add 'archived' status if it doesn't exist
    BEGIN
        ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'archived';
    EXCEPTION
        WHEN duplicate_object THEN 
            RAISE NOTICE 'archived status already exists';
    END;
    
    -- Add other statuses that might be missing
    BEGIN
        ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'completed';
    EXCEPTION
        WHEN duplicate_object THEN 
            RAISE NOTICE 'completed status already exists';
    END;
    
    BEGIN
        ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'cancelled';
    EXCEPTION
        WHEN duplicate_object THEN 
            RAISE NOTICE 'cancelled status already exists';
    END;
    
    BEGIN
        ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'in_progress';
    EXCEPTION
        WHEN duplicate_object THEN 
            RAISE NOTICE 'in_progress status already exists';
    END;
    
    BEGIN
        ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'assigned';
    EXCEPTION
        WHEN duplicate_object THEN 
            RAISE NOTICE 'assigned status already exists';
    END;
END $$;

-- Verify all status values exist
SELECT unnest(enum_range(NULL::job_status)) as available_statuses;

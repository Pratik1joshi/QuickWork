-- Simplified demo user creation to work with Supabase auth system
-- Note: This script creates a profile entry for the demo user
-- The actual auth user should be created through the Supabase dashboard or auth API

-- First, let's modify the profiles table to make phone optional for demo purposes
ALTER TABLE public.profiles ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.profiles ADD COLUMN email VARCHAR(255);

-- Create a demo profile that can be linked when the auth user signs up
-- This will be linked automatically when demo@quickwork.nepal signs up
INSERT INTO public.profiles (
  id,
  email,
  phone,
  full_name,
  location,
  rating,
  total_jobs_completed,
  is_verified,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'demo@quickwork.nepal',
  '+977 9800000000',
  'Demo User',
  'Kathmandu, Nepal',
  4.8,
  25,
  true,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  full_name = EXCLUDED.full_name,
  location = EXCLUDED.location,
  rating = EXCLUDED.rating,
  total_jobs_completed = EXCLUDED.total_jobs_completed,
  is_verified = EXCLUDED.is_verified,
  updated_at = now();

-- Create some demo jobs for the demo user
INSERT INTO public.jobs (
  id,
  title,
  description,
  category_id,
  employer_id,
  budget_min,
  budget_max,
  location,
  status,
  urgency,
  estimated_duration,
  requirements,
  created_at
) VALUES 
(
  uuid_generate_v4(),
  'House Cleaning Service Needed',
  'Looking for reliable house cleaning service for a 3-bedroom apartment in Kathmandu. Regular weekly cleaning required.',
  (SELECT id FROM job_categories WHERE name = 'Cleaning' LIMIT 1),
  '00000000-0000-0000-0000-000000000001'::uuid,
  2000.00,
  3500.00,
  'Kathmandu, Nepal',
  'open',
  'normal',
  '3-4 hours',
  'Experience with house cleaning, own cleaning supplies preferred',
  now() - interval '2 days'
),
(
  uuid_generate_v4(),
  'Plumbing Repair - Kitchen Sink',
  'Kitchen sink is leaking and needs immediate repair. Looking for experienced plumber.',
  (SELECT id FROM job_categories WHERE name = 'Plumbing' LIMIT 1),
  '00000000-0000-0000-0000-000000000001'::uuid,
  1500.00,
  2500.00,
  'Lalitpur, Nepal',
  'open',
  'high',
  '1-2 hours',
  'Licensed plumber with tools, available today or tomorrow',
  now() - interval '1 day'
);

-- Add email field to profiles table and create demo user
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Create a demo profile that will be linked when the user signs up
INSERT INTO profiles (
  id,
  full_name,
  email,
  phone,
  location,
  is_verified,
  total_jobs_completed,
  rating,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Demo User',
  'demo@quickwork.nepal',
  '+977-9800000000',
  'Kathmandu, Nepal',
  true,
  15,
  4.8,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

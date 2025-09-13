-- Seed demo jobs
INSERT INTO public.jobs (
  title,
  description,
  category_id,
  employer_id,
  budget_min,
  budget_max,
  location,
  urgency,
  estimated_duration,
  requirements,
  contact_preference,
  status
) VALUES
-- Cleaning jobs
(
  'House Cleaning Needed',
  'Need someone to clean a 3-bedroom apartment. Includes kitchen, bathrooms, and living areas. All cleaning supplies provided.',
  (SELECT id FROM job_categories WHERE name = 'Cleaning'),
  (SELECT id FROM profiles LIMIT 1),
  1500.00,
  2500.00,
  'Thamel, Kathmandu',
  'normal',
  '3-4 hours',
  'Experience with cleaning preferred. Must bring own transportation.',
  'app',
  'open'
),
(
  'Office Cleaning Service',
  'Regular cleaning service needed for a small office space. Weekly cleaning including dusting, vacuuming, and bathroom cleaning.',
  (SELECT id FROM job_categories WHERE name = 'Cleaning'),
  (SELECT id FROM profiles LIMIT 1),
  2000.00,
  3000.00,
  'Putalisadak, Kathmandu',
  'normal',
  '2 hours per week',
  'Reliable and trustworthy individual needed.',
  'app',
  'open'
),

-- Delivery jobs
(
  'Document Delivery Service',
  'Need someone to deliver important documents across Kathmandu valley. Multiple deliveries throughout the day.',
  (SELECT id FROM job_categories WHERE name = 'Delivery'),
  (SELECT id FROM profiles LIMIT 1),
  1000.00,
  2000.00,
  'Kathmandu Valley',
  'high',
  'Full day',
  'Must have motorcycle/scooter. Valid license required.',
  'phone',
  'open'
),
(
  'Grocery Delivery',
  'Part-time grocery delivery service. Flexible hours, good tips included.',
  (SELECT id FROM job_categories WHERE name = 'Delivery'),
  (SELECT id FROM profiles LIMIT 1),
  800.00,
  1500.00,
  'Pokhara',
  'normal',
  '4-6 hours',
  'Clean driving record, own vehicle preferred.',
  'app',
  'open'
),

-- Handyman jobs
(
  'Furniture Assembly',
  'Need help assembling IKEA furniture for a new apartment. About 6-7 pieces total.',
  (SELECT id FROM job_categories WHERE name = 'Handyman'),
  (SELECT id FROM profiles LIMIT 1),
  2000.00,
  3500.00,
  'Lazimpat, Kathmandu',
  'normal',
  '4-5 hours',
  'Basic tools knowledge required. Experience with furniture assembly preferred.',
  'app',
  'open'
),
(
  'Plumbing Repair',
  'Leaky faucet in kitchen needs fixing. Parts will be provided.',
  (SELECT id FROM job_categories WHERE name = 'Handyman'),
  (SELECT id FROM profiles LIMIT 1),
  1200.00,
  1800.00,
  'Baneshwor, Kathmandu',
  'urgent',
  '1-2 hours',
  'Plumbing experience required.',
  'phone',
  'open'
),

-- Gardening jobs
(
  'Garden Maintenance',
  'Weekly garden maintenance including mowing, trimming, and weeding.',
  (SELECT id FROM job_categories WHERE name = 'Gardening'),
  (SELECT id FROM profiles LIMIT 1),
  1800.00,
  2500.00,
  'Budhanilkantha, Kathmandu',
  'normal',
  '3 hours per week',
  'Gardening tools and experience preferred.',
  'app',
  'open'
),

-- Tutoring jobs
(
  'Math Tutoring for Grade 10',
  'Need math tutor for grade 10 student. Focus on algebra and geometry.',
  (SELECT id FROM job_categories WHERE name = 'Tutoring'),
  (SELECT id FROM profiles LIMIT 1),
  1500.00,
  2000.00,
  'Patan',
  'normal',
  '2 hours per session',
  'Teaching experience and math background required.',
  'app',
  'open'
),

-- Tech Support jobs
(
  'Computer Setup Help',
  'Need help setting up a new computer, installing software, and basic troubleshooting.',
  (SELECT id FROM job_categories WHERE name = 'Tech Support'),
  (SELECT id FROM profiles LIMIT 1),
  2500.00,
  4000.00,
  'Jawalakhel, Lalitpur',
  'normal',
  '3-4 hours',
  'Good computer knowledge required.',
  'app',
  'open'
),

-- Moving jobs
(
  'House Moving Assistance',
  'Need help moving furniture and boxes to a new apartment. 2nd floor, no elevator.',
  (SELECT id FROM job_categories WHERE name = 'Moving'),
  (SELECT id FROM profiles LIMIT 1),
  3000.00,
  5000.00,
  'Chabahil, Kathmandu',
  'high',
  'Half day',
  'Physical strength required. Must be able to lift heavy items.',
  'phone',
  'open'
),

-- Pet Care jobs
(
  'Dog Walking Service',
  'Daily dog walking for a friendly golden retriever. 45-minute walks, twice daily.',
  (SELECT id FROM job_categories WHERE name = 'Pet Care'),
  (SELECT id FROM profiles LIMIT 1),
  1200.00,
  1800.00,
  'Baluwatar, Kathmandu',
  'normal',
  '1.5 hours per day',
  'Love for dogs and experience with pet care preferred.',
  'app',
  'open'
),

-- Beauty jobs
(
  'Hair Styling Service',
  'Need hair stylist for a small event. Experience with various styles required.',
  (SELECT id FROM job_categories WHERE name = 'Beauty'),
  (SELECT id FROM profiles LIMIT 1),
  5000.00,
  8000.00,
  'Thamel, Kathmandu',
  'high',
  'Full day event',
  'Professional styling experience required.',
  'phone',
  'open'
),

-- Transportation jobs
(
  'Airport Pickup Service',
  'Need reliable driver for airport pickup and drop-off service.',
  (SELECT id FROM job_categories WHERE name = 'Transportation'),
  (SELECT id FROM profiles LIMIT 1),
  2000.00,
  3000.00,
  'Kathmandu Airport',
  'normal',
  'Round trip',
  'Valid license, clean car, good knowledge of routes.',
  'phone',
  'open'
),

-- Photography jobs
(
  'Event Photography',
  'Need photographer for a birthday party. About 3 hours of coverage.',
  (SELECT id FROM job_categories WHERE name = 'Photography'),
  (SELECT id FROM profiles LIMIT 1),
  4000.00,
  6000.00,
  'Bouddha, Kathmandu',
  'normal',
  '3-4 hours',
  'DSLR camera and editing experience required.',
  'app',
  'open'
),

-- Cooking jobs
(
  'Home Chef Service',
  'Need chef for a dinner party. Nepali and continental cuisine.',
  (SELECT id FROM job_categories WHERE name = 'Cooking'),
  (SELECT id FROM profiles LIMIT 1),
  3500.00,
  5500.00,
  'Durbarmarg, Kathmandu',
  'high',
  '4-5 hours',
  'Professional cooking experience required.',
  'phone',
  'open'
),

-- Other jobs (null category_id)
(
  'General House Help',
  'Need general help around the house including cleaning, organizing, and minor repairs.',
  NULL,
  (SELECT id FROM profiles LIMIT 1),
  1800.00,
  2800.00,
  'Swayambhu, Kathmandu',
  'normal',
  '4 hours',
  'Reliable and hardworking individual needed.',
  'app',
  'open'
),
(
  'Car Wash Service',
  'Mobile car washing and detailing service. Come to your location.',
  NULL,
  (SELECT id FROM profiles LIMIT 1),
  1000.00,
  1500.00,
  'Various locations',
  'normal',
  '1-2 hours per car',
  'Car washing experience preferred.',
  'app',
  'open'
)
ON CONFLICT DO NOTHING;

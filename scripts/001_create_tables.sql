-- Qu-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone VARCHAR(15),
  full_name VARCHAR(100) NOT NULL,
  location VARCHAR(100),
  profile_image_url TEXT,
  rating DECIMAL(2,1) DEFAULT 0.0,
  total_jobs_completed INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
); Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone VARCHAR(15) UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  location VARCHAR(100),
  profile_image_url TEXT,
  rating DECIMAL(2,1) DEFAULT 0.0,
  total_jobs_completed INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job categories
CREATE TABLE IF NOT EXISTS public.job_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  icon VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES job_categories(id) ON DELETE SET NULL,
  employer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  budget_min DECIMAL(10,2) NOT NULL,
  budget_max DECIMAL(10,2) NOT NULL,
  location VARCHAR(100) NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled')),
  urgency VARCHAR(20) DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
  estimated_duration VARCHAR(50),
  requirements TEXT,
  contact_preference VARCHAR(20) DEFAULT 'app' CHECK (contact_preference IN ('app', 'phone', 'both')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job applications
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  proposed_rate DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, worker_id)
);

-- Reviews and ratings
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations for chat
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for job_categories
CREATE POLICY "Anyone can view job categories" ON public.job_categories FOR SELECT USING (true);

-- RLS Policies for jobs
CREATE POLICY "Anyone can view jobs" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Employers can create jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = employer_id);
CREATE POLICY "Employers can update own jobs" ON public.jobs FOR UPDATE USING (auth.uid() = employer_id);
CREATE POLICY "Employers can delete own jobs" ON public.jobs FOR DELETE USING (auth.uid() = employer_id);

-- RLS Policies for job_applications
CREATE POLICY "Users can view applications for their jobs or their own applications" ON public.job_applications FOR SELECT USING (
  auth.uid() IN (
    SELECT employer_id FROM jobs WHERE id = job_id
    UNION
    SELECT worker_id
  )
);
CREATE POLICY "Workers can create applications" ON public.job_applications FOR INSERT WITH CHECK (auth.uid() = worker_id);
CREATE POLICY "Workers can update own applications" ON public.job_applications FOR UPDATE USING (auth.uid() = worker_id);

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews for completed jobs" ON public.reviews FOR INSERT WITH CHECK (
  auth.uid() = reviewer_id AND
  EXISTS (
    SELECT 1 FROM jobs 
    WHERE id = job_id 
    AND status = 'completed' 
    AND (employer_id = auth.uid() OR worker_id = auth.uid())
  )
);

-- RLS Policies for conversations
CREATE POLICY "Users can view conversations for their applications" ON public.conversations FOR SELECT USING (
  auth.uid() IN (
    SELECT worker_id FROM job_applications WHERE id = application_id
    UNION
    SELECT employer_id FROM jobs WHERE id = (SELECT job_id FROM job_applications WHERE id = application_id)
  )
);
CREATE POLICY "Users can create conversations for their applications" ON public.conversations FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT worker_id FROM job_applications WHERE id = application_id
    UNION
    SELECT employer_id FROM jobs WHERE id = (SELECT job_id FROM job_applications WHERE id = application_id)
  )
);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT USING (
  auth.uid() IN (
    SELECT sender_id FROM messages WHERE conversation_id = messages.conversation_id
    UNION
    SELECT worker_id FROM job_applications WHERE id = (SELECT application_id FROM conversations WHERE id = conversation_id)
    UNION
    SELECT employer_id FROM jobs WHERE id = (SELECT job_id FROM job_applications WHERE id = (SELECT application_id FROM conversations WHERE id = conversation_id))
  )
);
CREATE POLICY "Users can send messages in their conversations" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  auth.uid() IN (
    SELECT worker_id FROM job_applications WHERE id = (SELECT application_id FROM conversations WHERE id = conversation_id)
    UNION
    SELECT employer_id FROM jobs WHERE id = (SELECT job_id FROM job_applications WHERE id = (SELECT application_id FROM conversations WHERE id = conversation_id))
  )
);

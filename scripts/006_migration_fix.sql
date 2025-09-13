-- Migration to make phone nullable and add email to profiles
-- Run this if the table already exists

-- Make phone nullable
ALTER TABLE public.profiles ALTER COLUMN phone DROP NOT NULL;

-- Add email if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Update the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    CASE WHEN COALESCE(NEW.raw_user_meta_data ->> 'phone', '') != '' THEN NEW.raw_user_meta_data ->> 'phone' ELSE NULL END,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Add chat tables if not exist
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Add policies
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

CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT USING (
  auth.uid() IN (
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

-- Function to auto-create conversation on application
CREATE OR REPLACE FUNCTION public.handle_new_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.conversations (application_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Trigger for auto-creating conversation
DROP TRIGGER IF EXISTS on_application_created ON job_applications;
CREATE TRIGGER on_application_created
  AFTER INSERT ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_application();

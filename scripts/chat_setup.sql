-- Create chat tables for job applications

-- Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

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

-- Function to auto-create conversation when application is created
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

-- Trigger to auto-create conversation
DROP TRIGGER IF EXISTS on_application_created ON job_applications;
CREATE TRIGGER on_application_created
  AFTER INSERT ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_application();

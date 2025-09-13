-- Fix Google OAuth signup database error
-- This script fixes the "Database error saving new user" issue

-- Step 1: Add email column to profiles table if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Step 2: Make sure phone column is nullable (for Google OAuth users who might not have phone)
ALTER TABLE public.profiles ALTER COLUMN phone DROP NOT NULL;

-- Step 3: Update the trigger function to handle Google OAuth users properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Extract full_name from metadata, fallback to display_name or email
  DECLARE
    user_full_name TEXT;
  BEGIN
    user_full_name := COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'display_name', 
      NEW.raw_user_meta_data ->> 'name',
      split_part(NEW.email, '@', 1),
      'User'
    );
    
    INSERT INTO public.profiles (id, email, phone, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      CASE 
        WHEN COALESCE(NEW.raw_user_meta_data ->> 'phone', '') != '' 
        THEN NEW.raw_user_meta_data ->> 'phone' 
        ELSE NULL 
      END,
      user_full_name
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      phone = COALESCE(EXCLUDED.phone, profiles.phone);
    
    RETURN NEW;
  END;
END;
$$;

-- Step 4: Recreate the trigger to ensure it's properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Ensure proper RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 6: Allow public read access for profiles (needed for job applications)
CREATE POLICY "Public profiles read" ON public.profiles 
  FOR SELECT USING (true);

COMMENT ON TABLE public.profiles IS 'User profiles with automatic creation on signup';
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile when a new user signs up';

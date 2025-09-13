-- Quick Fix for Google OAuth Database Error
-- Copy and paste this into your Supabase SQL Editor and run it

-- Add email column if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Make phone nullable
ALTER TABLE public.profiles ALTER COLUMN phone DROP NOT NULL;

-- Fix the trigger function
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
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data ->> 'phone', '') != '' 
      THEN NEW.raw_user_meta_data ->> 'phone' 
      ELSE NULL 
    END,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      split_part(NEW.email, '@', 1),
      'User'
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  
  RETURN NEW;
END;
$$;

-- Function to update profile rating
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles 
  SET rating = (
    SELECT COALESCE(AVG(rating), 0) 
    FROM reviews 
    WHERE reviewee_id = NEW.reviewee_id
  )
  WHERE id = NEW.reviewee_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update rating when review is added
DROP TRIGGER IF EXISTS update_rating_trigger ON reviews;
CREATE TRIGGER update_rating_trigger
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_rating();

-- Function to auto-create profile on signup
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

-- Trigger for auto-creating profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

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

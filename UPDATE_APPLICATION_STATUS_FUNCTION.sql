-- Create a function to allow employers to update application status for their jobs
CREATE OR REPLACE FUNCTION update_application_status(
  application_id UUID,
  new_status TEXT,
  employer_user_id UUID
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  job_owner_id UUID;
BEGIN
  -- First, verify that the employer owns the job for this application
  SELECT j.employer_id INTO job_owner_id
  FROM job_applications ja
  JOIN jobs j ON ja.job_id = j.id
  WHERE ja.id = application_id;
  
  -- Check if the current user is the job owner
  IF job_owner_id != employer_user_id THEN
    RAISE EXCEPTION 'You can only update applications for your own jobs';
  END IF;
  
  -- Update the application status
  UPDATE job_applications 
  SET status = new_status
  WHERE id = application_id;
  
  -- Return the updated application
  SELECT to_json(ja.*) INTO result
  FROM job_applications ja
  WHERE ja.id = application_id;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_application_status TO authenticated;

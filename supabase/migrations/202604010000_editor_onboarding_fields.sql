-- Migration to add detailed editor onboarding fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS age int,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS whatsapp text,
ADD COLUMN IF NOT EXISTS editing_experience text,
ADD COLUMN IF NOT EXISTS software_skills text[],
ADD COLUMN IF NOT EXISTS video_formats text[],
ADD COLUMN IF NOT EXISTS portfolio_links text[],
ADD COLUMN IF NOT EXISTS deadline_handling text,
ADD COLUMN IF NOT EXISTS weekly_availability text,
ADD COLUMN IF NOT EXISTS price_expectation text,
ADD COLUMN IF NOT EXISTS social_media_experience text,
ADD COLUMN IF NOT EXISTS client_types text,
ADD COLUMN IF NOT EXISTS additional_skills text[],
ADD COLUMN IF NOT EXISTS managed_profiles text[],
ADD COLUMN IF NOT EXISTS motivation text,
ADD COLUMN IF NOT EXISTS multiple_projects_handling text,
ADD COLUMN IF NOT EXISTS unique_value text,
ADD COLUMN IF NOT EXISTS willing_to_test boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS additional_comments text,
ADD COLUMN IF NOT EXISTS identity_doc_url text,
ADD COLUMN IF NOT EXISTS onboarding_status text DEFAULT 'pending' CHECK (onboarding_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS onboarding_rejection_reason text;

-- Ensure RLS allows admin to see all profiles
-- (The existing policy "Public profiles are viewable by everyone" covers this for now)

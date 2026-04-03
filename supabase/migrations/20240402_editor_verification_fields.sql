-- 1. Add new fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS identity_doc_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS face_photo_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_status text DEFAULT 'pending' CHECK (onboarding_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_rejection_reason text;

-- 2. Ensure RLS allows the profile to be updated with these fields by the owner
-- Profiles already has policies for update, but ensure they are sufficient
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own onboarding fields'
    ) THEN
        CREATE POLICY "Users can update own onboarding fields" ON profiles
        FOR UPDATE USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);
    END IF;
END $$;

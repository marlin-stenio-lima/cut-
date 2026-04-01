-- 1. Step: Support 'admin' role in profiles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('client', 'editor', 'admin'));

-- 2. Step: Support 'AWAITING_APPROVAL' status in wallet_transactions
ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_status_check;
ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_transactions_status_check 
CHECK (status IN ('PENDING', 'AWAITING_APPROVAL', 'SUCCESS', 'FAILED', 'CANCELLED'));

-- 3. Step: Create platform_settings table
CREATE TABLE IF NOT EXISTS platform_settings (
    id text PRIMARY KEY DEFAULT 'global',
    auto_payout_enabled boolean DEFAULT false,
    updated_at timestamp with time zone DEFAULT now()
);

-- Insert initial setting
INSERT INTO platform_settings (id, auto_payout_enabled) 
VALUES ('global', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Step: Elevate thalesrsampaio@gmail.com to Admin
-- We look for the user ID in auth.users by email and update the profile
UPDATE profiles 
SET role = 'admin' 
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'thalesrsampaio@gmail.com'
);

-- Ensure RLS allows admins to see everything (optional but good practice)
-- Adding a policy for platform_settings
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings" 
ON platform_settings FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

CREATE POLICY "Everyone can read settings" 
ON platform_settings FOR SELECT 
USING (true);

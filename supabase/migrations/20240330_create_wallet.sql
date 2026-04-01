-- Add balance to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS balance decimal(12,2) DEFAULT 0.00;

-- Create wallet_transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  amount decimal(12,2) NOT NULL,
  type text CHECK (type IN ('TOPUP', 'WITHDRAWAL', 'PAYMENT')),
  description text,
  status text CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED')),
  asaas_id text UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for wallet_transactions
CREATE POLICY "Users can see their own transactions" 
ON wallet_transactions FOR SELECT 
USING (auth.uid() = user_id);

-- Ensure profiles.balance is also protected (though profiles already has RLS)
-- Verify existing policies for profiles allow individual updates but not public balance manipulation

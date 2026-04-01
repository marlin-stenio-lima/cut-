-- Add Asaas integration fields to profiles
alter table profiles 
add column if not exists asaas_customer_id text unique,
add column if not exists asaas_billing_type text check (asaas_billing_type in ('BOLETO', 'CREDIT_CARD', 'PIX', 'UNDEFINED')) default 'UNDEFINED';

-- Add subscription status
alter table profiles
add column if not exists subscription_status text default 'inactive',
add column if not exists trial_ends_at timestamp with time zone;

-- Seed data for the payment system

-- Default merchant
INSERT INTO merchants (id, name, api_key, webhook_url, is_active) 
VALUES 
    ('merchant_001', 'Demo Merchant', 'demo_api_key_12345', NULL, true)
ON CONFLICT (id) DO NOTHING;

-- Payment methods
INSERT INTO payment_methods (id, name, code, is_active, config) 
VALUES 
    ('pm_001', 'EcoCash', 'ECO_CASH', true, '{"minAmount": 1, "maxAmount": 10000}'::jsonb),
    ('pm_002', 'Visa/Mastercard', 'VISA_MASTERCARD', true, '{"minAmount": 1, "maxAmount": 50000}'::jsonb),
    ('pm_003', 'Innbucks', 'INNBUCKS', false, '{}'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- Payment System Database Schema

-- Create enum types (PostgreSQL doesn't support IF NOT EXISTS for CREATE TYPE)
DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_code AS ENUM ('ECO_CASH', 'VISA_MASTERCARD', 'INNBUCKS', 'OMARI', 'SMILE_CASH');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE currency_code AS ENUM ('USD', 'ZWG');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Merchants table
CREATE TABLE IF NOT EXISTS merchants (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code payment_method_code NOT NULL,
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}',
    UNIQUE (code)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(255) PRIMARY KEY,
    merchant_id VARCHAR(255) NOT NULL,
    order_reference VARCHAR(255) UNIQUE NOT NULL,
    transaction_reference VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    currency_code currency_code NOT NULL,
    payment_method payment_method_code,
    status transaction_status DEFAULT 'PENDING',
    customer_details JSONB NOT NULL,
    payment_url TEXT,
    return_url TEXT NOT NULL,
    result_url TEXT NOT NULL,
    cancel_url TEXT,
    failure_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id)
);

-- Webhook logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
    id VARCHAR(255) PRIMARY KEY,
    transaction_id VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL,
    response JSONB,
    status_code INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_id ON transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_reference ON transactions(order_reference);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_transaction_id ON webhook_logs(transaction_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at (drop first to avoid duplicate error)
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

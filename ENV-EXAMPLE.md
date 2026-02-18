# Environment Variables Configuration

Copy this to your `.env` file and update with your actual values:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/payment_system

# SmilePay Configuration
SMILEPAY_ENVIRONMENT=sandbox
SMILEPAY_API_KEY=your_api_key_here
SMILEPAY_API_SECRET=your_api_secret_here

# Webhook Configuration
WEBHOOK_SECRET=your_webhook_secret_here

# Node Environment
NODE_ENV=development
```

## Database Setup

1. Install PostgreSQL on your system
2. Create a database: `CREATE DATABASE payment_system;`
3. Update the DATABASE_URL with your PostgreSQL credentials
4. The application will automatically create tables and seed data on first run

## Example DATABASE_URL formats:

- Local PostgreSQL: `postgresql://postgres:password@localhost:5432/payment_system`
- Docker PostgreSQL: `postgresql://postgres:password@postgres:5432/payment_system`
- Cloud PostgreSQL: `postgresql://user:pass@host:port/database?sslmode=require`

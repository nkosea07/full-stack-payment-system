import { initializeDatabase, testConnection } from './index';

let isInitialized = false;
let initializationError: Error | null = null;

export async function ensureDatabaseInitialized() {
  if (isInitialized) return;
  
  try {
    console.log('Testing database connection...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }
    
    console.log('Initializing database schema and seed data...');
    await initializeDatabase();
    
    isInitialized = true;
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    initializationError = error as Error;
    
    // In development, we can continue with a warning
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Database not available. Some features may not work correctly.');
      console.warn('Please check your DATABASE_URL configuration in .env file');
      return;
    }
    
    // In production, fail hard
    throw error;
  }
}

export function isDatabaseReady(): boolean {
  return isInitialized;
}

export function getDatabaseError(): Error | null {
  return initializationError;
}

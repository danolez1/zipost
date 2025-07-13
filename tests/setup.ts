import { beforeAll, afterAll } from 'vitest';
import { db } from '../server/db';

// Global test setup
beforeAll(async () => {
  console.log('Setting up test environment...');
  
  // Ensure database connection is established
  try {
    // Test database connection
    await db.execute('SELECT 1');
    console.log('Database connection established for tests');
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    throw error;
  }
});

// Global test cleanup
afterAll(async () => {
  console.log('Cleaning up test environment...');
  
  // Close database connections if needed
  // Note: Drizzle with mysql2 doesn't require explicit closing in most cases
});
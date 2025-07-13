import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LogModel } from '../../server/models/log';
import { UserModel } from '../../server/models/user';
import { db } from '../../server/db';
import { logs, users } from '../../server/db/schema';
import { eq } from 'drizzle-orm';

describe('LogModel', () => {
  let testUserId: string;
  let createdLogIds: string[] = [];

  const testUser = {
    email: 'logtest@example.com',
    passwordHash: 'hashedpassword123',
    name: 'Log Test User'
  };

  beforeEach(async () => {
    // Create test user
    const user = await UserModel.create(testUser);
    testUserId = user.id;
  });

  afterEach(async () => {
    // Clean up test data
    if (createdLogIds.length > 0) {
      for (const id of createdLogIds) {
        await db.delete(logs).where(eq(logs.id, id));
      }
      createdLogIds = [];
    }
    
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  describe('create', () => {
    it('should create a new log entry', async () => {
      const logData = {
        userId: testUserId,
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        responseTime: '150.5',
        userAgent: 'Test Agent',
        ipAddress: '127.0.0.1',
        timestamp: new Date()
      };

      const log = await LogModel.create(logData);
      createdLogIds.push(log.id);

      expect(log).toBeDefined();
      expect(log.userId).toBe(testUserId);
      expect(log.endpoint).toBe(logData.endpoint);
      expect(log.method).toBe(logData.method);
      expect(log.statusCode).toBe(logData.statusCode);
      expect(log.responseTime).toBe(logData.responseTime);
      expect(log.id).toBeDefined();
    });
  });

  describe('findById', () => {
    let logId: string;

    beforeEach(async () => {
      const log = await LogModel.create({
        userId: testUserId,
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        responseTime: '100.0',
        userAgent: 'Test Agent',
        ipAddress: '127.0.0.1',
        timestamp: new Date()
      });
      logId = log.id;
      createdLogIds.push(logId);
    });

    it('should find log by id', async () => {
      const log = await LogModel.findById(logId);
      
      expect(log).toBeDefined();
      expect(log?.id).toBe(logId);
      expect(log?.userId).toBe(testUserId);
    });

    it('should return null for non-existent id', async () => {
      const log = await LogModel.findById('non-existent-id');
      expect(log).toBeNull();
    });
  });

  describe('findByFilters', () => {
    beforeEach(async () => {
      // Create multiple log entries
      const logs = [
        {
          userId: testUserId,
          endpoint: '/api/users',
          method: 'GET',
          statusCode: 200,
          responseTime: '100.0',
          userAgent: 'Test Agent',
          ipAddress: '127.0.0.1',
          timestamp: new Date('2024-01-01')
        },
        {
          userId: testUserId,
          endpoint: '/api/posts',
          method: 'POST',
          statusCode: 201,
          responseTime: '200.0',
          userAgent: 'Test Agent',
          ipAddress: '127.0.0.1',
          timestamp: new Date('2024-01-02')
        },
        {
          userId: testUserId,
          endpoint: '/api/users',
          method: 'GET',
          statusCode: 404,
          responseTime: '50.0',
          userAgent: 'Test Agent',
          ipAddress: '127.0.0.1',
          timestamp: new Date('2024-01-03')
        }
      ];

      for (const logData of logs) {
        const log = await LogModel.create(logData);
        createdLogIds.push(log.id);
      }
    });

    it('should filter by userId', async () => {
      const results = await LogModel.findByFilters({ userId: testUserId });
      
      expect(results.length).toBe(3);
      expect(results.every(log => log.userId === testUserId)).toBe(true);
    });

    it('should filter by endpoint', async () => {
      const results = await LogModel.findByFilters({ endpoint: '/api/users' });
      
      expect(results.length).toBe(2);
      expect(results.every(log => log.endpoint === '/api/users')).toBe(true);
    });

    it('should filter by status code', async () => {
      const results = await LogModel.findByFilters({ statusCode: 200 });
      
      expect(results.length).toBe(1);
      expect(results[0].statusCode).toBe(200);
    });

    it('should filter by date range', async () => {
      const results = await LogModel.findByFilters({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-02')
      });
      
      expect(results.length).toBe(2);
    });

    it('should respect limit', async () => {
      const results = await LogModel.findByFilters({ limit: 2 });
      
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should respect offset', async () => {
      const firstPage = await LogModel.findByFilters({ limit: 2, offset: 0 });
      const secondPage = await LogModel.findByFilters({ limit: 2, offset: 2 });
      
      expect(firstPage.length).toBeLessThanOrEqual(2);
      expect(secondPage.length).toBeLessThanOrEqual(2);
      
      // Ensure different results (if there are enough logs)
      if (firstPage.length > 0 && secondPage.length > 0) {
        expect(firstPage[0].id).not.toBe(secondPage[0].id);
      }
    });
  });

  describe('findByUserId', () => {
    beforeEach(async () => {
      const log = await LogModel.create({
        userId: testUserId,
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        responseTime: '100.0',
        userAgent: 'Test Agent',
        ipAddress: '127.0.0.1',
        timestamp: new Date()
      });
      createdLogIds.push(log.id);
    });

    it('should find logs by user ID', async () => {
      const results = await LogModel.findByUserId(testUserId);
      
      expect(results.length).toBe(1);
      expect(results[0].userId).toBe(testUserId);
    });
  });

  describe('findByEndpoint', () => {
    beforeEach(async () => {
      const log = await LogModel.create({
        userId: testUserId,
        endpoint: '/api/specific',
        method: 'GET',
        statusCode: 200,
        responseTime: '100.0',
        userAgent: 'Test Agent',
        ipAddress: '127.0.0.1',
        timestamp: new Date()
      });
      createdLogIds.push(log.id);
    });

    it('should find logs by endpoint', async () => {
      const results = await LogModel.findByEndpoint('/api/specific');
      
      expect(results.length).toBe(1);
      expect(results[0].endpoint).toBe('/api/specific');
    });
  });

  describe('getTotalCount', () => {
    beforeEach(async () => {
      const log = await LogModel.create({
        userId: testUserId,
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        responseTime: '100.0',
        userAgent: 'Test Agent',
        ipAddress: '127.0.0.1',
        timestamp: new Date()
      });
      createdLogIds.push(log.id);
    });

    it('should get total count of logs', async () => {
      const count = await LogModel.getCount();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getErrorCount', () => {
    beforeEach(async () => {
      const errorLog = await LogModel.create({
        userId: testUserId,
        endpoint: '/api/error',
        method: 'GET',
        statusCode: 500,
        responseTime: '100.0',
        userAgent: 'Test Agent',
        ipAddress: '127.0.0.1',
        timestamp: new Date()
      });
      createdLogIds.push(errorLog.id);
    });

    it('should get count of error logs', async () => {
      const count = await LogModel.getErrorCount();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('deleteOlderThan', () => {
    beforeEach(async () => {
      // Create old log
      const oldLog = await LogModel.create({
        userId: testUserId,
        endpoint: '/api/old',
        method: 'GET',
        statusCode: 200,
        responseTime: '100.0',
        userAgent: 'Test Agent',
        ipAddress: '127.0.0.1',
        timestamp: new Date('2020-01-01')
      });
      
      // Create recent log
      const recentLog = await LogModel.create({
        userId: testUserId,
        endpoint: '/api/recent',
        method: 'GET',
        statusCode: 200,
        responseTime: '100.0',
        userAgent: 'Test Agent',
        ipAddress: '127.0.0.1',
        timestamp: new Date()
      });
      
      createdLogIds.push(oldLog.id, recentLog.id);
    });

    it('should delete logs older than specified date', async () => {
      const cutoffDate = new Date('2021-01-01');
      const deletedCount = await LogModel.deleteOlderThan(cutoffDate);
      
      expect(deletedCount).toBeGreaterThanOrEqual(1);
      
      // Verify old log is deleted
      const remainingLogs = await LogModel.findByFilters({ userId: testUserId });
      expect(remainingLogs.every(log => log.timestamp >= cutoffDate)).toBe(true);
      
      // Update cleanup list to only include remaining logs
      createdLogIds = remainingLogs.map(log => log.id);
    });
  });

  describe('deleteById', () => {
    let logId: string;

    beforeEach(async () => {
      const log = await LogModel.create({
        userId: testUserId,
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        responseTime: '100.0',
        userAgent: 'Test Agent',
        ipAddress: '127.0.0.1',
        timestamp: new Date()
      });
      logId = log.id;
      createdLogIds.push(logId);
    });

    it('should delete log by id', async () => {
      const result = await LogModel.delete(logId);
      expect(result).toBe(true);

      const deletedLog = await LogModel.findById(logId);
      expect(deletedLog).toBeNull();
      
      // Remove from cleanup list
      createdLogIds = createdLogIds.filter(id => id !== logId);
    });

    it('should return false for non-existent id', async () => {
      const result = await LogModel.delete('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('deleteByUserId', () => {
    beforeEach(async () => {
      // Create multiple logs for the user
      const log1 = await LogModel.create({
        userId: testUserId,
        endpoint: '/api/test1',
        method: 'GET',
        statusCode: 200,
        responseTime: '100.0',
        userAgent: 'Test Agent',
        ipAddress: '127.0.0.1',
        timestamp: new Date()
      });
      
      const log2 = await LogModel.create({
        userId: testUserId,
        endpoint: '/api/test2',
        method: 'POST',
        statusCode: 201,
        responseTime: '200.0',
        userAgent: 'Test Agent',
        ipAddress: '127.0.0.1',
        timestamp: new Date()
      });
      
      createdLogIds.push(log1.id, log2.id);
    });

    it('should delete all logs for user', async () => {
      const deletedCount = await LogModel.deleteByUserId(testUserId);
      expect(deletedCount).toBe(2);

      const remainingLogs = await LogModel.findByUserId(testUserId);
      expect(remainingLogs.length).toBe(0);
      
      // Clear cleanup list since logs are deleted
      createdLogIds = [];
    });
  });
});
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RateLimitModel } from '../../server/models/rateLimit';
import { UserModel } from '../../server/models/user';
import { db } from '../../server/db';
import { rateLimits, users } from '../../server/db/schema';
import { eq } from 'drizzle-orm';

describe('RateLimitModel', () => {
  let testUserId: string;
  let createdRateLimitIds: string[] = [];

  const testUser = {
    email: 'ratelimittest@example.com',
    passwordHash: 'hashedpassword123',
    name: 'Rate Limit Test User'
  };

  beforeEach(async () => {
    // Create test user
    const user = await UserModel.create(testUser);
    testUserId = user.id;
  });

  afterEach(async () => {
    // Clean up test data
    if (createdRateLimitIds.length > 0) {
      for (const id of createdRateLimitIds) {
        await db.delete(rateLimits).where(eq(rateLimits.id, id));
      }
      createdRateLimitIds = [];
    }
    
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  describe('create', () => {
    it('should create a new rate limit entry', async () => {
      const rateLimitData = {
        userId: testUserId,
        windowType: 'minute' as const,
        windowStart: new Date(),
        requestCount: 1
      };

      const rateLimit = await RateLimitModel.create(rateLimitData);
      createdRateLimitIds.push(rateLimit.id);

      expect(rateLimit).toBeDefined();
      expect(rateLimit.userId).toBe(testUserId);
      expect(rateLimit.windowType).toBe(rateLimitData.windowType);
      expect(rateLimit.requestCount).toBe(rateLimitData.requestCount);
      expect(rateLimit.id).toBeDefined();
    });
  });

  describe('findById', () => {
    let rateLimitId: string;

    beforeEach(async () => {
      const rateLimit = await RateLimitModel.create({
        userId: testUserId,
        windowType: 'minute',
        windowStart: new Date(),
        requestCount: 1
      });
      rateLimitId = rateLimit.id;
      createdRateLimitIds.push(rateLimitId);
    });

    it('should find rate limit by id', async () => {
      const rateLimit = await RateLimitModel.findById(rateLimitId);
      
      expect(rateLimit).toBeDefined();
      expect(rateLimit?.id).toBe(rateLimitId);
      expect(rateLimit?.userId).toBe(testUserId);
    });

    it('should return null for non-existent id', async () => {
      const rateLimit = await RateLimitModel.findById('non-existent-id');
      expect(rateLimit).toBeNull();
    });
  });

  describe('findByUserAndWindow', () => {
    let windowStart: Date;

    beforeEach(async () => {
      windowStart = new Date();
      const rateLimit = await RateLimitModel.create({
        userId: testUserId,
        windowType: 'minute',
        windowStart,
        requestCount: 5,

      });
      createdRateLimitIds.push(rateLimit.id);
    });

    it('should find rate limit by user and window', async () => {
      const rateLimit = await RateLimitModel.findByUserAndWindow(
        testUserId,
        'minute',
        windowStart
      );
      
      expect(rateLimit).toBeDefined();
      expect(rateLimit?.userId).toBe(testUserId);
      expect(rateLimit?.windowType).toBe('minute');
      expect(rateLimit?.requestCount).toBe(5);
    });

    it('should return null for non-matching criteria', async () => {
      const rateLimit = await RateLimitModel.findByUserAndWindow(
        testUserId,
        'minute',
        windowStart
      );
      expect(rateLimit).toBeNull();
    });
  });

  describe('incrementCounter', () => {
    let rateLimitId: string;
    let initialCount: number;

    beforeEach(async () => {
      const rateLimit = await RateLimitModel.create({
        userId: testUserId,
        windowType: 'minute',
        windowStart: new Date(),
        requestCount: 5
      });
      rateLimitId = rateLimit.id;
      initialCount = rateLimit.requestCount;
      createdRateLimitIds.push(rateLimitId);
    });

    it('should increment request count', async () => {
      const updated = await RateLimitModel.incrementCounter(rateLimitId);
      
      expect(updated).toBeDefined();
      expect(updated?.requestCount).toBe(initialCount + 1);
    });

    it('should return null for non-existent id', async () => {
      const updated = await RateLimitModel.incrementCounter('non-existent-id');
      expect(updated).toBeNull();
    });
  });

  describe('update', () => {
    let rateLimitId: string;

    beforeEach(async () => {
      const rateLimit = await RateLimitModel.create({
        userId: testUserId,
        windowType: 'minute',
        windowStart: new Date(),
        requestCount: 1
      });
      rateLimitId = rateLimit.id;
      createdRateLimitIds.push(rateLimitId);
    });

    it('should update rate limit counter', async () => {
      const newCount = 10;

      const updated = await RateLimitModel.updateCounter(rateLimitId, newCount);
      
      expect(updated).toBeDefined();
      expect(updated?.requestCount).toBe(newCount);
    });

    it('should return null for non-existent id', async () => {
      const updated = await RateLimitModel.updateCounter('non-existent-id', 5);
      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    let rateLimitId: string;

    beforeEach(async () => {
      const rateLimit = await RateLimitModel.create({
        userId: testUserId,
        windowType: 'minute',
        windowStart: new Date(),
        requestCount: 1
      });
      rateLimitId = rateLimit.id;
      createdRateLimitIds.push(rateLimitId);
    });

    it('should delete rate limit', async () => {
      const result = await RateLimitModel.delete(rateLimitId);
      expect(result).toBe(true);

      const deleted = await RateLimitModel.findById(rateLimitId);
      expect(deleted).toBeNull();
      
      // Remove from cleanup list
      createdRateLimitIds = createdRateLimitIds.filter(id => id !== rateLimitId);
    });

    it('should return false for non-existent id', async () => {
      const result = await RateLimitModel.delete('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('resetByUserAndWindow', () => {
    beforeEach(async () => {
      // Create multiple rate limits for different windows
      const minuteLimit = await RateLimitModel.create({
        userId: testUserId,
        windowType: 'minute',
        windowStart: new Date(),
        requestCount: 5
      });
      
      const dayLimit = await RateLimitModel.create({
        userId: testUserId,
        windowType: 'day',
        windowStart: new Date(),
        requestCount: 10
      });
      
      createdRateLimitIds.push(minuteLimit.id, dayLimit.id);
    });

    it('should reset rate limits for specific window type', async () => {
      const resetCount = await RateLimitModel.reset(testUserId, 'minute');
      expect(resetCount).toBe(1);

      // Verify minute limit counter is reset to 0
      const minuteLimit = await RateLimitModel.findByUserAndWindow(
        testUserId,
        'minute',
        new Date()
      );
      expect(minuteLimit?.requestCount).toBe(0);

      const dayLimit = await RateLimitModel.findByUserAndWindow(
        testUserId,
        'day',
        new Date()
      );
      expect(dayLimit).toBeDefined();
      expect(dayLimit?.requestCount).toBe(10); // Should remain unchanged
    });
  });

  describe('deleteExpired', () => {
    beforeEach(async () => {
      // Create old rate limit
      const oldLimit = await RateLimitModel.create({
        userId: testUserId,
        windowType: 'minute',
        windowStart: new Date('2020-01-01'),
        requestCount: 5
      });
      
      // Create recent rate limit
      const recentLimit = await RateLimitModel.create({
        userId: testUserId,
        windowType: 'minute',
        windowStart: new Date(),
        requestCount: 3
      });
      
      createdRateLimitIds.push(oldLimit.id, recentLimit.id);
    });

    it('should delete expired rate limits', async () => {
      const cutoffDate = new Date('2021-01-01');
      const deletedCount = await RateLimitModel.deleteExpiredMinuteRecords(cutoffDate);
      
      expect(deletedCount).toBeGreaterThanOrEqual(1);
      
      // Verify only recent limits remain
      const remainingLimits = await db
        .select()
        .from(rateLimits)
        .where(eq(rateLimits.userId, testUserId));
      
      expect(remainingLimits.every(limit => limit.windowStart >= cutoffDate)).toBe(true);
      
      // Update cleanup list
      createdRateLimitIds = remainingLimits.map(limit => limit.id);
    });
  });

  describe('findByUserId', () => {
    beforeEach(async () => {
      // Create multiple rate limits for the user
      const limit1 = await RateLimitModel.create({
        userId: testUserId,
        windowType: 'minute',
        windowStart: new Date(),
        requestCount: 5
      });
      
      const limit2 = await RateLimitModel.create({
        userId: testUserId,
        windowType: 'day',
        windowStart: new Date(),
        requestCount: 10
      });
      
      createdRateLimitIds.push(limit1.id, limit2.id);
    });

    it('should find all rate limits for user', async () => {
      const limits = await RateLimitModel.findByUserId(testUserId);
      
      expect(limits.length).toBe(2);
      expect(limits.every(limit => limit.userId === testUserId)).toBe(true);
    });

    it('should return empty array for user with no rate limits', async () => {
      const otherUser = await UserModel.create({
        email: 'other@example.com',
        passwordHash: 'hash'
      });
      
      const limits = await RateLimitModel.findByUserId(otherUser.id);
      expect(limits.length).toBe(0);
      
      // Clean up
      await db.delete(users).where(eq(users.id, otherUser.id));
    });
  });
});
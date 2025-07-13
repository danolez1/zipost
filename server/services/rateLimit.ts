import { eq } from 'drizzle-orm';
import { db } from '../db';
import type { NewRateLimit } from '../db/schema';
import { users } from '../db/schema';
import { RateLimitModel } from '../models/rateLimit';

export interface RateLimitConfig {
  free: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  basic: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  pro: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
}

const RATE_LIMIT_CONFIG: RateLimitConfig = {
  free: {
    requestsPerMinute: 100,
    requestsPerDay: 5000,
  },
  basic: {
    requestsPerMinute: 1000,
    requestsPerDay: 50000,
  },
  pro: {
    requestsPerMinute: Infinity,
    requestsPerDay: Infinity,
  },
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  limit: number;
}

export class RateLimitService {
  static async checkRateLimit(userId: string, windowType: 'minute' | 'day'): Promise<RateLimitResult> {
    // Get user subscription plan
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      throw new Error('User not found');
    }

    const config = RATE_LIMIT_CONFIG[user.subscriptionPlan as keyof RateLimitConfig];
    const limit = windowType === 'minute' ? config.requestsPerMinute : config.requestsPerDay;

    // For pro plan with unlimited requests
    if (limit === Infinity) {
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: new Date(Date.now() + (windowType === 'minute' ? 60000 : 86400000)),
        limit: Infinity,
      };
    }

    const now = new Date();
    const windowStart = this.getWindowStart(now, windowType);
    const resetTime = this.getWindowEnd(windowStart, windowType);

    // Get or create rate limit record
    let rateLimit = await RateLimitModel.findByUserAndWindow(userId, windowType, windowStart);

    if (!rateLimit) {
      // Create new rate limit record
      const newRateLimit: NewRateLimit = {
        userId,
        requestCount: 0,
        windowStart,
        windowType,
      };

      rateLimit = await RateLimitModel.create(newRateLimit);
    }

    const currentCount = rateLimit.requestCount;
    const allowed = currentCount < limit;
    const remaining = Math.max(0, limit - currentCount);

    return {
      allowed,
      remaining,
      resetTime,
      limit,
    };
  }

  static async incrementCounter(userId: string, windowType: 'minute' | 'day'): Promise<void> {
    const windowStart = this.getWindowStart(new Date(), windowType);

    // Try to find existing record
    const existingRecord = await RateLimitModel.findByUserAndWindow(userId, windowType, windowStart);

    if (existingRecord) {
      // Update existing record
      await RateLimitModel.incrementCounter(existingRecord.id);
    } else {
      // Create new record
      const newRateLimit: NewRateLimit = {
        userId,
        requestCount: 1,
        windowStart,
        windowType,
      };

      await RateLimitModel.create(newRateLimit);
    }
  }

  static async checkAndIncrementRateLimit(userId: string): Promise<{
    minuteLimit: RateLimitResult;
    dayLimit: RateLimitResult;
    allowed: boolean;
  }> {
    const [minuteLimit, dayLimit] = await Promise.all([
      this.checkRateLimit(userId, 'minute'),
      this.checkRateLimit(userId, 'day'),
    ]);

    const allowed = minuteLimit.allowed && dayLimit.allowed;

    if (allowed) {
      // Increment both counters
      await Promise.all([
        this.incrementCounter(userId, 'minute'),
        this.incrementCounter(userId, 'day'),
      ]);
    }

    return {
      minuteLimit,
      dayLimit,
      allowed,
    };
  }

  static async cleanupExpiredRecords(): Promise<void> {
    const oneDayAgo = new Date(Date.now() - 86400000); // 24 hours ago

    await RateLimitModel.deleteExpiredMinuteRecords(oneDayAgo);

    const oneWeekAgo = new Date(Date.now() - 604800000); // 7 days ago

    await RateLimitModel.deleteExpiredDayRecords(oneWeekAgo);
  }

  private static getWindowStart(date: Date, windowType: 'minute' | 'day'): Date {
    if (windowType === 'minute') {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), 0, 0);
    } else {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    }
  }

  private static getWindowEnd(windowStart: Date, windowType: 'minute' | 'day'): Date {
    if (windowType === 'minute') {
      return new Date(windowStart.getTime() + 60000); // 1 minute
    } else {
      return new Date(windowStart.getTime() + 86400000); // 24 hours
    }
  }

  static getRateLimitConfig(): RateLimitConfig {
    return RATE_LIMIT_CONFIG;
  }
}
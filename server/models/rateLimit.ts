import { eq, and, gte, lt } from 'drizzle-orm';
import { db } from '../db';
import type { RateLimit, NewRateLimit } from '../db/schema';
import { rateLimits } from '../db/schema';

export class RateLimitModel {
  static async findById(id: string): Promise<RateLimit | null> {
    try {
      const [rateLimit] = await db.select().from(rateLimits).where(eq(rateLimits.id, id)).limit(1);
      return rateLimit || null;
    } catch (error) {
      console.error('Error finding rate limit by ID:', error);
      throw new Error('Failed to find rate limit');
    }
  }

  static async findByUserAndWindow(
    userId: string,
    windowType: 'minute' | 'day',
    windowStart: Date
  ): Promise<RateLimit | null> {
    try {
      const [rateLimit] = await db
        .select()
        .from(rateLimits)
        .where(
          and(
            eq(rateLimits.userId, userId),
            eq(rateLimits.windowType, windowType),
            gte(rateLimits.windowStart, windowStart)
          )
        )
        .limit(1);

      return rateLimit || null;
    } catch (error) {
      console.error('Error finding rate limit by user and window:', error);
      throw new Error('Failed to find rate limit');
    }
  }

  static async findByUserId(userId: string): Promise<RateLimit[]> {
    try {
      const results = await db
        .select()
        .from(rateLimits)
        .where(eq(rateLimits.userId, userId));

      return results;
    } catch (error) {
      console.error('Error finding rate limits by user ID:', error);
      throw new Error('Failed to find rate limits');
    }
  }

  static async create(rateLimitData: NewRateLimit): Promise<RateLimit> {
    try {
      const result = await db.insert(rateLimits).values(rateLimitData) as any;
      // Fetch the created rate limit by the insertId
      const [rateLimit] = await db.select().from(rateLimits).where(eq(rateLimits.id, result.insertId as string)).limit(1);
      return rateLimit;
    } catch (error) {
      console.error('Error creating rate limit:', error);
      throw new Error('Failed to create rate limit');
    }
  }

  static async incrementCounter(id: string): Promise<RateLimit | null> {
    try {
      // First get the current record
      const [currentRecord] = await db
        .select()
        .from(rateLimits)
        .where(eq(rateLimits.id, id))
        .limit(1);

      if (!currentRecord) {
        return null;
      }

      // Update the counter
      await db
        .update(rateLimits)
        .set({ requestCount: currentRecord.requestCount + 1 })
        .where(eq(rateLimits.id, id));

      // Fetch the updated record
      const [updatedRecord] = await db
        .select()
        .from(rateLimits)
        .where(eq(rateLimits.id, id))
        .limit(1);

      return updatedRecord || null;
    } catch (error) {
      console.error('Error incrementing rate limit counter:', error);
      throw new Error('Failed to increment rate limit counter');
    }
  }

  static async updateCounter(id: string, newCount: number): Promise<RateLimit | null> {
    try {
      await db
        .update(rateLimits)
        .set({ requestCount: newCount })
        .where(eq(rateLimits.id, id));

      // Fetch the updated record
      const [updatedRecord] = await db
        .select()
        .from(rateLimits)
        .where(eq(rateLimits.id, id))
        .limit(1);

      return updatedRecord || null;
    } catch (error) {
      console.error('Error updating rate limit counter:', error);
      throw new Error('Failed to update rate limit counter');
    }
  }

  static async deleteExpiredMinuteRecords(cutoffDate: Date): Promise<number> {
    try {
      const result = await db
        .delete(rateLimits)
        .where(
          and(
            eq(rateLimits.windowType, 'minute'),
            lt(rateLimits.windowStart, cutoffDate)
          )
        ) as any;
      return result.affectedRows;
    } catch (error) {
      console.error('Error deleting expired minute records:', error);
      throw new Error('Failed to delete expired minute records');
    }
  }

  static async deleteExpiredDayRecords(cutoffDate: Date): Promise<number> {
    try {
      const result = await db
        .delete(rateLimits)
        .where(
          and(
            eq(rateLimits.windowType, 'day'),
            lt(rateLimits.windowStart, cutoffDate)
          )
        ) as any;
      return result.affectedRows;
    } catch (error) {
      console.error('Error deleting expired day records:', error);
      throw new Error('Failed to delete expired day records');
    }
  }

  static async deleteExpired(cutoffDate: Date): Promise<number> {
    try {
      const result = await db
        .delete(rateLimits)
        .where(lt(rateLimits.windowStart, cutoffDate)) as any;
      return result.affectedRows;
    } catch (error) {
      console.error('Error deleting expired records:', error);
      throw new Error('Failed to delete expired records');
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await db.delete(rateLimits).where(eq(rateLimits.id, id)) as any;
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting rate limit:', error);
      throw new Error('Failed to delete rate limit');
    }
  }

  static async deleteByUserId(userId: string): Promise<number> {
    try {
      const result = await db.delete(rateLimits).where(eq(rateLimits.userId, userId)) as any;
      return result.affectedRows;
    } catch (error) {
      console.error('Error deleting rate limits by user ID:', error);
      throw new Error('Failed to delete rate limits');
    }
  }

  static async reset(userId: string, windowType?: 'minute' | 'day'): Promise<number> {
    try {
      const conditions = [eq(rateLimits.userId, userId)];
      if (windowType) {
        conditions.push(eq(rateLimits.windowType, windowType));
      }

      const result = await db
        .update(rateLimits)
        .set({ requestCount: 0 })
        .where(and(...conditions)) as any;

      return result.affectedRows;
    } catch (error) {
      console.error('Error resetting rate limits:', error);
      throw new Error('Failed to reset rate limits');
    }
  }
}
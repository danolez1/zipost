import { eq, and, gte, lte, desc, sql, count } from 'drizzle-orm';
import { db } from '../db';
import type { Log, NewLog } from '../db/schema';
import { logs } from '../db/schema';
import { createId } from '@paralleldrive/cuid2';

export interface LogFilters {
  userId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export const LogModel = {
  async create(logData: NewLog): Promise<Log> {
    try {
      const logWithId = { ...logData, id: logData.id || createId() };
      await db.insert(logs).values(logWithId);
      const [log] = await db.select().from(logs).where(eq(logs.id, logWithId.id)).limit(1);
      return log;
    } catch (error) {
      console.error('Error creating log:', error);
      throw new Error('Failed to create log');
    }
  },

  async findById(id: string): Promise<Log | null> {
    try {
      const [log] = await db.select().from(logs).where(eq(logs.id, id)).limit(1);
      return log || null;
    } catch (error) {
      console.error('Error finding log by ID:', error);
      throw new Error('Failed to find log');
    }
  },

  async findByFilters(filters: LogFilters = {}): Promise<Log[]> {
    const {
      userId,
      endpoint,
      method,
      statusCode,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
    } = filters;

    try {
      // Build where conditions
      const conditions = [];
      if (userId) conditions.push(eq(logs.userId, userId));
      if (endpoint) conditions.push(eq(logs.endpoint, endpoint));
      if (statusCode) conditions.push(eq(logs.statusCode, statusCode));
      if (startDate) conditions.push(gte(logs.timestamp, startDate));
      if (endDate) conditions.push(lte(logs.timestamp, endDate));

      const baseQuery = db.select().from(logs);
      
      const results = conditions.length > 0
        ? await baseQuery
            .where(and(...conditions))
            .orderBy(desc(logs.timestamp))
            .limit(limit)
            .offset(offset)
        : await baseQuery
            .orderBy(desc(logs.timestamp))
            .limit(limit)
            .offset(offset);

      return results;
    } catch (error) {
      console.error('Error finding logs by filters:', error);
      throw new Error('Failed to find logs');
    }
  },

  async findByUserId(userId: string, limit = 100, offset = 0): Promise<Log[]> {
    try {
      const results = await db
        .select()
        .from(logs)
        .where(eq(logs.userId, userId))
        .orderBy(desc(logs.timestamp))
        .limit(limit)
        .offset(offset);

      return results;
    } catch (error) {
      console.error('Error finding logs by user ID:', error);
      throw new Error('Failed to find logs by user ID');
    }
  },

  async findByEndpoint(endpoint: string, limit = 100, offset = 0): Promise<Log[]> {
    try {
      const results = await db
        .select()
        .from(logs)
        .where(eq(logs.endpoint, endpoint))
        .orderBy(desc(logs.timestamp))
        .limit(limit)
        .offset(offset);

      return results;
    } catch (error) {
      console.error('Error finding logs by endpoint:', error);
      throw new Error('Failed to find logs by endpoint');
    }
  },

  async getCount(filters: Omit<LogFilters, 'limit' | 'offset'> = {}): Promise<number> {
    const {
      userId,
      endpoint,
      statusCode,
      startDate,
      endDate,
    } = filters;

    try {
      // Build where conditions
      const conditions = [];
      if (userId) conditions.push(eq(logs.userId, userId));
      if (endpoint) conditions.push(eq(logs.endpoint, endpoint));
      if (statusCode) conditions.push(eq(logs.statusCode, statusCode));
      if (startDate) conditions.push(gte(logs.timestamp, startDate));
      if (endDate) conditions.push(lte(logs.timestamp, endDate));

      const baseQuery = db.select({ count: count(logs.id) }).from(logs);
      
      const [result] = conditions.length > 0
        ? await baseQuery.where(and(...conditions))
        : await baseQuery;
      return result.count;
    } catch (error) {
      console.error('Error getting log count:', error);
      throw new Error('Failed to get log count');
    }
  },

  async deleteOlderThan(cutoffDate: Date): Promise<number> {
    try {
      const result = await db
        .delete(logs)
        .where(lte(logs.timestamp, cutoffDate)) as any;
      return result.affectedRows;
    } catch (error) {
      console.error('Error deleting old logs:', error);
      throw new Error('Failed to delete old logs');
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const result = await db.delete(logs).where(eq(logs.id, id)) as any;
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting log:', error);
      throw new Error('Failed to delete log');
    }
  },

  async deleteByUserId(userId: string): Promise<number> {
    try {
      const result = await db.delete(logs).where(eq(logs.userId, userId)) as any;
      return result.affectedRows;
    } catch (error) {
      console.error('Error deleting logs by user ID:', error);
      throw new Error('Failed to delete logs by user ID');
    }
  },

  async getErrorCount(filters: Omit<LogFilters, 'limit' | 'offset'> = {}): Promise<number> {
    const {
      userId,
      endpoint,
      startDate,
      endDate,
    } = filters;

    try {
      // Build where conditions
      const conditions = [gte(logs.statusCode, 400)];
      if (userId) conditions.push(eq(logs.userId, userId));
      if (endpoint) conditions.push(eq(logs.endpoint, endpoint));
      if (startDate) conditions.push(gte(logs.timestamp, startDate));
      if (endDate) conditions.push(lte(logs.timestamp, endDate));

      const query = db.select({ count: count(logs.id) }).from(logs).where(and(...conditions));

      const [result] = await query;
      return result.count;
    } catch (error) {
      console.error('Error getting error count:', error);
      throw new Error('Failed to get error count');
    }
  },

  async getAnalytics(filters: Omit<LogFilters, 'limit' | 'offset'> = {}): Promise<any> {
    const {
      userId,
      endpoint,
      startDate,
      endDate,
    } = filters;

    try {
      // Build where conditions
      const conditions = [];
      if (userId) conditions.push(eq(logs.userId, userId));
      if (endpoint) conditions.push(eq(logs.endpoint, endpoint));
      if (startDate) conditions.push(gte(logs.timestamp, startDate));
      if (endDate) conditions.push(lte(logs.timestamp, endDate));

      const baseQuery = db.select({
        endpoint: logs.endpoint,
        count: count(logs.id),
        avgResponseTime: logs.responseTime
      }).from(logs);
      
      const results = conditions.length > 0
        ? await baseQuery.where(and(...conditions)).groupBy(logs.endpoint)
        : await baseQuery.groupBy(logs.endpoint);
      return results;
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw new Error('Failed to get analytics');
    }
  },

  async getTopEndpoints(limit = 10, days = 7): Promise<any[]> {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const results = await db
        .select({
          endpoint: logs.endpoint,
          count: count(logs.id)
        })
        .from(logs)
        .where(gte(logs.timestamp, cutoffDate))
        .groupBy(logs.endpoint)
        .orderBy(desc(count(logs.id)))
        .limit(limit);

      return results;
    } catch (error) {
      console.error('Error getting top endpoints:', error);
      throw new Error('Failed to get top endpoints');
    }
  },
};
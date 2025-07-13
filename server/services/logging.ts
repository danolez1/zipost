import { LogModel } from '../models/log';
import { type NewLog, type Log } from '../db/schema';

export interface LogEntry {
  userId: string;
  endpoint: string;
  statusCode: number;
  responseTime: number;
  timestamp?: Date;
}

export interface ExtendedLogEntry {
  userId?: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  userAgent: string;
  ipAddress: string;
  timestamp?: Date;
}

export interface LogAnalytics {
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  requestsByEndpoint: Record<string, number>;
  requestsByStatus: Record<number, number>;
}

export interface LogFilters {
  userId?: string;
  endpoint?: string;
  statusCode?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class LoggingService {
  static async log(entry: ExtendedLogEntry): Promise<void> {
    try {
      const logEntry: NewLog = {
        userId: entry.userId || 'anonymous',
        endpoint: entry.endpoint,
        method: entry.method,
        statusCode: entry.statusCode,
        responseTime: entry.responseTime.toString(),
        userAgent: entry.userAgent,
        ipAddress: entry.ipAddress,
        timestamp: entry.timestamp || new Date(),
      };

      await LogModel.create(logEntry);
    } catch (error) {
      console.error('Failed to log request:', error);
      // Don't throw error to avoid breaking the main request flow
    }
  }

  static async logRequest(entry: LogEntry): Promise<void> {
    try {
      const logEntry: NewLog = {
        userId: entry.userId,
        endpoint: entry.endpoint,
        statusCode: entry.statusCode,
        responseTime: entry.responseTime.toString(),
        timestamp: entry.timestamp || new Date(),
      };

      await LogModel.create(logEntry);
    } catch (error) {
      console.error('Failed to log request:', error);
      // Don't throw error to avoid breaking the main request flow
    }
  }

  static async getLogs(filters: LogFilters = {}): Promise<Log[]> {
    try {
      return await LogModel.findByFilters(filters);
    } catch (error) {
      console.error('Failed to get logs:', error);
      throw new Error('Failed to retrieve logs');
    }
  }

  static async getAnalytics(filters: LogFilters = {}): Promise<LogAnalytics> {
    try {
      return await LogModel.getAnalytics(filters);
    } catch (error) {
      console.error('Failed to get analytics:', error);
      throw new Error('Failed to retrieve analytics');
    }
  }

  static async getUserAnalytics(userId: string, days = 30): Promise<LogAnalytics> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    return this.getAnalytics({
      userId,
      startDate,
      endDate,
    });
  }

  static async getSystemAnalytics(days = 30): Promise<LogAnalytics> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    return this.getAnalytics({
      startDate,
      endDate,
    });
  }

  static async cleanupOldLogs(daysToKeep = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - (daysToKeep * 24 * 60 * 60 * 1000));
    
    try {
      return await LogModel.deleteOlderThan(cutoffDate);
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
      throw new Error('Failed to cleanup old logs');
    }
  }

  static async getTopEndpoints(limit = 10, days = 30): Promise<Array<{ endpoint: string; count: number }>> {
    try {
      return await LogModel.getTopEndpoints(limit, days);
    } catch (error) {
      console.error('Failed to get top endpoints:', error);
      throw new Error('Failed to retrieve top endpoints');
    }
  }
}
import { z } from 'zod';
import { defineEventHandler, assertMethod, getQuery, getHeader, setResponseStatus, getRequestIP } from 'h3';
import { AuthService } from '../../services/auth';
import { LoggingService } from '../../services/logging';

const analyticsQuerySchema = z.object({
  days: z.string().optional().transform(val => val ? parseInt(val, 10) : 30),
});

export default defineEventHandler(async (event) => {
  const startTime = Date.now();
  let statusCode = 200;
  let userId = 'anonymous';
  
  try {
    // Only allow GET method
    assertMethod(event, 'GET');
    
    // Authenticate user with JWT
    const authHeader = getHeader(event, 'authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      statusCode = 401;
      throw new Error('Authentication required');
    }
    
    const token = authHeader.substring(7);
    const verifyResult = await AuthService.verifyToken(token);
    
    if (!verifyResult || !verifyResult.userId) {
      statusCode = 401;
      throw new Error('Invalid or expired token');
    }
    
    userId = verifyResult.userId;
    
    // Parse query parameters
    const query = getQuery(event);
    const { days } = analyticsQuerySchema.parse(query);
    
    // Get user analytics
    const analytics = await LoggingService.getUserAnalytics(userId, days);
    
    // Log the request
    await LoggingService.log({
      userId,
      endpoint: '/api/analytics',
      method: 'GET',
      statusCode,
      responseTime: Date.now() - startTime,
      userAgent: getHeader(event, 'user-agent') || '',
      ipAddress: getRequestIP(event, { xForwardedFor: true }) || ''
    });
    
    return {
      success: true,
      data: {
        period: `${days} days`,
        analytics,
      },
    };
  } catch (error: unknown) {
    if (statusCode === 200) {
      statusCode = error instanceof z.ZodError ? 400 : 500;
    }
    
    // Log the error
    await LoggingService.log({
      userId,
      endpoint: '/api/analytics',
      method: 'GET',
      statusCode,
      responseTime: Date.now() - startTime,
      userAgent: getHeader(event, 'user-agent') || '',
      ipAddress: getRequestIP(event, { xForwardedFor: true }) || ''
    });
    
    setResponseStatus(event, statusCode);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Validation failed',
        errors: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch analytics'
    };
  }
});
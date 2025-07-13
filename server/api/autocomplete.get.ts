import { z } from 'zod';
import { defineEventHandler, assertMethod, getQuery, getHeader, setResponseStatus, setHeader, getRequestIP } from 'h3';
import { AuthService } from '../services/auth';
import { PostalService } from '../services/postal';
import { RateLimitService } from '../services/rateLimit';
import { LoggingService } from '../services/logging';

const querySchema = z.object({
  q: z.string().min(1, 'Query parameter is required'),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  country: z.string().optional().default('JP'),
  language: z.string().optional().default('ja'),
});

export default defineEventHandler(async (event) => {
  const startTime = Date.now();
  let statusCode = 200;
  let userId = 'anonymous';
  
  try {
    // Only allow GET method
    assertMethod(event, 'GET');
    
    // Parse and validate query parameters
    const query = getQuery(event);
    const { q, limit, country, language } = querySchema.parse(query);
    
    // Authenticate user (JWT token or API key)
    const authHeader = getHeader(event, 'authorization');
    const apiKey = getHeader(event, 'x-api-key');
    
    let user = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // JWT authentication
      const token = authHeader.substring(7);
      const verifyResult = await AuthService.verifyToken(token);
      
      if (!verifyResult || !verifyResult.userId) {
        statusCode = 401;
        throw new Error('Invalid or expired token');
      }
      
      user = { id: verifyResult.userId };
    } else if (apiKey) {
      // API key authentication
      const verifyResult = await AuthService.verifyApiKey(apiKey);
      
      if (!verifyResult) {
        statusCode = 401;
        throw new Error('Invalid API key');
      }
      
      user = verifyResult;
    } else {
      statusCode = 401;
      throw new Error('Authentication required');
    }
    
    userId = user.id;
    
    // Check rate limits
    const rateLimitResult = await RateLimitService.checkAndIncrementRateLimit(userId);
    
    if (!rateLimitResult.allowed) {
      statusCode = 429;
      
      // Set rate limit headers
      setHeader(event, 'X-RateLimit-Limit-Minute', rateLimitResult.minuteLimit.limit.toString());
      setHeader(event, 'X-RateLimit-Remaining-Minute', rateLimitResult.minuteLimit.remaining.toString());
      setHeader(event, 'X-RateLimit-Reset-Minute', rateLimitResult.minuteLimit.resetTime.toISOString());
      setHeader(event, 'X-RateLimit-Limit-Day', rateLimitResult.dayLimit.limit.toString());
      setHeader(event, 'X-RateLimit-Remaining-Day', rateLimitResult.dayLimit.remaining.toString());
      setHeader(event, 'X-RateLimit-Reset-Day', rateLimitResult.dayLimit.resetTime.toISOString());
      
      throw new Error('Rate limit exceeded');
    }
    
    // Set rate limit headers for successful requests
    setHeader(event, 'X-RateLimit-Limit-Minute', rateLimitResult.minuteLimit.limit.toString());
    setHeader(event, 'X-RateLimit-Remaining-Minute', (rateLimitResult.minuteLimit.remaining - 1).toString());
    setHeader(event, 'X-RateLimit-Reset-Minute', rateLimitResult.minuteLimit.resetTime.toISOString());
    setHeader(event, 'X-RateLimit-Limit-Day', rateLimitResult.dayLimit.limit.toString());
    setHeader(event, 'X-RateLimit-Remaining-Day', (rateLimitResult.dayLimit.remaining - 1).toString());
    setHeader(event, 'X-RateLimit-Reset-Day', rateLimitResult.dayLimit.resetTime.toISOString());
    
    // Perform postal code search
    const results = await PostalService.autocomplete(q, {
      limit: Math.min(limit, 50), // Cap at 50 results
      countryCode: country,
      language,
    });
    
    // Log the request
    await LoggingService.log({
      userId,
      endpoint: '/api/autocomplete',
      method: 'GET',
      statusCode,
      responseTime: Date.now() - startTime,
      userAgent: getHeader(event, 'user-agent') || '',
      ipAddress: getRequestIP(event, { xForwardedFor: true }) || ''
    });
    
    return {
      success: true,
      data: {
        query: q,
        results,
        count: results.length,
        country,
        language,
      },
      meta: {
        rateLimit: {
          minute: {
            limit: rateLimitResult.minuteLimit.limit,
            remaining: rateLimitResult.minuteLimit.remaining - 1,
            reset: rateLimitResult.minuteLimit.resetTime,
          },
          day: {
            limit: rateLimitResult.dayLimit.limit,
            remaining: rateLimitResult.dayLimit.remaining - 1,
            reset: rateLimitResult.dayLimit.resetTime,
          },
        },
      },
    };
  } catch (error: unknown) {
    if (statusCode === 200) {
      statusCode = 500;
    }
    
    // Log the error
    await LoggingService.log({
      userId,
      endpoint: '/api/autocomplete',
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
      message: error instanceof Error ? error.message : 'Internal server error'
    };
  }
});
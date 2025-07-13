import { defineEventHandler, assertMethod, getHeader, setResponseStatus, getRequestIP } from 'h3';
import { AuthService } from '../../services/auth';
import { LoggingService } from '../../services/logging';
import { ApiKeyModel } from '../../models/apiKey';

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
    const authResult = await AuthService.verifyToken(token);
    if (!authResult || !authResult.userId) {
      statusCode = 401;
      throw new Error('Invalid or expired token');
    }
    userId = authResult.userId;
    
    // Get user's API keys
    const userApiKeys = await ApiKeyModel.findByUserId(userId);
    
    // Log the request
    await LoggingService.log({
      userId,
      endpoint: '/api/keys',
      method: 'GET',
      statusCode,
      responseTime: Date.now() - startTime,
      userAgent: getHeader(event, 'user-agent') || '',
      ipAddress: getRequestIP(event, { xForwardedFor: true }) || '',
    });
    
    return {
      success: true,
      data: {
        keys: userApiKeys,
        count: userApiKeys.length,
      },
    };
  } catch (error) {
    if (statusCode === 200) {
      statusCode = 500;
    }
    
    // Log the error
    await LoggingService.log({
      userId,
      endpoint: '/api/keys',
      method: 'GET',
      statusCode,
      responseTime: Date.now() - startTime,
      userAgent: getHeader(event, 'user-agent') || '',
      ipAddress: getRequestIP(event, { xForwardedFor: true }) || '',
    });
    
    setResponseStatus(event, statusCode);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch API keys',
    };
  }
});
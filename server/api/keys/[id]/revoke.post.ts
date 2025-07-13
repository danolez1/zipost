import { defineEventHandler, assertMethod, getRouterParam, getHeader, setResponseStatus, getRequestIP } from 'h3';
import { AuthService } from '../../../services/auth';
import { LoggingService } from '../../../services/logging';

export default defineEventHandler(async (event) => {
  const startTime = Date.now();
  let statusCode = 200;
  let userId = 'anonymous';
  
  try {
    // Only allow POST method
    assertMethod(event, 'POST');
    
    // Get key ID from route params
    const keyId = getRouterParam(event, 'id');
    if (!keyId) {
      statusCode = 400;
      throw new Error('API key ID is required');
    }
    
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
    
    // Revoke the API key
    await AuthService.revokeApiKey(userId, keyId);
    
    // Log the request
    await LoggingService.log({
      userId,
      endpoint: `/api/keys/${keyId}/revoke`,
      method: 'POST',
      statusCode,
      responseTime: Date.now() - startTime,
      userAgent: getHeader(event, 'user-agent') || '',
      ipAddress: getRequestIP(event, { xForwardedFor: true }) || ''
    });
    
    return {
      success: true,
      message: 'API key revoked successfully',
      keyId
    };
  } catch (error: unknown) {
    if (statusCode === 200) {
      statusCode = 500;
    }
    
    // Log the error
    await LoggingService.log({
      userId,
      endpoint: `/api/keys/${getRouterParam(event, 'id') || 'unknown'}/revoke`,
      method: 'POST',
      statusCode,
      responseTime: Date.now() - startTime,
      userAgent: getHeader(event, 'user-agent') || '',
      ipAddress: getRequestIP(event, { xForwardedFor: true }) || ''
    });
    
    setResponseStatus(event, statusCode);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to revoke API key'
    };
  }
});
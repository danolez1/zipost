import { defineEventHandler, assertMethod, getHeader, setResponseStatus, getRequestIP } from 'h3';
import { AuthService } from '../../services/auth';
import { LoggingService } from '../../services/logging';

export default defineEventHandler(async (event) => {
  const startTime = Date.now();
  let userId: string | undefined;
  let statusCode = 200;
  
  try {
    // Only allow POST method
    assertMethod(event, 'POST');
    
    // Get token from Authorization header
    const authHeader = getHeader(event, 'authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      statusCode = 401;
      throw new Error('No valid authorization token provided');
    }
    
    const token = authHeader.substring(7);
    
    // Verify token and get user
    const verifyResult = await AuthService.verifyToken(token);
    if (!verifyResult || !verifyResult.userId) {
      statusCode = 401;
      throw new Error('Invalid or expired token');
    }
    
    userId = verifyResult.userId;
    
    // For now, logout is simply successful token verification
    // Token revocation can be implemented later if needed
    
    // Log successful logout
    await LoggingService.log({
      userId,
      endpoint: '/api/auth/logout',
      method: 'POST',
      statusCode,
      responseTime: Date.now() - startTime,
      userAgent: getHeader(event, 'user-agent') || '',
      ipAddress: getRequestIP(event, { xForwardedFor: true }) || ''
    });
    
    setResponseStatus(event, statusCode);
    return {
      success: true,
      message: 'Logout successful'
    };
    
  } catch (error: unknown) {
    console.error('Logout error:', error);
    
    // Log failed logout attempt
    await LoggingService.log({
      userId,
      endpoint: '/api/auth/logout',
      method: 'POST',
      statusCode,
      responseTime: Date.now() - startTime,
      userAgent: getHeader(event, 'user-agent') || '',
      ipAddress: getRequestIP(event, { xForwardedFor: true }) || ''
    });
    
    setResponseStatus(event, statusCode);
    return {
      success: false,
      message: error.message || 'Logout failed'
    };
  }
});
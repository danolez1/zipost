import { defineEventHandler, getHeader, setResponseStatus, getRequestIP } from 'h3';
import { AuthService } from '../../services/auth';
import { LoggingService } from '../../services/logging';

export default defineEventHandler(async (event) => {
  const startTime = Date.now();
  let userId: string | undefined;
  let statusCode = 200;
  
  try {
    // Get authorization header
    const authHeader = getHeader(event, 'authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      statusCode = 401;
      throw new Error('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      statusCode = 401;
      throw new Error('No token provided');
    }

    // Verify the token
    const user = await AuthService.verifyToken(token);
    
    if (!user) {
      statusCode = 401;
      throw new Error('Invalid or expired token');
    }

    userId = user.userId;
    
    // Log successful verification
    await LoggingService.log({
      userId: user.userId,
      endpoint: '/api/auth/verify',
      method: 'POST',
      statusCode,
      responseTime: Date.now() - startTime,
      userAgent: getHeader(event, 'user-agent') || '',
      ipAddress: getRequestIP(event, { xForwardedFor: true }) || ''
    });

    return {
      success: true,
      user: {
        id: user.userId,
        email: user.email,
        subscriptionPlan: user.subscriptionPlan
      }
    };
    
  } catch (error: unknown) {
    console.error('Token verification error:', error);
    
    // Log failed verification
    await LoggingService.log({
      userId,
      endpoint: '/api/auth/verify',
      method: 'POST',
      statusCode,
      responseTime: Date.now() - startTime,
      userAgent: getHeader(event, 'user-agent') || '',
      ipAddress: getRequestIP(event, { xForwardedFor: true }) || ''
    });

    setResponseStatus(event, statusCode);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Token verification failed'
    };
  }
});
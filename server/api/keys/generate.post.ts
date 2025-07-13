import { z } from 'zod';
import { defineEventHandler, assertMethod, readBody, getHeader, setResponseStatus, getRequestIP } from 'h3';
import { AuthService } from '../../services/auth';
import { LoggingService } from '../../services/logging';

const generateKeySchema = z.object({
  name: z.string().min(1, 'API key name is required').max(100, 'Name too long'),
});

export default defineEventHandler(async (event) => {
  const startTime = Date.now();
  let statusCode = 201;
  let userId: string | undefined;
  
  try {
    // Only allow POST method
    assertMethod(event, 'POST');
    
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
    
    // Parse and validate request body
    const body = await readBody(event);
    const { name } = generateKeySchema.parse(body);
    
    // Generate API key
    const result = await AuthService.generateApiKey(userId, name);
    
    // Log successful key generation
    await LoggingService.log({
      userId,
      endpoint: '/api/keys/generate',
      method: 'POST',
      statusCode,
      responseTime: Date.now() - startTime,
      userAgent: getHeader(event, 'user-agent') || '',
      ipAddress: getRequestIP(event, { xForwardedFor: true }) || ''
    });
    
    setResponseStatus(event, statusCode);
    return {
      success: true,
      message: 'API key generated successfully. Please store it securely as it will not be shown again.',
      key: result.key,
      name
    };
    
  } catch (error: unknown) {
    console.error('API key generation error:', error);
    
    if (statusCode === 201) {
      statusCode = error instanceof z.ZodError ? 400 : 500;
    }
    
    // Log failed key generation attempt
    await LoggingService.log({
      userId,
      endpoint: '/api/keys/generate',
      method: 'POST',
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
      message: error instanceof Error ? error.message : 'Failed to generate API key'
    };
  }
});
import { z } from 'zod';
import { defineEventHandler, assertMethod, readBody, getHeader, setResponseStatus, getRequestIP } from 'h3';
import { AuthService } from '../../services/auth';
import { LoggingService } from '../../services/logging';
import { RateLimitService } from '../../services/rateLimit';

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export default defineEventHandler(async (event) => {
  const startTime = Date.now();
  let userId: string | undefined;
  let statusCode = 201;
  
  try {
    // Only allow POST method
    assertMethod(event, 'POST');
    
    // Parse and validate request body
    const body = await readBody(event);
    const { email, password } = registerSchema.parse(body);

    // Attempt registration
    const result = await AuthService.register(email, password);
    
    userId = result.user.id;
    
    // Log successful registration
    await LoggingService.log({
      userId: result.user.id,
      endpoint: '/api/auth/register',
      method: 'POST',
      statusCode,
      responseTime: Date.now() - startTime,
      userAgent: getHeader(event, 'user-agent') || '',
      ipAddress: getRequestIP(event, { xForwardedFor: true }) || ''
    });

    setResponseStatus(event, statusCode);
    return {
      success: true,
      message: 'Registration successful',
      token: result.token,
      user: {
        id: result.user.id,
        email: result.user.email,
        // name: result.user.name, // User model doesn't have name field
        createdAt: result.user.createdAt
      }
    };
    
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Log failed registration attempt
    await LoggingService.log({
      userId,
      endpoint: '/api/auth/register',
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
      message: error.message || 'Registration failed'
    };
  }
});
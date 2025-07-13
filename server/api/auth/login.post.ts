import { assertMethod, defineEventHandler, getHeader, getRequestIP, readBody, setResponseStatus } from 'h3';
import { z } from 'zod';
import { AuthService } from '../../services/auth';
import { LoggingService } from '../../services/logging';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default defineEventHandler(async (event) => {
  const startTime = Date.now();
  const statusCode = 200;
  let userId: string | undefined;

  try {
    // Only allow POST method
    assertMethod(event, 'POST');

    // Parse and validate request body
    const body = await readBody(event);
    const { email, password } = loginSchema.parse(body);

    // Login user
    const result = await AuthService.login(email, password);

    userId = result.user.id;

    // Log the request
    await LoggingService.log({
      userId,
      endpoint: '/api/auth/login',
      method: 'POST',
      statusCode,
      responseTime: Date.now() - startTime,
      userAgent: getHeader(event, 'user-agent') || '',
      ipAddress: getRequestIP(event, { xForwardedFor: true }) || ''
    });

    return {
      success: true,
      message: 'Login successful',
      token: result.token,
      user: {
        id: result.user.id,
        email: result.user.email,
        // name: result.user.name, // User model doesn't have name field
        createdAt: result.user.createdAt,
      },
    };
  } catch (error: any) {
    console.error('Login error:', error);

    // Log the error
    await LoggingService.log({
      userId,
      endpoint: '/api/auth/login',
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
      message: error.message || 'Login failed'
    };
  }
});
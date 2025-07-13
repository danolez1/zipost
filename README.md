# ZiPost - Postal Code Autocomplete Service

A modern, high-performance postal code autocomplete API service built with Nuxt.js, DrizzleORM, and SQLite. ZiPost provides fast and accurate postal code suggestions with comprehensive analytics and rate limiting.

## Features

- 🚀 **Fast Autocomplete**: Lightning-fast postal code suggestions
- 🔐 **Authentication**: JWT-based user authentication and API key management
- 📊 **Analytics**: Comprehensive usage analytics and monitoring
- ⚡ **Rate Limiting**: Flexible rate limiting based on subscription plans
- 🌍 **Multi-Country Support**: Extensible for multiple countries (currently supports Japan)
- 📱 **Modern UI**: Beautiful, responsive web interface
- 🔧 **Developer-Friendly**: RESTful API with comprehensive documentation

## Tech Stack

- **Frontend**: Nuxt.js 3, Vue 3, TypeScript, Tailwind CSS
- **Backend**: Nuxt.js Server API, Node.js
- **Database**: MySQL with Drizzle ORM
- **Authentication**: JWT tokens, bcrypt password hashing
- **Rate Limiting**: Database-backed rate limiting
- **Testing**: Vitest
- **Deployment**: Vercel-ready

## Quick Start

### Prerequisites

- Node.js 18+ or Bun
- Git

### Installation

1. Install dependencies:
```bash
bun install
```

2. Install and start MySQL server

3. Create a database named `zipost`

4. Copy environment variables:
```bash
cp .env.example .env
```

5. Update `.env` with your MySQL credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=zipost
JWT_SECRET=your-super-secret-jwt-key-here
```

6. Generate and run migrations:
```bash
bun run db:generate
bun run db:migrate
```

7. Import postal data:
```bash
bun run import:postal
```

5. Start the development server:
```bash
bun run dev
```

The application will be available at `http://localhost:3000`.

## API Documentation

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### API Key Management

#### Generate API Key
```http
POST /api/keys/generate
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "My App Key"
}
```

#### List API Keys
```http
GET /api/keys
Authorization: Bearer <jwt_token>
```

#### Revoke API Key
```http
POST /api/keys/{keyId}/revoke
Authorization: Bearer <jwt_token>
```

### Postal Code API

#### Autocomplete
```http
GET /api/autocomplete?query=100&country=JP&limit=10
Authorization: Bearer <jwt_token>
# OR
X-API-Key: <api_key>
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "postalCode": "1000001",
      "prefecture": "Tokyo",
      "city": "Chiyoda",
      "town": "Chiyoda",
      "prefectureKana": "トウキョウト",
      "cityKana": "チヨダク",
      "townKana": "チヨダ"
    }
  ],
  "count": 1
}
```

### Analytics

#### Get User Analytics
```http
GET /api/analytics?days=30
Authorization: Bearer <jwt_token>
```

## Database Schema

The application uses MySQL with Drizzle ORM. Key tables:

- **users**: User accounts with email, password, subscription plans
- **apiKeys**: API key management with usage tracking
- **postalData**: Postal code information with multi-language support (Japanese/English)
- **logs**: Request logging for analytics and monitoring
- **rateLimits**: Rate limiting counters per user
- **subscriptions**: User subscription plans and limits

## Rate Limiting

ZiPost implements flexible rate limiting based on subscription plans:

- **Free Plan**: 10 requests/minute, 100 requests/day
- **Basic Plan**: 100 requests/minute, 5,000 requests/day
- **Pro Plan**: 1,000 requests/minute, 50,000 requests/day

## Development

### Available Scripts

```bash
# Development
bun run dev            # Start development server
bun run build          # Build for production
bun run preview        # Preview production build

# Database
bun run db:generate    # Generate migrations
bun run db:migrate     # Run migrations
bun run db:studio      # Open Drizzle Studio
bun run import:postal  # Import postal data

# Testing
bun run test          # Run tests
bun run test:ui       # Run tests with UI
```

### Project Structure

```
zipost/
├── api/                 # API route handlers
├── components/          # Vue components
├── models/             # Database schema and connection
│   ├── db.ts           # Database connection
│   └── schema.ts       # DrizzleORM schema
├── pages/              # Nuxt.js pages
├── scripts/            # Utility scripts
├── server/             # Server-side API routes
│   └── api/            # API endpoints
├── services/           # Business logic services
│   ├── auth.ts         # Authentication service
│   ├── postal.ts       # Postal code service
│   ├── rateLimit.ts    # Rate limiting service
│   └── logging.ts      # Logging service
└── tests/              # Test files
```

### Testing

Run the test suite:

```bash
bun run test
```

The tests cover:
- Authentication service functionality
- Postal code service operations
- Rate limiting logic
- Logging and analytics
- Integration scenarios

## Deployment

### Production Considerations

- Use a CDN for static assets
- Implement proper error monitoring
- Set up database backups
- Configure rate limiting based on your infrastructure
- Use environment-specific configurations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

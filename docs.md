## Project Prompt: Postal Code Autocomplete API Service

As a Senior Software Developer, you're tasked with designing and implementing a highly efficient and scalable postal code autocomplete service. The initial focus is on Japanese postal codes, with future expansion to other countries. This service must provide robust performance, reliable data handling, seamless user experience, and clear API management capabilities.

### Detailed Project Stages:

### Stage 1: Project Initialization & NuxtJS Setup

* Use NuxtJS with Bun runtime.
* Initialize repository with structured folder organization:

  * `/api` (API routes)
  * `/components`
  * `/services` (business logic)
  * `/models` (database schemas)
  * `/tests` (unit and integration tests)
* Setup linting, formatting (Prettier, ESLint), and environment variables.

### Stage 2: Database Schema Design with DrizzleORM

* **Users**

  * `id` (UUID)
  * `email` (string, unique)
  * `password_hash` (string)
  * `subscription_plan` (enum: free, basic, pro)
  * `created_at`, `updated_at` (timestamps)

* **Logs**

  * `id` (UUID)
  * `user_id` (UUID, FK to Users)
  * `endpoint` (string)
  * `status_code` (integer)
  * `response_time` (float)
  * `timestamp` (datetime)

* **PostalData** (Initial Japan schema, extensible)

  * `id` (UUID)
  * `postal_code` (string, indexed)
  * `prefecture` (string)
  * `city` (string)
  * `town` (string)
  * `kana` (string)
  * `romanized` (string, optional)
  * `country_code` (string, default 'JP')

* **Subscriptions**

  * `id` (UUID)
  * `plan` (enum: free, basic, pro)
  * `max_requests_per_minute` (integer)
  * `max_requests_per_day` (integer)

### Stage 3: Data Migration and Initial Data Load

* ETL scripts for initial CSV download, extraction, cleansing, loading.
* Automated Bun scripts for insertion, validation, and indexing.

### Stage 4: Continuous Data Update Pipeline

* Automated Bun scripts scheduled monthly:

  * Download, extract, compare delta updates.
  * Insert/update/delete changes.
* Robust logging and automated failure recovery.

### Stage 5: API Development and Authentication

* Secure authentication via JWT.
* API Endpoints:

  * `/autocomplete?q=` (GET)
  * Throttling middleware per user subscription.
* Error handling and standardized JSON responses.

### Stage 6: Modern Frontend with NuxtUI

* Responsive NuxtUI implementation:

  * Real-time postal code lookup and autocomplete.
  * Clean UI/UX with minimal latency.

### Stage 7: Modern Landing Page Development

* SEO-friendly landing page:

  * Clearly highlight features, pricing, documentation.
  * Responsive design with user-friendly navigation.

### Stage 8: Dashboard for API Key Management

* User Dashboard Features:

  * API key generation and revocation.
  * Detailed usage analytics.
  * Subscription management (billing, upgrades).

### Stage 9: Testing (Bun test)

* Unit and Integration tests (`bun test`):

  * Models:

    * Validate database schema operations.
  * Services:

    * Business logic validation.
  * API Endpoints:

    * Endpoint responses and error handling.

### Final Stage: Deployment & Monitoring

* CI/CD pipelines (GitHub Actions).
* Deployment to cloud infrastructure (AWS, GCP, or Vercel).
* Monitoring and alerts with performance metrics, downtime notifications, and log aggregation.

### Subscription & Throttling Settings

* **Free Plan**: 100 requests/minute, 5000/day
* **Basic Plan**: 1000 requests/minute, 50000/day
* **Pro Plan**: unlimited requests/minute, unlimited/day

This structured, detailed, and phased approach ensures clarity, reliability, and scalability as the service evolves.

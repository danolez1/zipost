import { mysqlTable, varchar, text, int, timestamp, boolean, decimal, json } from 'drizzle-orm/mysql-core';
import { createId } from '@paralleldrive/cuid2';

// Users table
export const users = mysqlTable('users', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  subscriptionPlan: varchar('subscription_plan', { length: 20, enum: ['free', 'basic', 'pro'] }).notNull().default('free'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

// Logs table
export const logs = mysqlTable('logs', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id),
  endpoint: varchar('endpoint', { length: 255 }).notNull(),
  method: varchar('method', { length: 10 }).notNull().default('GET'),
  statusCode: int('status_code').notNull(),
  responseTime: decimal('response_time', { precision: 10, scale: 2 }).notNull(),
  userAgent: text('user_agent').notNull().default(''),
  ipAddress: varchar('ip_address', { length: 45 }).notNull().default(''),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
});

// PostalData table (supports multiple languages)
export const postalData = mysqlTable('postal_data', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  postalCode: varchar('postal_code', { length: 20 }).notNull(),
  prefecture: json('prefecture').notNull(), // {ja: string, en: string}
  city: json('city').notNull(), // {ja: string, en: string}
  town: json('town').notNull(), // {ja: string, en: string}
  kana: json('kana'), // {ja: string, en: string}
  countryCode: varchar('country_code', { length: 2 }).notNull().default('JP'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

// Subscriptions table
export const subscriptions = mysqlTable('subscriptions', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  plan: varchar('plan', { length: 20, enum: ['free', 'basic', 'pro'] }).notNull(),
  maxRequestsPerMinute: int('max_requests_per_minute').notNull(),
  maxRequestsPerDay: int('max_requests_per_day').notNull(),
});

// API Keys table (for API key management)
export const apiKeys = mysqlTable('api_keys', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id),
  keyHash: varchar('key_hash', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at'),
});

// Rate limiting table
export const rateLimits = mysqlTable('rate_limits', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id),
  requestCount: int('request_count').notNull().default(0),
  windowStart: timestamp('window_start').notNull(),
  windowType: varchar('window_type', { length: 10, enum: ['minute', 'day'] }).notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Log = typeof logs.$inferSelect;
export type NewLog = typeof logs.$inferInsert;
export type PostalData = typeof postalData.$inferSelect;
export type NewPostalData = typeof postalData.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type RateLimit = typeof rateLimits.$inferSelect;
export type NewRateLimit = typeof rateLimits.$inferInsert;
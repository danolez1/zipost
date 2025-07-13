import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { apiKeys, type ApiKey, type NewApiKey } from '../db/schema';

export class ApiKeyModel {
  static async findById(id: string): Promise<ApiKey | null> {
    try {
      const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.id, id)).limit(1);
      return apiKey || null;
    } catch (error) {
      console.error('Error finding API key by ID:', error);
      throw new Error('Failed to find API key');
    }
  }

  static async findByKeyHash(keyHash: string): Promise<ApiKey | null> {
    try {
      const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash)).limit(1);
      return apiKey || null;
    } catch (error) {
      console.error('Error finding API key by hash:', error);
      throw new Error('Failed to find API key');
    }
  }

  static async findByUserId(userId: string): Promise<ApiKey[]> {
    try {
      const results = await db
        .select({
          id: apiKeys.id,
          userId: apiKeys.userId,
          keyHash: apiKeys.keyHash,
          name: apiKeys.name,
          isActive: apiKeys.isActive,
          createdAt: apiKeys.createdAt,
          lastUsedAt: apiKeys.lastUsedAt,
        })
        .from(apiKeys)
        .where(eq(apiKeys.userId, userId));
      
      return results;
    } catch (error) {
      console.error('Error finding API keys by user ID:', error);
      throw new Error('Failed to find API keys');
    }
  }

  static async findActiveByUserId(userId: string): Promise<ApiKey[]> {
    try {
      const results = await db
        .select({
          id: apiKeys.id,
          userId: apiKeys.userId,
          keyHash: apiKeys.keyHash,
          name: apiKeys.name,
          isActive: apiKeys.isActive,
          createdAt: apiKeys.createdAt,
          lastUsedAt: apiKeys.lastUsedAt,
        })
        .from(apiKeys)
        .where(
          and(
            eq(apiKeys.userId, userId),
            eq(apiKeys.isActive, true)
          )
        );
      
      return results;
    } catch (error) {
      console.error('Error finding active API keys:', error);
      throw new Error('Failed to find active API keys');
    }
  }

  static async findAllActive(): Promise<ApiKey[]> {
    try {
      const results = await db
        .select({
          id: apiKeys.id,
          userId: apiKeys.userId,
          keyHash: apiKeys.keyHash,
          name: apiKeys.name,
          isActive: apiKeys.isActive,
          createdAt: apiKeys.createdAt,
          lastUsedAt: apiKeys.lastUsedAt,
        })
        .from(apiKeys)
        .where(eq(apiKeys.isActive, true));
      
      return results;
    } catch (error) {
      console.error('Error finding all active API keys:', error);
      throw new Error('Failed to find active API keys');
    }
  }

  static async create(apiKeyData: NewApiKey): Promise<ApiKey> {
    try {
      const result = await db.insert(apiKeys).values(apiKeyData) as any;
      // Fetch the created API key by the insertId
      const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.id, result.insertId as string)).limit(1);
      return apiKey;
    } catch (error) {
      console.error('Error creating API key:', error);
      throw new Error('Failed to create API key');
    }
  }

  static async updateLastUsed(id: string): Promise<void> {
    try {
      await db
        .update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, id));
    } catch (error) {
      console.error('Error updating API key last used:', error);
      throw new Error('Failed to update API key');
    }
  }

  static async update(id: string, updates: Partial<Omit<ApiKey, 'id' | 'createdAt'>>): Promise<ApiKey | null> {
    try {
      await db
        .update(apiKeys)
        .set(updates)
        .where(eq(apiKeys.id, id));
      
      // Fetch the updated API key
      const [result] = await db.select().from(apiKeys).where(eq(apiKeys.id, id)).limit(1);
      return result || null;
    } catch (error) {
      console.error('Error updating API key:', error);
      throw new Error('Failed to update API key');
    }
  }

  static async deactivate(id: string): Promise<boolean> {
    try {
      const result = await db
        .update(apiKeys)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(apiKeys.id, id)) as any;
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deactivating API key:', error);
      throw new Error('Failed to deactivate API key');
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await db.delete(apiKeys).where(eq(apiKeys.id, id)) as any;
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting API key:', error);
      throw new Error('Failed to delete API key');
    }
  }

  static async deleteByUserId(userId: string): Promise<number> {
    try {
      const result = await db.delete(apiKeys).where(eq(apiKeys.userId, userId)) as any;
      return result.affectedRows;
    } catch (error) {
      console.error('Error deleting API keys by user ID:', error);
      throw new Error('Failed to delete API keys');
    }
  }
}
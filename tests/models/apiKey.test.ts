import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ApiKeyModel } from '../../server/models/apiKey';
import { UserModel } from '../../server/models/user';
import { db } from '../../server/db';
import { apiKeys, users } from '../../server/db/schema';
import { eq } from 'drizzle-orm';

describe('ApiKeyModel', () => {
  let testUserId: string;
  let createdApiKeyIds: string[] = [];

  const testUser = {
    email: 'apitest@example.com',
    passwordHash: 'hashedpassword123',
    name: 'API Test User'
  };

  beforeEach(async () => {
    // Create test user
    const user = await UserModel.create(testUser);
    testUserId = user.id;
  });

  afterEach(async () => {
    // Clean up test data
    if (createdApiKeyIds.length > 0) {
      for (const id of createdApiKeyIds) {
        await db.delete(apiKeys).where(eq(apiKeys.id, id));
      }
      createdApiKeyIds = [];
    }
    
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  describe('create', () => {
    it('should create a new API key', async () => {
      const apiKeyData = {
        userId: testUserId,
        keyHash: 'hashed-api-key-123',
        name: 'Test API Key',

      };

      const apiKey = await ApiKeyModel.create(apiKeyData);
      createdApiKeyIds.push(apiKey.id);

      expect(apiKey).toBeDefined();
      expect(apiKey.userId).toBe(testUserId);
      expect(apiKey.keyHash).toBe(apiKeyData.keyHash);
      expect(apiKey.name).toBe(apiKeyData.name);

      expect(apiKey.isActive).toBe(true);
      expect(apiKey.id).toBeDefined();
      expect(apiKey.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('findById', () => {
    let apiKeyId: string;

    beforeEach(async () => {
      const apiKey = await ApiKeyModel.create({
        userId: testUserId,
        keyHash: 'hashed-api-key-123',
        name: 'Test API Key',

      });
      apiKeyId = apiKey.id;
      createdApiKeyIds.push(apiKeyId);
    });

    it('should find API key by id', async () => {
      const apiKey = await ApiKeyModel.findById(apiKeyId);
      
      expect(apiKey).toBeDefined();
      expect(apiKey?.id).toBe(apiKeyId);
      expect(apiKey?.userId).toBe(testUserId);
    });

    it('should return null for non-existent id', async () => {
      const apiKey = await ApiKeyModel.findById('non-existent-id');
      expect(apiKey).toBeNull();
    });
  });

  describe('findByKeyHash', () => {
    let keyHash: string;

    beforeEach(async () => {
      keyHash = 'unique-hashed-key-123';
      const apiKey = await ApiKeyModel.create({
        userId: testUserId,
        keyHash,
        name: 'Test API Key',

      });
      createdApiKeyIds.push(apiKey.id);
    });

    it('should find API key by key hash', async () => {
      const apiKey = await ApiKeyModel.findByKeyHash(keyHash);
      
      expect(apiKey).toBeDefined();
      expect(apiKey?.keyHash).toBe(keyHash);
      expect(apiKey?.userId).toBe(testUserId);
    });

    it('should return null for non-existent key hash', async () => {
      const apiKey = await ApiKeyModel.findByKeyHash('non-existent-hash');
      expect(apiKey).toBeNull();
    });
  });

  describe('findByUserId', () => {
    beforeEach(async () => {
      // Create multiple API keys for the user
      const apiKey1 = await ApiKeyModel.create({
        userId: testUserId,
        keyHash: 'hash-1',
        name: 'API Key 1'
      });
      const apiKey2 = await ApiKeyModel.create({
        userId: testUserId,
        keyHash: 'hash-2',
        name: 'API Key 2',

      });
      createdApiKeyIds.push(apiKey1.id, apiKey2.id);
    });

    it('should find all API keys for user', async () => {
      const apiKeys = await ApiKeyModel.findByUserId(testUserId);
      
      expect(apiKeys.length).toBe(2);
      expect(apiKeys.every(key => key.userId === testUserId)).toBe(true);
    });

    it('should return empty array for user with no API keys', async () => {
      const otherUser = await UserModel.create({
        email: 'other@example.com',
        passwordHash: 'hash'
      });
      
      const apiKeys = await ApiKeyModel.findByUserId(otherUser.id);
      expect(apiKeys.length).toBe(0);
      
      // Clean up
      await db.delete(users).where(eq(users.id, otherUser.id));
    });
  });

  describe('update', () => {
    let apiKeyId: string;

    beforeEach(async () => {
      const apiKey = await ApiKeyModel.create({
        userId: testUserId,
        keyHash: 'hashed-api-key-123',
        name: 'Test API Key'
      });
      apiKeyId = apiKey.id;
      createdApiKeyIds.push(apiKeyId);
    });

    it('should update API key fields', async () => {
      const updates = {
        name: 'Updated API Key',

        lastUsed: new Date()
      };

      const updatedApiKey = await ApiKeyModel.update(apiKeyId, updates);
      
      expect(updatedApiKey).toBeDefined();
      expect(updatedApiKey?.name).toBe(updates.name);

      expect(updatedApiKey?.lastUsedAt).toBeInstanceOf(Date);
    });

    it('should return null for non-existent API key', async () => {
      const updatedApiKey = await ApiKeyModel.update('non-existent-id', { name: 'Test' });
      expect(updatedApiKey).toBeNull();
    });
  });

  describe('deactivate', () => {
    let apiKeyId: string;

    beforeEach(async () => {
      const apiKey = await ApiKeyModel.create({
        userId: testUserId,
        keyHash: 'hashed-api-key-123',
        name: 'Test API Key'
      });
      apiKeyId = apiKey.id;
      createdApiKeyIds.push(apiKeyId);
    });

    it('should deactivate API key', async () => {
      const result = await ApiKeyModel.deactivate(apiKeyId);
      expect(result).toBe(true);

      const apiKey = await ApiKeyModel.findById(apiKeyId);
      expect(apiKey?.isActive).toBe(false);
    });

    it('should return false for non-existent API key', async () => {
      const result = await ApiKeyModel.deactivate('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    let apiKeyId: string;

    beforeEach(async () => {
      const apiKey = await ApiKeyModel.create({
        userId: testUserId,
        keyHash: 'hashed-api-key-123',
        name: 'Test API Key'
      });
      apiKeyId = apiKey.id;
      createdApiKeyIds.push(apiKeyId);
    });

    it('should delete API key', async () => {
      const result = await ApiKeyModel.delete(apiKeyId);
      expect(result).toBe(true);

      const deletedApiKey = await ApiKeyModel.findById(apiKeyId);
      expect(deletedApiKey).toBeNull();
      
      // Remove from cleanup list
      createdApiKeyIds = createdApiKeyIds.filter(id => id !== apiKeyId);
    });

    it('should return false for non-existent API key', async () => {
      const result = await ApiKeyModel.delete('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('deleteByUserId', () => {
    beforeEach(async () => {
      // Create multiple API keys for the user
      const apiKey1 = await ApiKeyModel.create({
        userId: testUserId,
        keyHash: 'hash-1',
        name: 'API Key 1',

      });
      const apiKey2 = await ApiKeyModel.create({
        userId: testUserId,
        keyHash: 'hash-2',
        name: 'API Key 2',

      });
      createdApiKeyIds.push(apiKey1.id, apiKey2.id);
    });

    it('should delete all API keys for user', async () => {
      const deletedCount = await ApiKeyModel.deleteByUserId(testUserId);
      expect(deletedCount).toBe(2);

      const remainingKeys = await ApiKeyModel.findByUserId(testUserId);
      expect(remainingKeys.length).toBe(0);
      
      // Clear cleanup list since keys are deleted
      createdApiKeyIds = [];
    });

    it('should return 0 for user with no API keys', async () => {
      const otherUser = await UserModel.create({
        email: 'other@example.com',
        passwordHash: 'hash',

      });
      
      const deletedCount = await ApiKeyModel.deleteByUserId(otherUser.id);
      expect(deletedCount).toBe(0);
      
      // Clean up
      await db.delete(users).where(eq(users.id, otherUser.id));
    });
  });
});
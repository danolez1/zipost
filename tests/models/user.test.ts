import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UserModel } from '../../server/models/user';
import { db } from '../../server/db';
import { users } from '../../server/db/schema';
import { eq } from 'drizzle-orm';

describe('UserModel', () => {
  const testUser = {
    email: 'test@example.com',
    passwordHash: 'hashedpassword123'
  };

  let createdUserId: string;

  afterEach(async () => {
    // Clean up test data
    if (createdUserId) {
      await db.delete(users).where(eq(users.id, createdUserId));
    }
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const user = await UserModel.create(testUser);
      createdUserId = user.id;

      expect(user).toBeDefined();
      expect(user.email).toBe(testUser.email);
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error for duplicate email', async () => {
      const user = await UserModel.create(testUser);
      createdUserId = user.id;

      await expect(UserModel.create(testUser)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    beforeEach(async () => {
      const user = await UserModel.create(testUser);
      createdUserId = user.id;
    });

    it('should find user by id', async () => {
      const user = await UserModel.findById(createdUserId);
      
      expect(user).toBeDefined();
      expect(user?.id).toBe(createdUserId);
      expect(user?.email).toBe(testUser.email);
    });

    it('should return null for non-existent id', async () => {
      const user = await UserModel.findById('non-existent-id');
      expect(user).toBeNull();
    });
  });

  describe('findByEmail', () => {
    beforeEach(async () => {
      const user = await UserModel.create(testUser);
      createdUserId = user.id;
    });

    it('should find user by email', async () => {
      const user = await UserModel.findByEmail(testUser.email);
      
      expect(user).toBeDefined();
      expect(user?.email).toBe(testUser.email);
    });

    it('should return null for non-existent email', async () => {
      const user = await UserModel.findByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      const user = await UserModel.create(testUser);
      createdUserId = user.id;
    });

    it('should update user fields', async () => {
      const updates = {
        email: 'updated@example.com'
      };

      const updatedUser = await UserModel.update(createdUserId, updates);
      
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.email).toBe(updates.email);
    });

    it('should return null for non-existent user', async () => {
      const updatedUser = await UserModel.update('non-existent-id', { email: 'test@example.com' });
      expect(updatedUser).toBeNull();
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      const user = await UserModel.create(testUser);
      createdUserId = user.id;
    });

    it('should delete user', async () => {
      const result = await UserModel.delete(createdUserId);
      expect(result).toBe(true);

      const deletedUser = await UserModel.findById(createdUserId);
      expect(deletedUser).toBeNull();
      
      createdUserId = ''; // Reset to avoid cleanup
    });

    it('should return false for non-existent user', async () => {
      const result = await UserModel.delete('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    beforeEach(async () => {
      const user = await UserModel.create(testUser);
      createdUserId = user.id;
    });

    it('should return true for existing user', async () => {
      const exists = await UserModel.exists(createdUserId);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent user', async () => {
      const exists = await UserModel.exists('non-existent-id');
      expect(exists).toBe(false);
    });
  });
});
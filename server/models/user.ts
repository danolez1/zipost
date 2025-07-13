import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, type User, type NewUser } from '../db/schema';

export class UserModel {
  static async findById(id: string): Promise<User | null> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return user || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw new Error('Failed to find user');
    }
  }

  static async findByEmail(email: string): Promise<User | null> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return user || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new Error('Failed to find user');
    }
  }

  static async create(userData: NewUser): Promise<User> {
    try {
      const result = await db.insert(users).values(userData) as any;
      // Fetch the created user by the insertId
      const [user] = await db.select().from(users).where(eq(users.id, result.insertId as string)).limit(1);
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  static async update(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    try {
      await db
        .update(users)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(users.id, id));
      
      // Fetch the updated user
      const [updatedUser] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return updatedUser || null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await db.delete(users).where(eq(users.id, id)) as any;
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  static async exists(email: string): Promise<boolean> {
    try {
      const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      return !!user;
    } catch (error) {
      console.error('Error checking user existence:', error);
      throw new Error('Failed to check user existence');
    }
  }
}
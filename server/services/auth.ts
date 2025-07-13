import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/user';
import { ApiKeyModel } from '../models/apiKey';
import type { User, NewUser } from '../db/schema';
import { createId } from '@paralleldrive/cuid2';

const JWT_SECRET: string = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  subscriptionPlan: string;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateToken(payload: AuthTokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
  }

  static verifyToken(token: string): AuthTokenPayload {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  }

  static async register(email: string, password: string): Promise<{ user: User; token: string }> {
    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password and create user
    const passwordHash = await this.hashPassword(password);
    const newUser: NewUser = {
      email,
      passwordHash,
      subscriptionPlan: 'free',
    };

    const user = await UserModel.create(newUser);
    
    // Generate JWT token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      subscriptionPlan: user.subscriptionPlan,
    });

    return { user, token };
  }

  static async login(email: string, password: string): Promise<{ user: User; token: string }> {
    // Find user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      subscriptionPlan: user.subscriptionPlan,
    });

    return { user, token };
  }

  static async generateApiKey(userId: string, name: string): Promise<{ key: string; keyHash: string }> {
    const key = `zp_${createId()}`;
    const keyHash = await this.hashPassword(key);

    await ApiKeyModel.create({
      userId,
      keyHash,
      name,
    });

    return { key, keyHash };
  }

  static async verifyApiKey(key: string): Promise<User | null> {
    // For API key verification, we need to check all keys since we can't hash and compare directly
    const allKeys = await ApiKeyModel.findAllActive();

    for (const apiKey of allKeys) {
      const isValid = await this.verifyPassword(key, apiKey.keyHash);
      if (isValid) {
        // Update last used timestamp
        await ApiKeyModel.updateLastUsed(apiKey.id);

        const user = await UserModel.findById(apiKey.userId);
        return user;
      }
    }

    return null;
  }

  static async revokeApiKey(userId: string, keyId: string): Promise<void> {
    await ApiKeyModel.deactivate(keyId);
  }

  static async getUserApiKeys(userId: string): Promise<Array<{ id: string; name: string; createdAt: Date; lastUsedAt: Date | null }>> {
    const apiKeys = await ApiKeyModel.findActiveByUserId(userId);
    return apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
    }));
  }
}
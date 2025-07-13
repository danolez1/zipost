import { eq, like, or, and, count, sql } from 'drizzle-orm';
import { db } from '../db';
import { postalData, type PostalData, type NewPostalData } from '../db/schema';

export interface PostalSearchOptions {
  limit?: number;
  countryCode?: string;
  language?: 'ja' | 'en';
}

export class PostalModel {
  static async search(
    query: string,
    options: PostalSearchOptions = {}
  ): Promise<PostalData[]> {
    const { limit = 10, countryCode = 'JP', language = 'ja' } = options;
    
    if (!query || query.length < 2) {
      return [];
    }

    // Clean and normalize the query
    const cleanQuery = query.trim().replace(/[^\w\s-]/g, '');
    const searchPattern = `%${cleanQuery}%`;

    try {
      const results = await db
        .select()
        .from(postalData)
        .where(
          and(
            eq(postalData.countryCode, countryCode),
            or(
              like(postalData.postalCode, searchPattern),
              like(sql`JSON_EXTRACT(${postalData.prefecture}, '$.${sql.raw(language)}')`, searchPattern),
              like(sql`JSON_EXTRACT(${postalData.city}, '$.${sql.raw(language)}')`, searchPattern),
              like(sql`JSON_EXTRACT(${postalData.town}, '$.${sql.raw(language)}')`, searchPattern),
              like(sql`JSON_EXTRACT(${postalData.kana}, '$.${sql.raw(language)}')`, searchPattern)
            )
          )
        )
        .limit(limit);

      return results;
    } catch (error) {
      console.error('Error searching postal data:', error);
      throw new Error('Failed to search postal codes');
    }
  }

  static async findByPostalCode(
    postalCode: string, 
    countryCode = 'JP'
  ): Promise<PostalData | null> {
    try {
      const [result] = await db
        .select()
        .from(postalData)
        .where(
          and(
            eq(postalData.postalCode, postalCode),
            eq(postalData.countryCode, countryCode)
          )
        )
        .limit(1);

      return result || null;
    } catch (error) {
      console.error('Error finding postal code:', error);
      throw new Error('Failed to find postal code');
    }
  }

  static async bulkInsert(data: NewPostalData[]): Promise<void> {
    try {
      // Insert in batches to avoid memory issues
      const batchSize = 1000;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        await db.insert(postalData).values(batch);
      }
    } catch (error) {
      console.error('Error in bulk insert:', error);
      throw new Error('Failed to insert postal data');
    }
  }

  static async deleteByCountryCode(countryCode: string): Promise<void> {
    try {
      await db.delete(postalData).where(eq(postalData.countryCode, countryCode));
    } catch (error) {
      console.error('Error deleting postal data:', error);
      throw new Error('Failed to delete postal data');
    }
  }

  static async getCount(countryCode = 'JP'): Promise<number> {
    try {
      const [result] = await db
        .select({ total: count(postalData.id) })
        .from(postalData)
        .where(eq(postalData.countryCode, countryCode));

      return result.total;
    } catch (error) {
      console.error('Error getting postal data count:', error);
      throw new Error('Failed to get postal data count');
    }
  }

  static async getAvailableLanguages(countryCode = 'JP'): Promise<string[]> {
    // Since we now store both ja and en in JSON fields, return both
    return ['ja', 'en'];
  }

  static async findById(id: string): Promise<PostalData | null> {
    try {
      const [result] = await db
        .select()
        .from(postalData)
        .where(eq(postalData.id, id))
        .limit(1);

      return result || null;
    } catch (error) {
      console.error('Error finding postal data by ID:', error);
      throw new Error('Failed to find postal data');
    }
  }

  static async create(data: NewPostalData): Promise<PostalData> {
    try {
      const result = await db.insert(postalData).values(data) as any;
      const [createdRecord] = await db
        .select()
        .from(postalData)
        .where(eq(postalData.id, result.insertId))
        .limit(1);
      return createdRecord;
    } catch (error) {
      console.error('Error creating postal data:', error);
      throw new Error('Failed to create postal data');
    }
  }

  static async update(id: string, updates: Partial<Omit<PostalData, 'id' | 'createdAt'>>): Promise<PostalData | null> {
    try {
      await db
        .update(postalData)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(postalData.id, id));
      
      const [updatedRecord] = await db
        .select()
        .from(postalData)
        .where(eq(postalData.id, id))
        .limit(1);
      
      return updatedRecord || null;
    } catch (error) {
      console.error('Error updating postal data:', error);
      throw new Error('Failed to update postal data');
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await db.delete(postalData).where(eq(postalData.id, id)) as any;
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting postal data:', error);
      throw new Error('Failed to delete postal data');
    }
  }
}
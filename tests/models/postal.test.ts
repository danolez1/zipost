import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PostalModel } from '../../server/models/postal';
import { db } from '../../server/db';
import { postalData } from '../../server/db/schema';
import { eq, and } from 'drizzle-orm';

describe('PostalModel', () => {
  const testPostalData = [
    {
      postalCode: '100-0001',
      prefecture: { ja: '東京都', en: 'Tokyo' },
      city: { ja: '千代田区', en: 'Chiyoda' },
      town: { ja: '千代田', en: 'Chiyoda' },
      kana: { ja: 'トウキョウトチヨダクチヨダ', en: 'Tokyo Chiyoda Chiyoda' },
      countryCode: 'JP'
    },
    {
      postalCode: '100-0002',
      prefecture: { ja: '東京都', en: 'Tokyo' },
      city: { ja: '千代田区', en: 'Chiyoda' },
      town: { ja: '丸の内', en: 'Marunouchi' },
      kana: { ja: 'トウキョウトチヨダクマルノウチ', en: 'Tokyo Chiyoda Marunouchi' },
      countryCode: 'JP'
    }
  ];

  let createdIds: string[] = [];

  afterEach(async () => {
    // Clean up test data
    if (createdIds.length > 0) {
      for (const id of createdIds) {
        await db.delete(postalData).where(eq(postalData.id, id));
      }
      createdIds = [];
    }
  });

  describe('create', () => {
    it('should create a new postal data entry', async () => {
      const postal = await PostalModel.create(testPostalData[0]);
      createdIds.push(postal.id);

      expect(postal).toBeDefined();
      expect(postal.postalCode).toBe(testPostalData[0].postalCode);
      expect(postal.prefecture).toEqual(testPostalData[0].prefecture);
      expect(postal.city).toEqual(testPostalData[0].city);
      expect(postal.id).toBeDefined();
    });
  });

  describe('findById', () => {
    beforeEach(async () => {
      const postal = await PostalModel.create(testPostalData[0]);
      createdIds.push(postal.id);
    });

    it('should find postal data by id', async () => {
      const postal = await PostalModel.findById(createdIds[0]);
      
      expect(postal).toBeDefined();
      expect(postal?.id).toBe(createdIds[0]);
      expect(postal?.postalCode).toBe(testPostalData[0].postalCode);
    });

    it('should return null for non-existent id', async () => {
      const postal = await PostalModel.findById('non-existent-id');
      expect(postal).toBeNull();
    });
  });

  describe('findByPostalCode', () => {
    beforeEach(async () => {
      const postal = await PostalModel.create(testPostalData[0]);
      createdIds.push(postal.id);
    });

    it('should find postal data by postal code', async () => {
      const postal = await PostalModel.findByPostalCode(
        testPostalData[0].postalCode,
        testPostalData[0].countryCode
      );
      
      expect(postal).toBeDefined();
      expect(postal?.postalCode).toBe(testPostalData[0].postalCode);
      expect(postal?.countryCode).toBe(testPostalData[0].countryCode);
    });

    it('should return null for non-existent postal code', async () => {
      const postal = await PostalModel.findByPostalCode('999-9999', 'JP');
      expect(postal).toBeNull();
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      for (const data of testPostalData) {
        const postal = await PostalModel.create(data);
        createdIds.push(postal.id);
      }
    });

    it('should search by postal code', async () => {
      const results = await PostalModel.search('100-0001', {
        countryCode: 'JP',
        language: 'ja',
        limit: 10
      });
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].postalCode).toBe('100-0001');
    });

    it('should search by city name', async () => {
      const results = await PostalModel.search('千代田', {
        countryCode: 'JP',
        language: 'ja',
        limit: 10
      });
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => typeof r.city === 'object' && r.city && 'ja' in r.city && typeof r.city.ja === 'string' && r.city.ja.includes('千代田'))).toBe(true);
    });

    it('should search by English city name', async () => {
      const results = await PostalModel.search('Chiyoda', {
        countryCode: 'JP',
        language: 'en',
        limit: 10
      });
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => typeof r.city === 'object' && r.city && 'en' in r.city && typeof r.city.en === 'string' && r.city.en.includes('Chiyoda'))).toBe(true);
    });

    it('should respect limit', async () => {
      const results = await PostalModel.search('東京', {
        countryCode: 'JP',
        language: 'ja',
        limit: 1
      });
      
      expect(results.length).toBeLessThanOrEqual(1);
    });
  });

  describe('bulkInsert', () => {
    it('should insert multiple postal data entries', async () => {
      await PostalModel.bulkInsert(testPostalData);
      
      // Verify data was inserted
      const results = await PostalModel.search('100-000', {
        countryCode: 'JP',
        language: 'ja',
        limit: 10
      });
      
      expect(results.length).toBeGreaterThanOrEqual(2);
      
      // Clean up - get IDs for cleanup
      for (const result of results) {
        createdIds.push(result.id);
      }
    });
  });

  describe('getCount', () => {
    beforeEach(async () => {
      for (const data of testPostalData) {
        const postal = await PostalModel.create(data);
        createdIds.push(postal.id);
      }
    });

    it('should get count by country code', async () => {
      const count = await PostalModel.getCount('JP');
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getAvailableLanguages', () => {
    beforeEach(async () => {
      for (const data of testPostalData) {
        const postal = await PostalModel.create(data);
        createdIds.push(postal.id);
      }
    });

    it('should get available languages for country', async () => {
      const languages = await PostalModel.getAvailableLanguages('JP');
      expect(languages).toContain('ja');
      expect(languages).toContain('en');
      expect(languages.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      const postal = await PostalModel.create(testPostalData[0]);
      createdIds.push(postal.id);
    });

    it('should update postal data', async () => {
      const updates = {
        town: { ja: 'Updated Town', en: 'Updated Town EN' },
        kana: { ja: 'Updated Kana', en: 'Updated Kana EN' }
      };

      const updated = await PostalModel.update(createdIds[0], updates);
      
      expect(updated).toBeDefined();
      expect(updated?.town).toEqual(updates.town);
      expect(updated?.kana).toEqual(updates.kana);
    });

    it('should return null for non-existent id', async () => {
      const updated = await PostalModel.update('non-existent-id', { town: { ja: 'Test', en: 'Test' } });
      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      const postal = await PostalModel.create(testPostalData[0]);
      createdIds.push(postal.id);
    });

    it('should delete postal data', async () => {
      const result = await PostalModel.delete(createdIds[0]);
      expect(result).toBe(true);

      const deleted = await PostalModel.findById(createdIds[0]);
      expect(deleted).toBeNull();
      
      createdIds = []; // Reset to avoid cleanup
    });

    it('should return false for non-existent id', async () => {
      const result = await PostalModel.delete('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('deleteByCountryCode', () => {
    beforeEach(async () => {
      for (const data of testPostalData) {
        const postal = await PostalModel.create(data);
        createdIds.push(postal.id);
      }
    });

    it('should delete by country code', async () => {
      await PostalModel.deleteByCountryCode('JP');
      
      const remaining = await PostalModel.search('100-000', {
        countryCode: 'JP',
        language: 'ja',
        limit: 10
      });
      
      expect(remaining.length).toBe(0);
      
      // Reset createdIds since all data was deleted
      createdIds = [];
    });
  });
});
import type { NewPostalData } from '../db/schema';
import { PostalModel } from '../models/postal';

export interface PostalCodeSearchResult {
  postalCode: string;
  prefecture: string;
  city: string;
  town: string;
  kana?: string;
  countryCode: string;
  language: string;
}

export interface AutocompleteOptions {
  limit?: number;
  countryCode?: string;
  language?: string;
}

export class PostalService {
  static async autocomplete(
    query: string,
    options: AutocompleteOptions = {}
  ): Promise<PostalCodeSearchResult[]> {
    const { limit = 10, countryCode = 'JP', language = 'ja' } = options;

    if (!query || query.length < 2) {
      return [];
    }

    if(query.includes('-')) {
      query = query.replace('-', '');
    }

    try {
      const results = await PostalModel.search(query, { limit, countryCode });
      return results.map(result => {
        const prefecture = typeof result.prefecture === 'object' && result.prefecture && language in result.prefecture ? result.prefecture[language as keyof typeof result.prefecture] as string || '' : '';
        const city = typeof result.city === 'object' && result.city && language in result.city ? result.city[language as keyof typeof result.city] as string || '' : '';
        const town = typeof result.town === 'object' && result.town && language in result.town ? result.town[language as keyof typeof result.town] as string || '' : '';
        const kana = typeof result.kana === 'object' && result.kana && language in result.kana ? result.kana[language as keyof typeof result.kana] as string || '' : '';

        return {
          postalCode: result.postalCode,
          prefecture,
          city,
          town,
          kana,
          countryCode: result.countryCode,
          language,
        };
      });
    } catch (error) {
      console.error('Error in postal code autocomplete:', error);
      throw new Error('Failed to search postal codes');
    }
  }

  static async getByPostalCode(
    postalCode: string,
    countryCode = 'JP',
    language = 'ja'
  ): Promise<PostalCodeSearchResult | null> {
    try {
      const result = await PostalModel.findByPostalCode(postalCode, countryCode);
      if (!result) return null;

      const prefecture = typeof result.prefecture === 'object' && result.prefecture && language in result.prefecture ? result.prefecture[language as keyof typeof result.prefecture] as string || '' : '';
      const city = typeof result.city === 'object' && result.city && language in result.city ? result.city[language as keyof typeof result.city] as string || '' : '';
      const town = typeof result.town === 'object' && result.town && language in result.town ? result.town[language as keyof typeof result.town] as string || '' : '';
      const kana = typeof result.kana === 'object' && result.kana && language in result.kana ? result.kana[language as keyof typeof result.kana] as string || '' : '';

      return {
        postalCode: result.postalCode,
        prefecture,
        city,
        town,
        kana,
        countryCode: result.countryCode,
        language,
      };
    } catch (error) {
      console.error('Error fetching postal code:', error);
      throw new Error('Failed to fetch postal code');
    }
  }

  static async bulkInsert(data: NewPostalData[]): Promise<void> {
    try {
      await PostalModel.bulkInsert(data);
    } catch (error) {
      console.error('Error in bulk insert:', error);
      throw new Error('Failed to insert postal data');
    }
  }

  static async deleteByCountryCode(countryCode: string): Promise<void> {
    try {
      await PostalModel.deleteByCountryCode(countryCode);
    } catch (error) {
      console.error('Error deleting postal data:', error);
      throw new Error('Failed to delete postal data');
    }
  }

  static async getStats(countryCode = 'JP'): Promise<{ total: number; countryCode: string }> {
    try {
      const total = await PostalModel.getCount(countryCode);
      return {
        total,
        countryCode,
      };
    } catch (error) {
      console.error('Error getting postal data stats:', error);
      throw new Error('Failed to get postal data statistics');
    }
  }

  static async getAvailableLanguages(countryCode = 'JP'): Promise<string[]> {
    try {
      return await PostalModel.getAvailableLanguages(countryCode);
    } catch (error) {
      console.error('Error getting available languages:', error);
      throw new Error('Failed to get available languages');
    }
  }
}
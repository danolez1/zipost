import { config } from 'dotenv';
import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { postalData } from '../server/db/schema';
import { eq } from 'drizzle-orm';

// Load environment variables
config();

// Debug environment variables
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'NOT SET');
console.log('DB_NAME:', process.env.DB_NAME);

// Create database connection
const connection = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'zipost',
  connectionLimit: 10,
});

const db = drizzle(connection, { mode: 'default' });

interface JapanesePostalRecord {
  localGovernmentCode: string;
  oldPostalCode: string;
  postalCode: string;
  prefectureKana: string;
  cityKana: string;
  townKana: string;
  prefecture: string;
  city: string;
  town: string;
  // Additional fields...
}

interface EnglishPostalRecord {
  postalCode: string;
  prefecture: string;
  city: string;
  town: string;
  prefectureEn: string;
  cityEn: string;
  townEn: string;
}

async function parseJapaneseCSV(): Promise<Map<string, JapanesePostalRecord>> {
  const records = new Map<string, JapanesePostalRecord>();
  
  return new Promise((resolve, reject) => {
    const parser = parse({
      delimiter: ',',
      quote: '"',
      escape: '"',
      skip_empty_lines: true
    });

    parser.on('readable', function() {
      let record;
      while (record = parser.read()) {
        const postalCode = record[2]?.replace(/"/g, '');
        if (postalCode) {
          records.set(postalCode, {
            localGovernmentCode: record[0]?.replace(/"/g, ''),
            oldPostalCode: record[1]?.replace(/"/g, ''),
            postalCode: postalCode,
            prefectureKana: record[3]?.replace(/"/g, ''),
            cityKana: record[4]?.replace(/"/g, ''),
            townKana: record[5]?.replace(/"/g, ''),
            prefecture: record[6]?.replace(/"/g, ''),
            city: record[7]?.replace(/"/g, ''),
            town: record[8]?.replace(/"/g, '')
          });
        }
      }
    });

    parser.on('error', reject);
    parser.on('end', () => resolve(records));

    createReadStream('/Users/tunmisetunes/Work/beckon/zipost/utf_ken_all.csv').pipe(parser);
  });
}

async function parseEnglishCSV(): Promise<Map<string, EnglishPostalRecord>> {
  const records = new Map<string, EnglishPostalRecord>();
  
  return new Promise((resolve, reject) => {
    const parser = parse({
      delimiter: ',',
      quote: '"',
      escape: '"',
      skip_empty_lines: true
    });

    parser.on('readable', function() {
      let record;
      while (record = parser.read()) {
        const postalCode = record[0]?.replace(/"/g, '');
        if (postalCode) {
          records.set(postalCode, {
            postalCode: postalCode,
            prefecture: record[1]?.replace(/"/g, ''),
            city: record[2]?.replace(/"/g, ''),
            town: record[3]?.replace(/"/g, ''),
            prefectureEn: record[4]?.replace(/"/g, ''),
            cityEn: record[5]?.replace(/"/g, ''),
            townEn: record[6]?.replace(/"/g, '')
          });
        }
      }
    });

    parser.on('error', reject);
    parser.on('end', () => resolve(records));

    createReadStream('/Users/tunmisetunes/Work/beckon/zipost/KEN_ALL_ROME.CSV').pipe(parser);
  });
}

async function importPostalData() {
  console.log('Starting postal data import...');
  
  try {
    // Clear existing data
    console.log('Clearing existing postal data...');
    await db.delete(postalData);
    
    // Parse both CSV files
    console.log('Parsing Japanese CSV...');
    const japaneseRecords = await parseJapaneseCSV();
    console.log(`Parsed ${japaneseRecords.size} Japanese records`);
    
    console.log('Parsing English CSV...');
    const englishRecords = await parseEnglishCSV();
    console.log(`Parsed ${englishRecords.size} English records`);
    
    // Combine and insert data
    console.log('Combining and inserting data...');
    const combinedRecords = [];
    
    for (const [postalCode, jaRecord] of japaneseRecords) {
      const enRecord = englishRecords.get(postalCode);
      
      if (jaRecord.prefecture && jaRecord.city && jaRecord.town) {
        combinedRecords.push({
          postalCode: postalCode,
          prefecture: {
            ja: jaRecord.prefecture,
            en: enRecord?.prefectureEn || jaRecord.prefecture
          },
          city: {
            ja: jaRecord.city,
            en: enRecord?.cityEn || jaRecord.city
          },
          town: {
            ja: jaRecord.town,
            en: enRecord?.townEn || jaRecord.town
          },
          kana: {
            ja: `${jaRecord.prefectureKana} ${jaRecord.cityKana} ${jaRecord.townKana}`,
            en: enRecord ? `${enRecord.prefectureEn} ${enRecord.cityEn} ${enRecord.townEn}` : ''
          },
          countryCode: 'JP'
        });
      }
    }
    
    console.log(`Inserting ${combinedRecords.length} combined records...`);
    
    // Insert in batches to avoid memory issues
    const batchSize = 1000;
    for (let i = 0; i < combinedRecords.length; i += batchSize) {
      const batch = combinedRecords.slice(i, i + batchSize);
      await db.insert(postalData).values(batch);
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(combinedRecords.length / batchSize)}`);
    }
    
    console.log('Postal data import completed successfully!');
    
  } catch (error) {
    console.error('Error importing postal data:', error);
    throw error;
  }
}

// Run the import
importPostalData()
  .then(() => {
    console.log('Import finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });
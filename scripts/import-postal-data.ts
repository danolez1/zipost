import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { db } from '../server/db';
import { postalData } from '../server/db/schema';
import { eq } from 'drizzle-orm';

interface PostalRecord {
  postalCode: string;
  prefecture: string;
  city: string;
  area: string;
  prefectureKana?: string;
  cityKana?: string;
  areaKana?: string;
  prefectureRoman?: string;
  cityRoman?: string;
  areaRoman?: string;
}

async function importJapaneseData() {
  console.log('Importing Japanese postal data...');
  
  const records: PostalRecord[] = [];
  
  return new Promise<void>((resolve, reject) => {
    createReadStream('/Users/tunmisetunes/Work/beckon/zipost/utf_ken_all.csv')
      .pipe(parse({ 
        columns: false,
        skip_empty_lines: true,
        encoding: 'utf8'
      }))
      .on('data', (row: string[]) => {
        if (row.length >= 8) {
          records.push({
            postalCode: row[2]?.replace(/[^0-9]/g, '') || '',
            prefecture: row[6] || '',
            city: row[7] || '',
            area: row[8] || '',
            prefectureKana: row[3] || '',
            cityKana: row[4] || '',
            areaKana: row[5] || ''
          });
        }
      })
      .on('end', async () => {
        try {
          console.log(`Parsed ${records.length} Japanese records`);
          
          // Insert in batches
          const batchSize = 1000;
          for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            await db.insert(postalData).values(
              batch.map(record => ({
                postalCode: record.postalCode,
                prefecture: record.prefecture,
                city: record.city,
                town: record.area,
                kana: [record.prefectureKana, record.cityKana, record.areaKana].filter(Boolean).join(' '),
                countryCode: 'JP',
                language: 'ja'
              }))
            );
            console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)}`);
          }
          
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

async function importEnglishData() {
  console.log('Importing English postal data...');
  
  const records: PostalRecord[] = [];
  
  return new Promise<void>((resolve, reject) => {
    createReadStream('/Users/tunmisetunes/Work/beckon/zipost/KEN_ALL_ROME.CSV')
      .pipe(parse({ 
        columns: false,
        skip_empty_lines: true,
        encoding: 'utf8'
      }))
      .on('data', (row: string[]) => {
        if (row.length >= 8) {
          records.push({
            postalCode: row[2]?.replace(/[^0-9]/g, '') || '',
            prefecture: row[6] || '',
            city: row[7] || '',
            area: row[8] || '',
            prefectureRoman: row[3] || '',
            cityRoman: row[4] || '',
            areaRoman: row[5] || ''
          });
        }
      })
      .on('end', async () => {
        try {
          console.log(`Parsed ${records.length} English records`);
          
          // Insert in batches
          const batchSize = 1000;
          for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            await db.insert(postalData).values(
              batch.map(record => ({
                postalCode: record.postalCode,
                prefecture: record.prefecture,
                city: record.city,
                town: record.area,
                romanized: [record.prefectureRoman, record.cityRoman, record.areaRoman].filter(Boolean).join(' '),
                countryCode: 'JP',
                language: 'en'
              }))
            );
            console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)}`);
          }
          
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

async function main() {
  try {
    // Clear existing data
    console.log('Clearing existing postal data...');
    await db.delete(postalData).where(eq(postalData.countryCode, 'JP'));
    
    // Import both datasets
    await importJapaneseData();
    await importEnglishData();
    
    console.log('Postal data import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error importing postal data:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
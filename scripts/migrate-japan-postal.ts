#!/usr/bin/env bun

import { createWriteStream, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import type { NewPostalData } from '../server/db/schema';
import { PostalService } from '../server/services/postal';

const JAPAN_POSTAL_URL = 'https://www.post.japanpost.jp/zipcode/dl/kogaki/zip/ken_all.zip';
const TEMP_DIR = join(process.cwd(), 'temp');
const ZIP_FILE = join(TEMP_DIR, 'ken_all.zip');
const CSV_FILE = join(TEMP_DIR, 'KEN_ALL.CSV');

interface JapanPostalRecord {
  postalCode: string;
  prefecture: string;
  city: string;
  town: string;
  kana: string;
  romanized?: string;
}

async function downloadFile(url: string, outputPath: string): Promise<void> {
  console.log(`Downloading ${url}...`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  const fileStream = createWriteStream(outputPath);
  await pipeline(response.body as any, fileStream);

  console.log(`Downloaded to ${outputPath}`);
}

async function extractZip(zipPath: string, extractPath: string): Promise<void> {
  console.log(`Extracting ${zipPath}...`);

  // Use Node.js child_process to unzip
  const { spawn } = await import('child_process');
  const proc = spawn('unzip', ['-o', zipPath, '-d', extractPath]);

  await new Promise<void>((resolve, reject) => {
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error('Failed to extract ZIP file'));
      }
    });
    proc.on('error', reject);
  });

  console.log(`Extracted to ${extractPath}`);
}

function parseCSVLine(line: string): JapanPostalRecord | null {
  // Parse CSV line with proper handling of quoted fields
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current.trim());

  if (fields.length < 15) {
    return null;
  }

  // Clean up the fields by removing quotes
  const cleanFields = fields.map(field => field.replace(/^"|"$/g, ''));

  return {
    postalCode: cleanFields[2], // 郵便番号
    prefecture: cleanFields[6], // 都道府県名
    city: cleanFields[7], // 市区町村名
    town: cleanFields[8], // 町域名
    kana: `${cleanFields[3]} ${cleanFields[4]} ${cleanFields[5]}`.trim(), // カナ読み
    romanized: undefined, // Will be added later if needed
  };
}

async function parseCSVFile(csvPath: string): Promise<JapanPostalRecord[]> {
  console.log(`Parsing CSV file ${csvPath}...`);

  const { readFileSync } = await import('fs');
  const text = readFileSync(csvPath, 'utf-8');
  const lines = text.split('\n');

  const records: JapanPostalRecord[] = [];
  let processed = 0;

  for (const line of lines) {
    if (line.trim()) {
      const record = parseCSVLine(line);
      if (record && record.postalCode) {
        records.push(record);
      }
      processed++;

      if (processed % 10000 === 0) {
        console.log(`Processed ${processed} lines, found ${records.length} valid records`);
      }
    }
  }

  console.log(`Finished parsing. Found ${records.length} valid records from ${processed} lines`);
  return records;
}

async function insertPostalData(records: JapanPostalRecord[]): Promise<void> {
  console.log(`Inserting ${records.length} postal records...`);

  // Clear existing Japan data
  await PostalService.deleteByCountryCode('JP');
  console.log('Cleared existing Japan postal data');

  // Convert to database format
  const postalData: NewPostalData[] = records.map(record => ({
    postalCode: record.postalCode,
    prefecture: record.prefecture,
    city: record.city,
    town: record.town,
    kana: record.kana,
    romanized: record.romanized,
    countryCode: 'JP',
  }));

  // Insert in batches
  await PostalService.bulkInsert(postalData);
  console.log('Successfully inserted postal data');
}

async function cleanup(): Promise<void> {
  console.log('Cleaning up temporary files...');

  if (existsSync(ZIP_FILE)) {
    unlinkSync(ZIP_FILE);
  }

  if (existsSync(CSV_FILE)) {
    unlinkSync(CSV_FILE);
  }

  console.log('Cleanup completed');
}

async function main(): Promise<void> {
  try {
    console.log('Starting Japan postal code migration...');

    // Create temp directory
    const { mkdirSync, writeFileSync } = await import('fs');
    mkdirSync(TEMP_DIR, { recursive: true });
    writeFileSync(join(TEMP_DIR, '.gitkeep'), '');

    // Download the ZIP file
    await downloadFile(JAPAN_POSTAL_URL, ZIP_FILE);

    // Extract the ZIP file
    await extractZip(ZIP_FILE, TEMP_DIR);

    // Parse the CSV file
    const records = await parseCSVFile(CSV_FILE);

    // Insert into database
    await insertPostalData(records);

    // Get final stats
    const stats = await PostalService.getStats('JP');
    console.log(`Migration completed successfully! Total records: ${stats.total}`);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  main();
}

export { main as migrateJapanPostal };

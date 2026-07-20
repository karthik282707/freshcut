import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDb() {
  console.log('🔄 Initializing FreshCut Connect database...');
  try {
    // Read SQL files
    const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
    const seedPath = path.resolve(__dirname, '../../../database/seed.sql');

    console.log(`Reading schema from: ${schemaPath}`);
    const schemaSql = await fs.readFile(schemaPath, 'utf8');

    console.log(`Reading seed from: ${seedPath}`);
    const seedSql = await fs.readFile(seedPath, 'utf8');

    // Run schema
    console.log('⏳ Running schema queries...');
    await pool.query(schemaSql);
    console.log('✅ Schema created successfully.');

    // Run seed
    console.log('⏳ Running seed queries...');
    await pool.query(seedSql);
    console.log('✅ Sample data seeded successfully.');

    console.log('🎉 Database initialization complete!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDb();

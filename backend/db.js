import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();  // no path override

const client = new Client({
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT, 10),
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  ssl: false,
});

async function connectDB() {
  try {
    await client.connect();
    console.log('✅ PostgreSQL connected successfully.');
  } catch (err) {
    console.error('❌ PostgreSQL connection error:', err.message);
    process.exit(1);
  }
}

export { client, connectDB };

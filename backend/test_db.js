import 'dotenv/config'; 
import { Client } from 'pg';

const client = new Client({
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT, 10),
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  ssl: false,
});

(async () => {
  try {
    await client.connect();
    console.log('✅ Connected successfully');

    // Run a simple query just to test
    const res = await client.query('SELECT * FROM customers');
    console.log('🕒 Server time:', res.rows[0]);
    console.log('✅ Query executed successfully');
    console.log('👥 Customers:', res.rows);
    await client.end(); // Graceful disconnect
    console.log('🛑 Disconnected gracefully');
  } catch (err) {
    console.error('❌ Connection error:', err.message);
  }
})();


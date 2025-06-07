const pool = require('./db');

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    const result = await client.query('SELECT NOW()');
    console.log('Server time:', result.rows[0].now);
    client.release();
  } catch (err) {
    console.error('❌ Connection error:', err.message);
  } finally {
    process.exit();
  }
}

testConnection();
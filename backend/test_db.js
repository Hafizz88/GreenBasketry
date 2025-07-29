import { client } from './db.js';

async function testDB() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected. Current time:', result.rows[0].now);
    
    // Check if admins table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admins'
      );
    `);
    console.log('Admins table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // Check admins
      const admins = await client.query('SELECT * FROM admins');
      console.log('Admins count:', admins.rows.length);
      console.log('Admins:', admins.rows);
    }
    
  } catch (err) {
    console.error('❌ Database error:', err);
  } finally {
    await client.end();
  }
}

testDB();


import { client } from './db.js';

async function checkAdmins() {
  try {
    const result = await client.query('SELECT * FROM admins');
    console.log('Admins in database:', result.rows);
    
    if (result.rows.length === 0) {
      console.log('No admins found in database!');
    } else {
      console.log(`Found ${result.rows.length} admin(s):`);
      result.rows.forEach(admin => {
        console.log(`- ID: ${admin.admin_id}, Name: ${admin.name}, Email: ${admin.email}`);
      });
    }
  } catch (err) {
    console.error('Error checking admins:', err);
  } finally {
    await client.end();
  }
}

checkAdmins(); 
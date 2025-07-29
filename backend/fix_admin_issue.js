import { client } from './db.js';

async function fixAdminIssue() {
  try {
    console.log('🔍 Checking current admins in database...');
    const adminsResult = await client.query('SELECT * FROM admins');
    console.log('Current admins:', adminsResult.rows);
    
    if (adminsResult.rows.length === 0) {
      console.log('❌ No admins found! Creating a default admin...');
      
      // Create a default admin
      const insertResult = await client.query(
        `INSERT INTO admins (name, email, password_hash, phone) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        ['Default Admin', 'admin@greenbasketry.com', 'admin123', '1234567890']
      );
      
      console.log('✅ Created default admin:', insertResult.rows[0]);
    } else {
      console.log('✅ Found existing admins. Using the first one for testing.');
      const firstAdmin = adminsResult.rows[0];
      console.log('First admin:', firstAdmin);
    }
    
    // Test adding a product with the first admin
    const testAdmin = adminsResult.rows.length > 0 ? adminsResult.rows[0] : null;
    
    if (testAdmin) {
      console.log(`\n🧪 Testing product insertion with admin_id: ${testAdmin.admin_id}`);
      
      try {
        const productResult = await client.query(
          `INSERT INTO products (name, category, price, stock, description, updated_by_admin_id) 
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING product_id, name, updated_by_admin_id`,
          ['Test Product', 'Test Category', 100.00, 10, 'Test description', testAdmin.admin_id]
        );
        
        console.log('✅ Test product created successfully:', productResult.rows[0]);
        
        // Clean up test product
        await client.query('DELETE FROM products WHERE product_id = $1', [productResult.rows[0].product_id]);
        console.log('🧹 Cleaned up test product');
        
      } catch (productErr) {
        console.error('❌ Error creating test product:', productErr.message);
      }
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.end();
    console.log('\n🏁 Script completed.');
  }
}

fixAdminIssue(); 
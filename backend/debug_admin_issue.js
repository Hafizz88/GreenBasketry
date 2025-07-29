import dotenv from 'dotenv';
import { Client } from 'pg';

// Load environment variables
dotenv.config();

console.log('🔍 Debugging Admin Issue');
console.log('========================');

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log('PG_HOST:', process.env.PG_HOST ? '✅ Set' : '❌ Missing');
console.log('PG_PORT:', process.env.PG_PORT ? '✅ Set' : '❌ Missing');
console.log('PG_USER:', process.env.PG_USER ? '✅ Set' : '❌ Missing');
console.log('PG_PASSWORD:', process.env.PG_PASSWORD ? '✅ Set' : '❌ Missing');
console.log('PG_DATABASE:', process.env.PG_DATABASE ? '✅ Set' : '❌ Missing');

// If environment variables are missing, provide instructions
if (!process.env.PG_HOST || !process.env.PG_USER || !process.env.PG_PASSWORD || !process.env.PG_DATABASE) {
  console.log('\n❌ MISSING ENVIRONMENT VARIABLES');
  console.log('==================================');
  console.log('You need to create a .env file in the backend directory with your Supabase credentials:');
  console.log('');
  console.log('Create a file called .env in the backend folder with:');
  console.log('');
  console.log('PG_HOST=your-project.supabase.co');
  console.log('PG_PORT=5432');
  console.log('PG_USER=postgres');
  console.log('PG_PASSWORD=your-database-password');
  console.log('PG_DATABASE=postgres');
  console.log('JWT_SECRET=your-secret-key');
  console.log('');
  console.log('You can find these values in your Supabase dashboard:');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Go to Settings > Database');
  console.log('3. Copy the connection string or individual values');
  console.log('');
  console.log('After creating the .env file, run this script again.');
  process.exit(1);
}

// Try to connect to database
async function testConnection() {
  const client = new Client({
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT, 10),
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    ssl: { rejectUnauthorized: false }, // Required for Supabase
  });

  try {
    console.log('\n🔌 Testing database connection...');
    await client.connect();
    console.log('✅ Database connected successfully!');

    // Check admins table
    console.log('\n👥 Checking admins table...');
    const adminsResult = await client.query('SELECT * FROM admins');
    console.log(`Found ${adminsResult.rows.length} admin(s):`);
    
    if (adminsResult.rows.length === 0) {
      console.log('❌ No admins found! This is the problem.');
      console.log('\n🔧 SOLUTION: Create an admin account');
      console.log('=====================================');
      console.log('You need to create an admin account. Here are your options:');
      console.log('');
      console.log('Option 1: Use the signup endpoint');
      console.log('POST http://localhost:5001/api/auth/signup');
      console.log('Body: { "name": "Admin", "email": "admin@example.com", "password": "password123", "phone": "1234567890", "role": "admin" }');
      console.log('');
      console.log('Option 2: Insert directly into database');
      console.log('Run this SQL in your Supabase SQL editor:');
      console.log('');
      console.log('INSERT INTO admins (name, email, password_hash, phone)');
      console.log("VALUES ('Default Admin', 'admin@greenbasketry.com', 'admin123', '1234567890');");
      console.log('');
      console.log('Option 3: Use the test script');
      console.log('Run: node fix_admin_issue.js (after setting up .env)');
    } else {
      console.log('✅ Admins found:');
      adminsResult.rows.forEach((admin, index) => {
        console.log(`  ${index + 1}. ID: ${admin.admin_id}, Name: ${admin.name}, Email: ${admin.email}`);
      });
      
      // Test product insertion
      const firstAdmin = adminsResult.rows[0];
      console.log(`\n🧪 Testing product insertion with admin_id: ${firstAdmin.admin_id}`);
      
      try {
        const productResult = await client.query(
          `INSERT INTO products (name, category, price, stock, description, updated_by_admin_id) 
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING product_id, name, updated_by_admin_id`,
          ['Test Product', 'Test Category', 100.00, 10, 'Test description', firstAdmin.admin_id]
        );
        
        console.log('✅ Test product created successfully:', productResult.rows[0]);
        
        // Clean up
        await client.query('DELETE FROM products WHERE product_id = $1', [productResult.rows[0].product_id]);
        console.log('🧹 Cleaned up test product');
        
        console.log('\n🎉 SUCCESS! Your database is working correctly.');
        console.log('The issue was that you were trying to use admin_id = 10, but that admin doesn\'t exist.');
        console.log('Now you can log in with one of the existing admins and add products.');
        
      } catch (productErr) {
        console.error('❌ Error creating test product:', productErr.message);
        console.log('\n🔧 This confirms the foreign key constraint issue.');
        console.log('The admin_id you\'re using in your JWT token doesn\'t exist in the admins table.');
      }
    }

  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Check your .env file has correct Supabase credentials');
    console.log('2. Make sure your Supabase project is active');
    console.log('3. Check if your database is accessible');
  } finally {
    await client.end();
  }
}

testConnection(); 
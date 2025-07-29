import jwt from 'jsonwebtoken';

// Function to decode JWT token without verification (for debugging)
function decodeToken(token) {
  try {
    // Split the token
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('❌ Invalid token format');
      return null;
    }
    
    // Decode the payload (second part)
    const payload = parts[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    
    return decoded;
  } catch (err) {
    console.log('❌ Error decoding token:', err.message);
    return null;
  }
}

console.log('🔍 JWT Token Debugger');
console.log('======================');

// Check if token exists in localStorage (this is just for reference)
console.log('\n📋 To check your current JWT token:');
console.log('1. Open browser developer tools (F12)');
console.log('2. Go to Application/Storage tab');
console.log('3. Look for localStorage');
console.log('4. Find the "token" key');
console.log('5. Copy the token value');
console.log('');
console.log('Then run this script with your token:');
console.log('node debug_jwt.js YOUR_TOKEN_HERE');
console.log('');

// If a token was provided as command line argument
const token = process.argv[2];
if (token) {
  console.log('🔍 Decoding provided token...');
  const decoded = decodeToken(token);
  
  if (decoded) {
    console.log('✅ Token decoded successfully:');
    console.log('User ID:', decoded.id);
    console.log('Role:', decoded.role);
    console.log('Email:', decoded.email);
    console.log('Full payload:', decoded);
    
    if (decoded.id === 10) {
      console.log('\n❌ PROBLEM FOUND!');
      console.log('The token contains admin_id = 10, but this admin doesn\'t exist.');
      console.log('Valid admin IDs are: 1, 4, 5');
      console.log('');
      console.log('🔧 SOLUTION:');
      console.log('1. Log out from your admin panel');
      console.log('2. Log in with one of these accounts:');
      console.log('   - labibl480@gmail.com');
      console.log('   - john@gmail.com');
      console.log('   - Din@gmail.com');
      console.log('3. Try adding a product again');
    } else {
      console.log('\n✅ Token looks valid!');
      console.log('The admin_id in the token should work.');
    }
  }
} else {
  console.log('💡 To debug your specific token, run:');
  console.log('node debug_jwt.js YOUR_TOKEN_HERE');
  console.log('');
  console.log('🔧 IMMEDIATE FIX:');
  console.log('1. Clear your browser\'s localStorage');
  console.log('2. Log out from your admin panel');
  console.log('3. Log in with a valid admin account');
  console.log('4. Try adding a product again');
} 
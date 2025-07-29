// Test file to verify logout functionality
import { logout, isAuthenticated, getCurrentUser } from './auth';

// Mock localStorage for testing
const mockLocalStorage = {
  token: 'test-token',
  user: JSON.stringify({ name: 'Test Admin', email: 'test@example.com' }),
  role: 'admin',
  userId: '1'
};

// Test logout function
export const testLogout = () => {
  console.log('🧪 Testing logout functionality...');
  
  // Set up mock data
  localStorage.setItem('token', mockLocalStorage.token);
  localStorage.setItem('user', mockLocalStorage.user);
  localStorage.setItem('role', mockLocalStorage.role);
  localStorage.setItem('userId', mockLocalStorage.userId);
  
  console.log('Before logout:');
  console.log('- isAuthenticated:', isAuthenticated());
  console.log('- currentUser:', getCurrentUser());
  console.log('- token:', localStorage.getItem('token'));
  
  // Test logout
  logout();
  
  console.log('After logout:');
  console.log('- isAuthenticated:', isAuthenticated());
  console.log('- currentUser:', getCurrentUser());
  console.log('- token:', localStorage.getItem('token'));
  
  console.log('✅ Logout test completed');
};

// Run test if this file is executed directly
if (typeof window !== 'undefined') {
  // Only run in browser environment
  console.log('To test logout, run: testLogout() in browser console');
} 
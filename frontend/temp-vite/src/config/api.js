// API Configuration
export const API_BASE_URL = 'http://localhost:5001';

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  ADMIN_LOGIN: `${API_BASE_URL}/api/auth/admin/login`,
  SIGNUP: `${API_BASE_URL}/api/auth/signup`,
  
  // Products
  PRODUCTS: `${API_BASE_URL}/api/products`,
  PRODUCTS_CATEGORIES: `${API_BASE_URL}/api/products/categories`,
  PRODUCTS_TOP_SELLING: `${API_BASE_URL}/api/products/top-selling`,
  PRODUCTS_BY_CATEGORY: `${API_BASE_URL}/api/products/category`,
  PRODUCTS_SEARCH: `${API_BASE_URL}/api/products/search`,
  
  // Admin
  ADMIN_PRODUCTS: `${API_BASE_URL}/api/admin/products`,
  ADMIN_ADD_PRODUCT: `${API_BASE_URL}/api/admin/add-product`,
  ADMIN_COUPONS: `${API_BASE_URL}/api/admin/coupons`,
  ADMIN_CREATE_COUPON: `${API_BASE_URL}/api/admin/create-coupon`,
  
  // Cart
  CART: `${API_BASE_URL}/api/cart`,
  
  // Wishlist
  WISHLIST: `${API_BASE_URL}/api/wishlist`,
  
  // Customers
  CUSTOMERS: `${API_BASE_URL}/api/customers`,
  CUSTOMER_ADDRESSES: `${API_BASE_URL}/api/customers`,
  
  // Orders
  ORDERS: `${API_BASE_URL}/api/orders`,
  
  // Vouchers
  VOUCHERS: `${API_BASE_URL}/api/vouchers`,
  
  // Thanas
  THANAS: `${API_BASE_URL}/api/thanas`,
  
  // Rider
  RIDER: `${API_BASE_URL}/api/rider`,
};

// Socket.io
export const SOCKET_URL = API_BASE_URL; 
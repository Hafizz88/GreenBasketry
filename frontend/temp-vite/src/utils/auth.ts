// Authentication utility functions

export const logout = () => {
  // Clear all authentication data from localStorage
  const role = localStorage.getItem('role');
  if (role) {
    localStorage.removeItem(`${role}_token`);
    localStorage.removeItem(`${role}_user`);
    localStorage.removeItem(`${role}_userId`);
  }
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('role');
  localStorage.removeItem('userId');
  localStorage.removeItem('currentZone');
  
  // Redirect to login page
  window.location.href = '/login';
};

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    // Check if token is expired
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    if (payload.exp && payload.exp < currentTime) {
      // Token is expired, clear it
      logout();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking token:', error);
    logout();
    return false;
  }
};

export const isAuthenticatedForRole = (requiredRole: string): boolean => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    if (payload.exp && payload.exp < currentTime) {
      logout();
      return false;
    }
    
    // Check if token belongs to the required role
    if (payload.role !== requiredRole) {
      console.log(`Token role (${payload.role}) doesn't match required role (${requiredRole})`);
      logout();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking token for role:', error);
    logout();
    return false;
  }
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  };
};

export const getAuthHeadersFormData = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'multipart/form-data'
    }
  };
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  return null;
};

export const getCurrentRole = (): string | null => {
  return localStorage.getItem('role');
};

export const getCurrentUserId = (): string | null => {
  return localStorage.getItem('userId');
};

export const getTokenPayload = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (error) {
    console.error('Error parsing token payload:', error);
    return null;
  }
};

export const clearAllAuthData = () => {
  // Clear all possible auth data
  const roles = ['admin', 'customer', 'rider'];
  roles.forEach(role => {
    localStorage.removeItem(`${role}_token`);
    localStorage.removeItem(`${role}_user`);
    localStorage.removeItem(`${role}_userId`);
  });
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('role');
  localStorage.removeItem('userId');
  localStorage.removeItem('currentZone');
}; 
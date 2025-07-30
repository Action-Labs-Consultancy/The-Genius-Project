/**
 * Authentication API Service
 * Handles login, logout, and session management
 */

import { API_BASE_URL } from '../config/api';

const baseURL = API_BASE_URL;

// Helper function to handle API responses
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  let data;
  
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = { message: await response.text() };
  }
  
  if (!response.ok) {
    throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
  }
  
  return data;
};

// Helper function to make authenticated requests
const makeRequest = async (url, options = {}) => {
  const defaultOptions = {
    credentials: 'include',  // Include session cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(`${baseURL}${url}`, {
    ...defaultOptions,
    ...options,
  });

  return handleResponse(response);
};

// Authentication API functions
export const authApi = {
  // Login
  async login(email, password) {
    return makeRequest('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Logout
  async logout() {
    return makeRequest('/logout', {
      method: 'POST',
    });
  },

  // Get current user from session
  async getCurrentUser() {
    return makeRequest('/api/users/current');
  },

  // Check if user is authenticated
  async checkAuth() {
    try {
      const user = await this.getCurrentUser();
      return { authenticated: true, user };
    } catch (error) {
      return { authenticated: false, user: null };
    }
  }
};

export default authApi;

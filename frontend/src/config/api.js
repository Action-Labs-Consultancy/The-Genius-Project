// Central API configuration for The Genius Project
// This file manages all backend API endpoints and configurations

// Environment-based API configuration
const getApiBaseUrl = () => {
  // Check for environment variable first (highest priority)
  if (process.env.REACT_APP_API_BASE_URL) {
    console.log('🔧 Using API URL from environment:', process.env.REACT_APP_API_BASE_URL);
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  // Production check - if we're on action-labs.ai, use the same domain for API
  if (window.location.hostname.includes('action-labs.ai')) {
    console.log('🌍 Production mode detected, using same domain for API');
    return ''; // Same domain, Vercel handles routing - no need for full URL
  }
  
  // Auto-detect for LAN access if running on IP address
  if (window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    const lanApiUrl = `http://${window.location.hostname}:10000`;
    console.log('📡 LAN access detected, using:', lanApiUrl);
    return lanApiUrl;
  }
  
  // If running on localhost, check if we can reach the configured LAN backend
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // First try localhost backend
    console.log('🏠 Localhost detected, using localhost backend');
    return 'http://localhost:10000';
  }
  
  // Default to the configured LAN IP backend for development
  const defaultUrl = 'http://192.168.100.63:10000';
  console.log('🏠 Using default development API URL:', defaultUrl);
  return defaultUrl;
};

// Export the base API URL
export const API_BASE_URL = getApiBaseUrl();

// Log the final API configuration
console.log('⚙️ API Configuration:', {
  baseUrl: API_BASE_URL,
  currentHost: window.location.hostname,
  environment: process.env.NODE_ENV,
  envVariable: process.env.REACT_APP_API_BASE_URL || 'not set'
});

// API endpoint configurations
export const API_ENDPOINTS = {
  // Test endpoints
  HELLO: `${API_BASE_URL}/api/hello`,
  HEALTH: `${API_BASE_URL}/health`,
  TEST: `${API_BASE_URL}/api/test`,
  
  // Authentication
  LOGIN: `${API_BASE_URL}/login`,
  LOGOUT: `${API_BASE_URL}/logout`,
  FORGOT_PASSWORD: `${API_BASE_URL}/forgot-password`,
  SET_PASSWORD: `${API_BASE_URL}/set-password`,
  REQUEST_ACCESS: `${API_BASE_URL}/request-access`,
  CREATE_ADMIN: `${API_BASE_URL}/create-admin`,
  
  // Users
  USERS: `${API_BASE_URL}/api/users`,
  USER_BY_ID: (id) => `${API_BASE_URL}/api/users/${id}`,
  ACCESSIBLE_CLIENTS: `${API_BASE_URL}/api/user/accessible-clients`,
  
  // Clients
  CLIENTS: `${API_BASE_URL}/api/clients`,
  CLIENT_BY_ID: (id) => `${API_BASE_URL}/api/clients/${id}`,
  CLIENT_CARDS: (id) => `${API_BASE_URL}/api/clients/${id}/cards`,
  CLIENT_ACCESS: (id) => `${API_BASE_URL}/api/clients/${id}/access`,
  CLIENT_ACCESS_BY_ID: (clientId, accessId) => `${API_BASE_URL}/api/clients/${clientId}/access/${accessId}`,
  CLIENT_CONTENT_CALENDAR: (id) => `${API_BASE_URL}/api/clients/${id}/content-calendar`,
  
  // Projects
  PROJECTS: `${API_BASE_URL}/api/projects`,
  PROJECT_BY_ID: (id) => `${API_BASE_URL}/api/projects/${id}`,
  
  // Tasks
  TASKS: `${API_BASE_URL}/api/tasks`,
  TASK_BY_ID: (id) => `${API_BASE_URL}/api/tasks/${id}`,
  
  // Revive/Ad Server
  REVIVE_STATS: `${API_BASE_URL}/api/revive/stats`,
  REVIVE_CAMPAIGNS: `${API_BASE_URL}/api/revive/campaigns`,
  REVIVE_BANNERS: `${API_BASE_URL}/api/revive/banners`,
  
  // Dashboard Data Endpoints
  DASHBOARD_DATA: `${API_BASE_URL}/api/dashboard/data`,
  DASHBOARD_KPIS: `${API_BASE_URL}/api/dashboard/kpis`,
  FUNNEL_DATA: `${API_BASE_URL}/api/dashboard/funnel`,
  CAMPAIGN_DATA: `${API_BASE_URL}/api/dashboard/campaign`,
  BUDGET_DATA: `${API_BASE_URL}/api/dashboard/budget`,
  TOP_ADS: `${API_BASE_URL}/api/dashboard/top-ads`,
  CONVERSION_RATES: `${API_BASE_URL}/api/dashboard/conversion-rates`,
  TIKTOK_ADS_DATA: `${API_BASE_URL}/api/tiktok/ads-data`,
  UPLOAD_DAILY_REPORT: `${API_BASE_URL}/api/dashboard/upload-daily-report`,
  IMPORT_DAILY_DATA: `${API_BASE_URL}/api/dashboard/import-daily-data`,
  SOCIAL_MEDIA_DATA: `${API_BASE_URL}/api/social-media/real-time-data`,
  
  // Social Media Integration Endpoints
  SOCIAL_CONNECTIONS: `${API_BASE_URL}/api/social-media/connections`,
  CONNECT_TIKTOK: `${API_BASE_URL}/api/social-media/connect-tiktok`,
  CONNECT_META: `${API_BASE_URL}/api/social-media/connect-meta`,
  CONNECT_INSTAGRAM: `${API_BASE_URL}/api/social-media/connect-instagram`,
  META_ADS_DATA: `${API_BASE_URL}/api/social-media/meta-ads`,
  INSTAGRAM_DATA: `${API_BASE_URL}/api/social-media/instagram`,
  
  // Pinecone/Vector DB
  PINECONE_STORE: `${API_BASE_URL}/store_data`,
  PINECONE_QUERY: `${API_BASE_URL}/query`,
  
  // AI Brains System
  BRAINS: `${API_BASE_URL}/api/brains`,
  BRAIN_BY_ID: (id) => `${API_BASE_URL}/api/brains/${id}`,
  BRAIN_DOCUMENTS: (id) => `${API_BASE_URL}/api/brains/${id}/documents`,
  BRAIN_UPLOAD: (id) => `${API_BASE_URL}/api/brains/${id}/upload`,
  BRAIN_CHAT: (id) => `${API_BASE_URL}/api/brains/${id}/chat`,
  BRAIN_AGENTS: (id) => `${API_BASE_URL}/api/brains/${id}/agents`,
  
  // File uploads
  UPLOAD: `${API_BASE_URL}/upload`,
  
  // Socket.IO
  SOCKET_URL: API_BASE_URL
};

// Common fetch options
export const DEFAULT_FETCH_OPTIONS = {
  headers: {
    'Content-Type': 'application/json',
  }
};

// API utility functions
export const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...DEFAULT_FETCH_OPTIONS,
      ...options,
      headers: {
        ...DEFAULT_FETCH_OPTIONS.headers,
        ...options.headers
      }
    });
    
    const contentType = response.headers.get('content-type');
    let responseData;
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    if (!response.ok) {
      // If we have JSON error response, throw it with the error details
      if (typeof responseData === 'object' && responseData.error) {
        const error = new Error(JSON.stringify(responseData));
        error.status = response.status;
        error.errorData = responseData;
        throw error;
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }
    
    return responseData;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Specific API methods
export const api = {
  // Authentication
  login: (credentials) => apiCall(API_ENDPOINTS.LOGIN, {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  
  forgotPassword: (email) => apiCall(API_ENDPOINTS.FORGOT_PASSWORD, {
    method: 'POST',
    body: JSON.stringify({ email })
  }),
  
  requestAccess: (data) => apiCall(API_ENDPOINTS.REQUEST_ACCESS, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  // Users
  getUsers: (role = null) => {
    const url = role ? `${API_ENDPOINTS.USERS}?role=${role}` : API_ENDPOINTS.USERS;
    return apiCall(url);
  },
  
  createUser: (userData) => apiCall(API_ENDPOINTS.USERS, {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  
  updateUser: (id, userData) => apiCall(API_ENDPOINTS.USER_BY_ID(id), {
    method: 'PUT',
    body: JSON.stringify(userData)
  }),
  
  deleteUser: (id) => apiCall(API_ENDPOINTS.USER_BY_ID(id), {
    method: 'DELETE'
  }),
  
  // Clients
  getClients: () => apiCall(API_ENDPOINTS.CLIENTS),
  
  createClient: (clientData) => apiCall(API_ENDPOINTS.CLIENTS, {
    method: 'POST',
    body: JSON.stringify(clientData)
  }),
  
  getClientCards: (clientId) => apiCall(API_ENDPOINTS.CLIENT_CARDS(clientId)),
  
  createClientCard: (clientId, cardData) => apiCall(API_ENDPOINTS.CLIENT_CARDS(clientId), {
    method: 'POST',
    body: JSON.stringify(cardData)
  }),
  
  // Projects
  getProjects: () => apiCall(API_ENDPOINTS.PROJECTS),
  
  createProject: (projectData) => apiCall(API_ENDPOINTS.PROJECTS, {
    method: 'POST',
    body: JSON.stringify(projectData)
  }),
  
  // Tasks
  getTasks: () => apiCall(API_ENDPOINTS.TASKS),
  
  createTask: (taskData) => apiCall(API_ENDPOINTS.TASKS, {
    method: 'POST',
    body: JSON.stringify(taskData)
  }),
  
  // Export API configuration object
  BASE_URL: API_BASE_URL,
  ENDPOINTS: API_ENDPOINTS
};

export default api;

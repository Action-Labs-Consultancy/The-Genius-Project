// Central API configuration for The Genius Project
// This file manages all backend API endpoints and configurations

// Environment-based API configuration
const getApiBaseUrl = () => {
  // Check for environment variable first
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  // Default to the new MongoDB backend
  return 'http://localhost:5002';
};

// Export the base API URL
export const API_BASE_URL = getApiBaseUrl();

// API endpoint configurations
export const API_ENDPOINTS = {
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
  CLIENT_CARD_BY_ID: (clientId, cardId) => `${API_BASE_URL}/api/clients/${clientId}/cards/${cardId}`,
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
  
  // Pinecone/Vector DB
  PINECONE_STORE: `${API_BASE_URL}/store_data`,
  PINECONE_QUERY: `${API_BASE_URL}/query`,
  
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
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
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

  updateClient: (id, clientData) => apiCall(API_ENDPOINTS.CLIENT_BY_ID(id), {
    method: 'PUT',
    body: JSON.stringify(clientData)
  }),

  deleteClient: (id) => apiCall(API_ENDPOINTS.CLIENT_BY_ID(id), {
    method: 'DELETE'
  }),
  
  getClientCards: (clientId) => apiCall(API_ENDPOINTS.CLIENT_CARDS(clientId)),
  
  createClientCard: (clientId, cardData) => apiCall(API_ENDPOINTS.CLIENT_CARDS(clientId), {
    method: 'POST',
    body: JSON.stringify(cardData)
  }),

  deleteClientCard: (clientId, cardId) => apiCall(API_ENDPOINTS.CLIENT_CARD_BY_ID(clientId, cardId), {
    method: 'DELETE'
  }),

  // Client Access Management
  getClientAccess: (clientId) => apiCall(API_ENDPOINTS.CLIENT_ACCESS(clientId)),
  
  createClientAccess: (clientId, accessData) => apiCall(API_ENDPOINTS.CLIENT_ACCESS(clientId), {
    method: 'POST',
    body: JSON.stringify(accessData)
  }),

  updateClientAccess: (clientId, accessId, accessData) => apiCall(API_ENDPOINTS.CLIENT_ACCESS_BY_ID(clientId, accessId), {
    method: 'PUT',
    body: JSON.stringify(accessData)
  }),

  deleteClientAccess: (clientId, accessId) => apiCall(API_ENDPOINTS.CLIENT_ACCESS_BY_ID(clientId, accessId), {
    method: 'DELETE'
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
  })
};

export default api;

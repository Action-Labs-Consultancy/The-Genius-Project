/**
 * Feature Request API Service
 * Handles all API calls related to feature requests, voting, comments, and notifications
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
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
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

// Feature Request API functions
export const featureRequestApi = {
  // Submit a new feature request
  async submitFeatureRequest(requestData) {
    return makeRequest('/api/feature-requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  },

  // Upload files for feature request
  async uploadFiles(files, requestId = null) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('file', file);
    });
    if (requestId) {
      formData.append('request_id', requestId);
    }

    return makeRequest('/api/feature-requests/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it for FormData
    });
  },

  // Admin: Get all feature requests
  async getAdminRequests(filters = {}) {
    const queryParams = new URLSearchParams();
    
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.priority) queryParams.append('priority', filters.priority);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.sort_by) queryParams.append('sort_by', filters.sort_by);
    if (filters.sort_order) queryParams.append('sort_order', filters.sort_order);

    const queryString = queryParams.toString();
    const url = `/api/admin/feature-requests${queryString ? `?${queryString}` : ''}`;
    
    return makeRequest(url);
  },

  // Admin: Update feature request status
  async updateRequestStatus(requestId, status, adminComment = '') {
    return makeRequest(`/api/admin/feature-requests/${requestId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ 
        status, 
        admin_comment: adminComment 
      }),
    });
  },

  // Admin: Delete feature request
  async deleteRequest(requestId) {
    return makeRequest(`/api/admin/feature-requests/${requestId}`, {
      method: 'DELETE',
    });
  },

  // Admin: Get feature request statistics
  async getAdminStats() {
    return makeRequest('/api/admin/feature-requests/stats');
  },

  // Get user notifications
  async getNotifications(limit = 10) {
    return makeRequest(`/api/notifications?limit=${limit}`);
  },
};

// Export individual functions for convenience
export const {
  submitFeatureRequest,
  uploadFiles,
  getAdminRequests,
  updateRequestStatus,
  deleteRequest,
  getAdminStats,
  getNotifications,
} = featureRequestApi;

export default featureRequestApi;

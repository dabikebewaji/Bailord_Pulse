import axios from 'axios';
import { toast } from 'sonner';

// Base API configuration
// Use Vite env variable VITE_API_URL in development or fallback to '/api'
// which makes it easy to use a Vite dev proxy to forward requests to the backend.
const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    try {
      const stored = localStorage.getItem('bailord_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('Making request to:', config.url);
        console.log('Request method:', config.method);
        console.log('Request data:', config.data);
        
        // Check for new token format first
        if (parsed?.accessToken) {
          console.log('Using access token for auth');
          config.headers.Authorization = `Bearer ${parsed.accessToken.trim()}`;
        } 
        // Fall back to old token format for backward compatibility
        else if (parsed?.token) {
          console.log('Using legacy token for auth');
          config.headers.Authorization = `Bearer ${parsed.token.trim()}`;
        }
        console.log('Request headers:', config.headers);
      }
      return config;
    } catch (err) {
      console.warn('Failed to process auth token:', err);
      // Clear corrupted auth data
      localStorage.removeItem('bailord_user');
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// Store refresh promise to prevent multiple refresh requests
let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void; reject: (error?: unknown) => void; }[] = [];
let lastRefreshTime = 0;
const REFRESH_COOLDOWN = 5000; // 5 seconds cooldown between refreshes

const processQueue = (error: any | null, token: string | null = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor: handle auth errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Enhanced error logging
    console.error('API Error:', {
      status: error?.response?.status,
      message: error?.response?.data?.message || error.message,
      endpoint: error?.config?.url,
      method: error?.config?.method,
      data: error?.config?.data
    });
    const originalRequest = error.config;
    const status = error?.response?.status;
    const errorCode = error?.response?.data?.code;

    // Only refresh on expired tokens, not on expiring tokens
    if (status === 401 && errorCode === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      if (isRefreshing) {
        // If refresh is in progress, queue this request
        try {
          const token = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      // Check refresh cooldown
      const now = Date.now();
      if (now - lastRefreshTime < REFRESH_COOLDOWN) {
        return Promise.reject(error);
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      lastRefreshTime = now;

      try {
        // Get stored tokens
        const stored = localStorage.getItem('bailord_user');
        if (!stored) throw new Error('No stored tokens');
        
        const { refreshToken } = JSON.parse(stored);
        if (!refreshToken) throw new Error('No refresh token');

        // Try to refresh the token
        const { data } = await api.post('/auth/refresh', { refreshToken });
        const { accessToken } = data;

        // Update stored tokens
        const storedData = JSON.parse(stored);
        storedData.accessToken = accessToken;
        localStorage.setItem('bailord_user', JSON.stringify(storedData));

        // Update Authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

        // Process queued requests
        processQueue(null, accessToken);
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear auth data and redirect to login
        localStorage.removeItem('bailord_user');
        try {
          toast.error('Session expired — please log in');
        } catch (e) {
          // ignore toast errors
        }
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Other 401 errors or refresh token expired
    if (status === 401) {
      localStorage.removeItem('bailord_user');
      try {
        toast.error('Session expired — please log in');
      } catch (e) {
        // ignore toast errors
      }
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

import {
  User,
  Retailer,
  Project,
  RetailerFormData,
  ProjectFormData,
  RetailersResponse,
  RetailerResponse,
  ProjectsResponse,
  ProjectResponse,
  RetailerMetrics,
  ProjectMetrics,
  AnalyticsResponse
} from '../types/models';

// Retailer API
export const retailerAPI = {
  getAll: (page = 1, limit = 10, filters: { search?: string; status?: 'active' | 'inactive' } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(filters.search && { search: filters.search }),
      ...(filters.status && { status: filters.status }),
    });
    return api.get<RetailersResponse>(`/retailers?${params}`);
  },
  
  getById: (id: number) => 
    api.get<RetailerResponse>(`/retailers/${id}`),
  
  create: (data: RetailerFormData) => 
    api.post<RetailerResponse>('/retailers', data),
  
  update: (id: number, data: Partial<RetailerFormData>) => 
    api.patch<RetailerResponse>(`/retailers/${id}`, data),
  
  updateMetrics: (id: number, metrics: RetailerMetrics) => 
    api.patch<RetailerResponse>(`/retailers/${id}/metrics`, metrics),
  
  delete: (id: number) => 
    api.delete<{ status: string, data: null }>(`/retailers/${id}`),
};

// Project API
export const projectAPI = {
  getAll: (page = 1, limit = 10, filters: { search?: string; status?: 'ongoing' | 'completed' | 'delayed' } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(filters.search && { search: filters.search }),
      ...(filters.status && { status: filters.status }),
    });
    return api.get<ProjectsResponse>(`/projects?${params}`);
  },

  getById: (id: number) => 
    api.get<ProjectResponse>(`/projects/${id}`),
  
  create: (data: ProjectFormData) => 
    api.post<ProjectResponse>('/projects', data),
  
  update: (id: number, data: Partial<ProjectFormData>) => 
    api.put<ProjectResponse>(`/projects/${id}`, data),
  
  delete: (id: number) => 
    api.delete<{ status: string, data: null }>(`/projects/${id}`),
  
  // Project-Retailer relationships
  assignRetailers: (projectId: number, retailerIds: number[]) =>
    api.post<ProjectResponse>(`/projects/${projectId}/retailers`, { retailerIds }),
  
  removeRetailer: (projectId: number, retailerId: number) =>
    api.delete(`/projects/${projectId}/retailers/${retailerId}`),
  
  getAssignedRetailers: (projectId: number) =>
    api.get<{ data: Retailer[] }>(`/projects/${projectId}/retailers`),
};

// Analytics API
export const analyticsAPI = {
  getDashboardStats: () => 
    api.get<AnalyticsResponse>('/analytics/dashboard'),
  
  getRetailerPerformance: (retailerId?: number) =>
    api.get<{ data: RetailerMetrics }>('/analytics/retailer-performance', {
      params: retailerId ? { retailerId } : {}
    }),
  
  getProjectStats: (projectId?: number) =>
    api.get<{ data: ProjectMetrics }>('/analytics/project-stats', {
      params: projectId ? { projectId } : {}
    }),
};

// Message API
export const messageAPI = {
  // Conversations
  getConversations: (page = 1, limit = 20) => 
    api.get<ConversationsResponse>('/messages/conversations', {
      params: { page, limit }
    }),

  getConversation: (id: number) =>
    api.get<{ data: Conversation }>(`/messages/conversations/${id}`),

  createConversation: (data: ConversationFormData) =>
    api.post<{ data: Conversation }>('/messages/conversations', data),

  // Messages
  getMessages: (conversationId: number, page = 1, limit = 50) =>
    api.get<MessagesResponse>(`/messages/conversations/${conversationId}/messages`, {
      params: { page, limit }
    }),

  sendMessage: (data: MessageFormData) =>
    api.post<{ data: Message }>('/messages', data),

  markAsRead: (messageId: number) =>
    api.patch<{ data: Message }>(`/messages/${messageId}/read`),

  // Users
  getAvailableUsers: (search?: string) =>
    api.get<{ data: User[] }>('/messages/available-users', {
      params: search ? { search } : {}
    }),
};

// Global Search API
export interface SearchResponse {
  results: Array<{
    id: string;
    type: 'retailer' | 'project' | 'message' | 'conversation' | 'user';
    name?: string;
    title?: string;
    subject?: string;
    businessType?: string;
    location?: string;
    status?: string;
    lastInteraction?: string;
    createdAt?: string;
    updatedAt?: string;
    dueDate?: string;
    excerpt?: string;
    lastMessage?: string;
    conversationId?: string;
    role?: string;
    department?: string;
    lastActive?: string;
    metrics?: {
      orders?: number;
      revenue?: number;
      lastOrder?: string;
    };
  }>;
}

export const searchAPI = {
  search: (query: string, filters?: { types?: string[]; limit?: number }) => 
    api.get<SearchResponse>('/search', { 
      params: { 
        q: query,
        ...(filters?.types && { types: filters.types.join(',') }),
        ...(filters?.limit && { limit: filters.limit })
      } 
    }),
};

export default api;

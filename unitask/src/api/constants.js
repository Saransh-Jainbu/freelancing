// Base API URL for backend requests
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// WebSocket URL for real-time communication
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

// Storage URLs for uploaded content
export const STORAGE_URL = import.meta.env.VITE_STORAGE_URL || 'https://unitaskstorage.blob.core.windows.net';

// API endpoints
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    VERIFY: '/api/auth/verify'
  },
  GIGS: {
    BASE: '/api/gigs',
    SEARCH: '/api/gigs/search',
    CATEGORIES: '/api/gigs/categories'
  },
  ORDERS: {
    BASE: '/api/orders',
    USER: '/api/orders/user',
    MILESTONES: '/api/orders/milestones'
  },
  PROJECTS: {
    BASE: '/api/projects',
    BUSINESS: '/api/projects/business',
    BIDS: '/api/bids'
  },
  CHAT: {
    CONVERSATIONS: '/api/conversations',
    MESSAGES: '/api/messages'
  },
  NOTIFICATIONS: {
    BASE: '/api/notifications',
    SUBSCRIBE: '/api/notifications/subscribe'
  },
  USER: {
    PROFILE: '/api/profile',
    DASHBOARD: '/api/dashboard'
  }
};

// Request timeout in milliseconds
export const REQUEST_TIMEOUT = 20000;

// File upload size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  PROFILE_IMAGE: 2 * 1024 * 1024, // 2MB
  GIG_IMAGE: 5 * 1024 * 1024,     // 5MB
  PROJECT_ATTACHMENT: 10 * 1024 * 1024, // 10MB
  MESSAGE_ATTACHMENT: 20 * 1024 * 1024  // 20MB
};

// Supported file formats for uploads
export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  CODE: ['text/plain', 'application/json', 'text/javascript', 'text/html', 'text/css'],
  ALL: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain',
        'application/json', 'text/javascript', 'text/html', 'text/css', 'image/webp']
};

// Determine the API URL based on environment
// For development, use local API
// For production, use deployed API with fallback
const determineApiUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://unitask-backend.onrender.com';
  }
  return 'http://localhost:5000';
};

export const API_URL = determineApiUrl();
export const API_BASE = `${API_URL}/api`;
export const WS_URL = process.env.NODE_ENV === 'production'
  ? 'wss://unitask-backend.onrender.com'
  : 'ws://localhost:5000';

// Project categories for filtering and display
export const PROJECT_CATEGORIES = [
  { value: 'web-development', label: 'Web Development' },
  { value: 'mobile-development', label: 'Mobile Development' },
  { value: 'design', label: 'Design' },
  { value: 'writing', label: 'Writing & Translation' },
  { value: 'video', label: 'Video & Animation' },
  { value: 'music', label: 'Music & Audio' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'business', label: 'Business' },
  { value: 'data', label: 'Data Science & Analytics' },
  { value: 'other', label: 'Other' }
];

// Pagination defaults
export const PAGINATION = {
  ITEMS_PER_PAGE: 10,
  MAX_PAGES_DISPLAYED: 5
};

// Project statuses
export const PROJECT_STATUS = {
  OPEN: 'open',
  AWARDED: 'awarded',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Bid statuses
export const BID_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn'
};

// User types
export const USER_TYPES = {
  FREELANCER: 'freelancer',
  BUSINESS: 'business',
  ADMIN: 'admin'
};

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

// Central place to define important constants used throughout the app
export const API_URL = 'https://unitask-backend.onrender.com';
export const API_BASE = `${API_URL}/api`;
export const GOOGLE_AUTH_URL = `${API_URL}/api/auth/google`;
export const GITHUB_AUTH_URL = `${API_URL}/api/auth/github`;

/**
 * Application-wide constants for UI components and business logic
 */

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

// Time constants in milliseconds
export const TIME = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000
};

// User types
export const USER_TYPES = {
  FREELANCER: 'freelancer',
  BUSINESS: 'business',
  ADMIN: 'admin'
};

// Company size options
export const COMPANY_SIZES = [
  { value: 'small', label: 'Small (1-10 employees)' },
  { value: 'medium', label: 'Medium (11-50 employees)' },
  { value: 'large', label: 'Large (51-200 employees)' },
  { value: 'enterprise', label: 'Enterprise (201+ employees)' }
];

// Language proficiency levels
export const LANGUAGE_LEVELS = [
  { value: 'basic', label: 'Basic' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'fluent', label: 'Fluent' },
  { value: 'native', label: 'Native' }
];

// Default avatar placeholder
export const DEFAULT_AVATAR = '/assets/default-avatar.png';

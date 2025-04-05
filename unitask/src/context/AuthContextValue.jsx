import { useContext } from 'react';
import { AuthContext } from './AuthContext';

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import { useAuth } from './AuthContext';

// Re-export the hook for easier imports 
export { useAuth };

import { createContext, useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { API_URL } from '../api/constants';

// Create the Auth Context with a default value
export const AuthContext = createContext({
  currentUser: null,
  loading: true,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  updateProfile: () => Promise.resolve()
});

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth status when component mounts
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Try server verification with credentials (cookies)
        const response = await fetch(`${API_URL}/api/auth/verify`, {
          method: 'GET',
          credentials: 'include', // Important: include cookies in the request
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setCurrentUser(data.user);
          } else {
            setCurrentUser(null);
          }
        } else {
          // If server verification fails, user is not authenticated
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to login');
      }

      if (data.success && data.user) {
        setCurrentUser(data.user);
        return data.user;
      } else {
        throw new Error(data.message || 'Failed to login');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to clear server-side session and cookies
      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // Clear user from state regardless of server response
      setCurrentUser(null);
      
      return response.ok;
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear user from state on error
      setCurrentUser(null);
      return false;
    }
  };

  const updateProfile = async (profileData) => {
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${API_URL}/api/profile/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update the current user with the updated profile data
      setCurrentUser(prev => ({ ...prev, ...profileData }));
      return data;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

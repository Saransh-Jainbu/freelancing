import { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { API_URL } from '../api/constants';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/verify`, {
          credentials: 'include' // Include cookies for authentication
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCurrentUser(data.user);
          } else {
            setCurrentUser(null);
          }
        } else {
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
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to login');
    }

    if (data.success) {
      setCurrentUser(data.user);
      return data.user;
    } else {
      throw new Error(data.message || 'Failed to login');
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setCurrentUser(null);
    }
  };

  const updateProfile = async (profileData) => {
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/api/profile/${currentUser.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(profileData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }

    // Update the current user with the updated profile data
    setCurrentUser({ ...currentUser, ...profileData });
    return data;
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

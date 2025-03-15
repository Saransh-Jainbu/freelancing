import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { loginUser } from '../api/auth';
import { getProfile } from '../api/profile';
import { AuthContext } from './AuthContextValue';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check if user is logged in from localStorage on component mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const userJson = localStorage.getItem('unitask_user');
        if (!userJson) {
          setLoading(false);
          return;
        }

        const user = JSON.parse(userJson);
        
        // Fetch fresh profile data
        try {
          const profileData = await getProfile(user.id);
          setCurrentUser({
            ...user,
            profile: profileData
          });
        } catch (error) {
          console.error("Failed to fetch profile:", error);
          // We still set the user even if profile fetch fails
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkLoggedIn();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError('');
      
      const userData = await loginUser(email, password);
      
      // Fetch user profile
      const profileData = await getProfile(userData.id);
      
      const user = {
        ...userData,
        profile: profileData
      };
      
      setCurrentUser(user);
      localStorage.setItem('unitask_user', JSON.stringify({
        id: user.id,
        email: user.email,
        display_name: user.display_name
      }));
      
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to login');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // OAuth login function
  const loginWithOAuth = async (userData) => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch user profile
      const profileData = await getProfile(userData.id);
      
      const user = {
        ...userData,
        profile: profileData
      };
      
      setCurrentUser(user);
      localStorage.setItem('unitask_user', JSON.stringify({
        id: user.id,
        email: user.email,
        display_name: user.display_name
      }));
      
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to login with OAuth');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('unitask_user');
  };

  // Update user profile in context
  const updateUserProfile = async () => {
    if (!currentUser) return;
    
    try {
      const profileData = await getProfile(currentUser.id);
      setCurrentUser({
        ...currentUser,
        profile: profileData
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    loginWithOAuth,
    logout,
    updateUserProfile
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

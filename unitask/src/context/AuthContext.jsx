import { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { loginUser } from '../api/auth'; // Removed the getProfile import since it's not exported

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check if user is logged in from localStorage on component mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const storedUser = localStorage.getItem('unitask_user');
        
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log('Found stored user:', parsedUser);
          
          // Set the user directly without fetching profile since getProfile isn't available
          setCurrentUser(parsedUser);
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        localStorage.removeItem('unitask_user');
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
      
      console.log('Attempting login for:', email);
      
      // Make the API request
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      console.log('Login response status:', response.status);
      
      // Get response text
      const text = await response.text();
      console.log('Login response text:', text);
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch (error) {
        console.error('Error parsing response:', error);
        throw new Error('Invalid server response');
      }
      
      // Check for success
      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Set user data
      const userData = data.user;
      console.log('Login successful, user data:', userData);
      
      setCurrentUser(userData);
      localStorage.setItem('unitask_user', JSON.stringify(userData));
      
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
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

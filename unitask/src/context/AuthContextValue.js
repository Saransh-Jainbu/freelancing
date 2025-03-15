import { createContext, useContext } from 'react';

// Create the auth context
export const AuthContext = createContext();

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

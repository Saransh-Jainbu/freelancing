import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContextValue';

const ProtectedRoute = ({ children, allowedUserTypes = null }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
      </div>
    );
  }
  
  if (!currentUser) {
    // Redirect to login but save the current location they tried to access
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  // Optional user type check
  if (allowedUserTypes && !allowedUserTypes.includes(currentUser.user_type)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

export default ProtectedRoute;

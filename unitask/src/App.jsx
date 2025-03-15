import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContextValue';
import PropTypes from 'prop-types';

// Import components
import LoginPage from './components/login';
import SignupPage from './components/signup';
import ProfilePage from './components/profile';
import MyGigsPage from './components/dashboard';
import Navigation from './components/Navigation';
import OAuthCallback from './components/OAuthCallback';
import LandingPage from './components/LandingPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Navigation />
      {children}
    </>
  );
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
};

// Routes Component - Uses the auth context
const AppRoutes = () => {
  const { currentUser } = useAuth();

  return (
    <Routes>
      {/* Landing page as home route */}
      <Route path="/" element={<LandingPage />} />

      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/oauth-callback" element={<OAuthCallback />} />
      
      {/* Protected routes */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <MyGigsPage />
        </ProtectedRoute>
      } />
      
      {/* Default redirect - send to landing page if not logged in, dashboard if logged in */}
      <Route path="*" element={
        currentUser ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />
      } />
    </Routes>
  );
};

// Main App Component
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;
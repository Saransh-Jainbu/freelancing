import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContextValue';
import PropTypes from 'prop-types';

// Import components
import LoginPage from './components/login';
import SignupPage from './components/signup';
import ProfilePage from './components/profile';
import MyGigsPage from './components/gigs/MyGigs';
import DashboardPage from './components/dashboard';
import ChatPage from './components/chat';
import Navigation from './components/Navigation';
import OAuthCallback from './components/OAuthCallback';
import LandingPage from './components/LandingPage';
import MarketplacePage from './components/marketplace';
import GigDetails from "./components/gigs/GigDetails";

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

  // Always include Navigation for all routes
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
      
      {/* Protected routes with dynamic path support */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
      <Route path="/profile/:userId" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
      
      {/* Other protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/my-gigs" element={
        <ProtectedRoute>
          <MyGigsPage />
        </ProtectedRoute>
      } />
      <Route path="/chat" element={
        <ProtectedRoute>
          <ChatPage />
        </ProtectedRoute>
      } />
      <Route path="/chat/:conversationId" element={
        <ProtectedRoute>
          <ChatPage />
        </ProtectedRoute>
      } />
      
      {/* Marketplace routes */}
      <Route path="/marketplace" element={
        <ProtectedRoute>
          <MarketplacePage />
        </ProtectedRoute>
      } />
      <Route path="/gig/:gigId" element={
        <ProtectedRoute>
          <GigDetails />
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
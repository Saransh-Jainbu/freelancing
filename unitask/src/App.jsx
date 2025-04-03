import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import NotificationBanner from './components/NotificationBanner';
import Layout from './components/Layout'; // Updated correct import path
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './components/LoadingScreen';

// Lazy-loaded components
const HomePage = lazy(() => import('./components/HomePage'));
const LoginPage = lazy(() => import('./components/auth/LoginPage'));
const SignupPage = lazy(() => import('./components/auth/SignupPage'));
const BusinessSignupPage = lazy(() => import('./components/auth/BusinessSignupPage'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const UserProfile = lazy(() => import('./components/profile/UserProfile'));
const ProfileSettingsPage = lazy(() => import('./components/profile/ProfileSettingsPage'));
const GigsPage = lazy(() => import('./components/gigs/GigsPage'));
const GigDetails = lazy(() => import('./components/gigs/GigDetails'));
const ProfilePage = lazy(() => import('./components/profile/ProfilePage'));
const OrdersPage = lazy(() => import('./components/orders/OrdersPage'));
const OrderDetails = lazy(() => import('./components/orders/OrderDetails'));
const ChatPage = lazy(() => import('./components/chat/ChatPage'));
const OrderConfirmation = lazy(() => import('./components/orders/OrderConfirmation'));

// Project marketplace system
const ProjectsList = lazy(() => import('./components/projects/ProjectsList'));
const ProjectDetail = lazy(() => import('./components/projects/ProjectDetail'));
const BusinessProjectsPage = lazy(() => import('./components/business/BusinessProjectsPage'));
const BusinessProjectDetail = lazy(() => import('./components/business/BusinessProjectDetail'));

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <NotificationBanner />
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="signup" element={<SignupPage />} />
                <Route path="business-signup" element={<BusinessSignupPage />} />
                <Route path="dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="profile" element={
                  <ProtectedRoute>
                    <ProfileSettingsPage />
                  </ProtectedRoute>
                } />
                <Route path="profile/:userId" element={<ProfilePage />} />
                <Route path="gigs" element={<GigsPage />} />
                <Route path="gig/:gigId" element={<GigDetails />} />
                <Route path="orders" element={
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                } />
                <Route path="orders/:orderId" element={
                  <ProtectedRoute>
                    <OrderDetails />
                  </ProtectedRoute>
                } />
                <Route path="order-confirmation" element={
                  <ProtectedRoute>
                    <OrderConfirmation />
                  </ProtectedRoute>
                } />
                <Route path="chat/:conversationId?" element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                } />

                {/* Project marketplace routes */}
                <Route path="projects" element={<ProjectsList />} />
                <Route path="projects/:projectId" element={<ProjectDetail />} />
                
                {/* Business project management routes */}
                <Route path="business/projects" element={
                  <ProtectedRoute>
                    <BusinessProjectsPage />
                  </ProtectedRoute>
                } />
                <Route path="business/projects/:projectId" element={
                  <ProtectedRoute>
                    <BusinessProjectDetail />
                  </ProtectedRoute>
                } />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
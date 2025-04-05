import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContextValue';
import { Mail, Lock, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if there's a success message (e.g., after successful registration)
  const successMessage = location.state?.message;
  const redirectPath = location.state?.from || '/dashboard';
  
  // Pre-fill email if provided in location state (e.g., from registration)
  useState(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state?.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-gray-400 mt-2">Log in to your UniTask account</p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-lg p-8">
          {successMessage && (
            <div className="bg-green-500/20 border border-green-500/50 text-green-400 p-4 rounded-lg mb-6">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-black/30 border border-white/10 text-white placeholder-gray-500 pl-10 pr-4 py-2 w-full rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-400" htmlFor="password">
                  Password
                </label>
                <Link to="/forgot-password" className="text-sm text-purple-400 hover:text-purple-300">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-black/30 border border-white/10 text-white placeholder-gray-500 pl-10 pr-4 py-2 w-full rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? 'Logging In...' : 'Log In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-purple-400 hover:text-purple-300">
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Register as a business?{' '}
              <Link to="/business-signup" className="text-purple-400 hover:text-purple-300">
                Business Signup
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

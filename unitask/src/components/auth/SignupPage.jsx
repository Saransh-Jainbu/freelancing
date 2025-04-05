import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../../api/constants';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          displayName: formData.displayName,
          password: formData.password,
          userType: 'freelancer' // Default user type for regular signup
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create account');
      }

      // Redirect to login with success message
      navigate('/login', { 
        state: { 
          message: 'Account created successfully! Please log in.',
          email: formData.email
        }
      });
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Create Your Account</h1>
          <p className="text-gray-400 mt-2">Join UniTask as a freelancer</p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-lg p-8">
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
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-black/30 border border-white/10 text-white placeholder-gray-500 pl-10 pr-4 py-2 w-full rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2" htmlFor="displayName">
                Display Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.displayName}
                  onChange={handleChange}
                  className="bg-black/30 border border-white/10 text-white placeholder-gray-500 pl-10 pr-4 py-2 w-full rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-black/30 border border-white/10 text-white placeholder-gray-500 pl-10 pr-4 py-2 w-full rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
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
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-400 hover:text-purple-300">
                Log in
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Are you a business?{' '}
              <Link to="/business-signup" className="text-purple-400 hover:text-purple-300">
                Register as a business
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;

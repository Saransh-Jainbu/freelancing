import { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Lock, Loader, AlertCircle, Github } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContextValue';
import API_URL from '../api/config';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, currentUser, loading: authLoading } = useAuth();
  const [formVisible, setFormVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormVisible(true);
    
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    // Check for OAuth error in URL
    const searchParams = new URLSearchParams(location.search);
    const oauthError = searchParams.get('error');
    const errorMessage = searchParams.get('message') || '';
    
    if (oauthError) {
      console.error('OAuth error:', oauthError, errorMessage);
      switch (oauthError) {
        case 'google_auth_failed':
          setError(`Google authentication failed. ${errorMessage}`);
          break;
        case 'github_auth_failed':
          setError(`GitHub authentication failed. ${errorMessage}`);
          break;
        case 'oauth_failed':
          setError(`Authentication failed. ${errorMessage}`);
          break;
        default:
          setError(`An error occurred during authentication. ${errorMessage}`);
      }
    }
  }, [location]);

  useEffect(() => {
    // Redirect if user is already logged in
    if (currentUser && !authLoading) {
      navigate('/dashboard');
    }
  }, [currentUser, authLoading, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (!formData.password) {
      setError('Password is required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const authUrl = `${API_URL}/api/auth/google`;
    console.log('[Login] Redirecting for Google auth:', authUrl);
    window.location.href = authUrl;
  };

  const handleGithubLogin = () => {
    const authUrl = `${API_URL}/api/auth/github`;
    console.log('[Login] Redirecting for GitHub auth:', authUrl);
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden px-4">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div 
          className="absolute top-0 -left-4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
          }}
        />
        <div 
          className="absolute bottom-0 right-0 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"
          style={{
            transform: `translate(${-mousePosition.x * 0.02}px, ${-mousePosition.y * 0.02}px)`
          }}
        />
      </div>

      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className={`max-w-md w-full transition-all duration-1000 transform ${formVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        {/* Logo and Back Button */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2 group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Back to Home</span>
          </Link>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
            UniTask
          </span>
        </div>

        {/* Main Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-pink-900/20" />
          
          {/* Form Content */}
          <div className="relative z-10 space-y-6">
            <h2 className="text-2xl font-bold mb-6">Welcome Back</h2>
            
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-3 flex items-start gap-2 text-red-300 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
            
            {/* Social Login Options */}
            <div className="space-y-3">
              <button 
                onClick={handleGoogleLogin}
                className="w-full py-3 px-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center gap-2 group border border-white/10"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
              <button 
                onClick={handleGithubLogin}
                className="w-full py-3 px-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center gap-2 group border border-white/10"
              >
                <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Continue with Github
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-black text-gray-400">Or continue with</span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm text-gray-400">Email</label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-10 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    placeholder="youremail@university.edu"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-gray-400">Password</label>
                  <a href="/forgot-password" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                    Forgot Password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-10 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : 'Sign in'}
              </button>
            </form>
          </div>
        </div>

        {/* Sign Up Link */}
        <p className="text-center mt-6 text-gray-400">
          Don&apos;t have an account?{' '}
          <a href="/signup" className="text-purple-400 hover:text-purple-300 transition-colors">Sign up</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

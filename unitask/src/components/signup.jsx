import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Mail, Lock, User, Github, Phone, Calendar, Building2, Globe, Loader, AlertCircle } from 'lucide-react';
import { registerUser } from '../api/auth';
import { useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import API_URL from '../api/config';

const SignupPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [formVisible, setFormVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    dateOfBirth: '',
    university: '',
    country: '',
    contactNumber: '',
  });

  useEffect(() => {
    setFormVisible(true);
    
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleContinue = () => {
    if (activeStep === 1) {
      // Validate step 1
      if (!formData.displayName.trim()) {
        setError('Full name is required');
        return;
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        setError('Valid email is required');
        return;
      }
      if (!formData.password || formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
    }
    
    if (activeStep === 2) {
      // Validate step 2
      if (!formData.dateOfBirth) {
        setError('Date of birth is required');
        return;
      }
      if (!formData.university.trim()) {
        setError('University name is required');
        return;
      }
      if (!formData.country) {
        setError('Country is required');
        return;
      }
    }
    
    setError('');
    setActiveStep(Math.min(activeStep + 1, 3));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Submitting registration to:', `${API_URL}/api/auth/register`);
      
      const userData = {
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
        university: formData.university,
        location: formData.country,
        dateOfBirth: formData.dateOfBirth,
        contactNumber: formData.contactNumber
      };
      
      const result = await registerUser(userData);
      
      if (result.success) {
        // Redirect to login page
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    const authUrl = `${API_URL}/api/auth/google`;
    console.log('[Signup] Redirecting for Google auth:', authUrl);
    window.location.href = authUrl;
  };

  const handleGithubSignup = () => {
    const authUrl = `${API_URL}/api/auth/github`;
    console.log('[Signup] Redirecting for GitHub auth:', authUrl);
    window.location.href = authUrl;
  };

  const renderFormStep = (step) => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm text-gray-400">Full Name</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-10 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

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
                  placeholder="john@university.edu"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-400">Password</label>
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
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm text-gray-400">Date of Birth</label>
              <div className="relative">
                <Calendar className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-10 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-400">University</label>
              <div className="relative">
                <Building2 className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="university"
                  value={formData.university}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-10 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  placeholder="University Name"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-400">Country</label>
              <div className="relative">
                <Globe className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-10 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-400"
                >
                  <option value="">Select your country</option>
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="IN">India</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="JP">Japan</option>
                  <option value="BR">Brazil</option>
                  <option value="ZA">South Africa</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-400">Contact Number</label>
              <div className="relative">
                <Phone className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-10 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  placeholder="+1 (234) 567-8900"
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-4">
              <div className="text-5xl mb-3">{loading ? "" : "🎉"}</div>
              {loading ? (
                <Loader className="w-16 h-16 text-purple-500 animate-spin mx-auto" />
              ) : (
                <h3 className="text-xl font-semibold">Almost there!</h3>
              )}
              <p className="text-gray-400">
                {loading 
                  ? "Creating your account..." 
                  : "Please verify your email to complete the registration process."
                }
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
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
          
          {/* Steps Indicator */}
          <div className="relative z-10 flex justify-between mb-8">
            {[1, 2, 3].map((step) => (
              <div 
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center relative ${
                  step === activeStep ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/10'
                }`}
              >
                <span className={step === activeStep ? 'text-white' : 'text-gray-400'}>{step}</span>
                {step < 3 && (
                  <div className={`absolute w-full h-0.5 left-full ${
                    step < activeStep ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/10'
                  }`} style={{ width: '100%' }} />
                )}
              </div>
            ))}
          </div>

          {/* Form Content */}
          <div className="relative z-10 space-y-6">
            <h2 className="text-2xl font-bold mb-6">
              {activeStep === 1 && "Create your account"}
              {activeStep === 2 && "Personal Details"}
              {activeStep === 3 && "Verification"}
            </h2>
            
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-3 flex items-start gap-2 text-red-300 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
            
            {activeStep === 1 && (
              <>
                {/* Social Sign Up */}
                <div className="space-y-3">
                  <button 
                    type="button"
                    onClick={handleGoogleSignup}
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
                    type="button"
                    onClick={handleGithubSignup}
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
              </>
            )}

            {renderFormStep(activeStep)}

            {/* Action Button */}
            <button 
              onClick={activeStep === 3 ? handleSubmit : handleContinue}
              className={`w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 group ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {activeStep === 3 ? (
                loading ? 'Creating Account...' : 'Complete Registration'
              ) : 'Continue'}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>

            {/* Terms */}
            {activeStep === 1 && (
              <p className="text-sm text-gray-400 text-center">
                By signing up, you agree to our{' '}
                <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors">Privacy Policy</a>
              </p>
            )}
          </div>
        </div>

        {/* Login Link */}
        <p className="text-center mt-6 text-gray-400">
          Already have an account?{' '}
          <a href="/login" className="text-purple-400 hover:text-purple-300 transition-colors">Sign in</a>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
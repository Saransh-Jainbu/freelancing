import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../api/constants';
import { Mail, Lock, Building, Briefcase, Globe, AlertCircle, Info } from 'lucide-react';

const BusinessSignupForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    companyName: '',
    industry: '',
    companySize: 'small',
    websiteUrl: '',
    companyDescription: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const validateStep1 = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    return true;
  };
  
  const validateStep2 = () => {
    if (!formData.displayName || !formData.companyName) {
      setError('Please provide your name and company name');
      return false;
    }
    
    return true;
  };
  
  const handleNextStep = () => {
    if (step === 1) {
      if (validateStep1()) {
        setError('');
        setStep(2);
      }
    }
  };
  
  const handlePrevStep = () => {
    setStep(1);
    setError('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName,
          userType: 'business',
          businessProfile: {
            companyName: formData.companyName,
            industry: formData.industry,
            companySize: formData.companySize,
            websiteUrl: formData.websiteUrl,
            companyDescription: formData.companyDescription
          }
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // Registration successful, navigate to login
      navigate('/login', {
        state: {
          message: 'Business account created successfully! Please log in.',
          email: formData.email
        }
      });
    } catch (error) {
      setError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="w-full bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-6 md:p-8">
      <h2 className="text-2xl font-semibold mb-6 text-center">Business Registration</h2>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-400">Step {step} of 2</span>
          <div className="w-2/3 bg-gray-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all" 
              style={{ width: step === 1 ? '50%' : '100%' }}
            ></div>
          </div>
        </div>
      </div>
      
      <form onSubmit={step === 1 ? handleNextStep : handleSubmit}>
        {step === 1 && (
          <div className="space-y-6">
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
                  placeholder="business@example.com"
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
                  minLength={6}
                  className="bg-black/30 border border-white/10 text-white placeholder-gray-500 pl-10 pr-4 py-2 w-full rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="••••••••"
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
            
            <div className="pt-4">
              <button
                type="button"
                onClick={handleNextStep}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Continue
              </button>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2" htmlFor="displayName">
                  Your Name
                </label>
                <div className="relative">
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    autoComplete="name"
                    required
                    value={formData.displayName}
                    onChange={handleChange}
                    className="bg-black/30 border border-white/10 text-white placeholder-gray-500 px-3 py-2 w-full rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="John Smith"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2" htmlFor="companyName">
                  Company Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={handleChange}
                    className="bg-black/30 border border-white/10 text-white placeholder-gray-500 pl-10 pr-4 py-2 w-full rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="Acme Inc."
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2" htmlFor="industry">
                Industry
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="industry"
                  name="industry"
                  type="text"
                  value={formData.industry}
                  onChange={handleChange}
                  className="bg-black/30 border border-white/10 text-white placeholder-gray-500 pl-10 pr-4 py-2 w-full rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Technology, Finance, Healthcare, etc."
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2" htmlFor="companySize">
                Company Size
              </label>
              <select
                id="companySize"
                name="companySize"
                value={formData.companySize}
                onChange={handleChange}
                className="bg-black/30 border border-white/10 text-white w-full px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="small">Small (1-10 employees)</option>
                <option value="medium">Medium (11-50 employees)</option>
                <option value="large">Large (51-200 employees)</option>
                <option value="enterprise">Enterprise (201+ employees)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2" htmlFor="websiteUrl">
                Website URL (optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="websiteUrl"
                  name="websiteUrl"
                  type="url"
                  value={formData.websiteUrl}
                  onChange={handleChange}
                  className="bg-black/30 border border-white/10 text-white placeholder-gray-500 pl-10 pr-4 py-2 w-full rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="https://example.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2" htmlFor="companyDescription">
                Company Description (optional)
              </label>
              <textarea
                id="companyDescription"
                name="companyDescription"
                value={formData.companyDescription}
                onChange={handleChange}
                rows="3"
                className="bg-black/30 border border-white/10 text-white placeholder-gray-500 px-3 py-2 w-full rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Tell us briefly about your company..."
              ></textarea>
            </div>
            
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 flex gap-2">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-300">
                <p>You'll be able to complete your business profile after registration.</p>
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handlePrevStep}
                className="w-1/3 py-3 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Account...</span>
                  </>
                ) : 'Create Business Account'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default BusinessSignupForm;

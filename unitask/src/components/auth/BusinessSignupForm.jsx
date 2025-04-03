import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../../api/constants';
import { Building, Mail, Lock, User, Globe, Briefcase, Users } from 'lucide-react';

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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const validateStep1 = () => {
    const { email, password, confirmPassword, displayName } = formData;
    
    if (!email || !password || !confirmPassword || !displayName) {
      setError('All fields are required');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };
  
  const validateStep2 = () => {
    const { companyName, industry } = formData;
    
    if (!companyName || !industry) {
      setError('Company name and industry are required');
      return false;
    }
    
    return true;
  };
  
  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setError('');
      setStep(2);
    }
  };
  
  const handlePrevStep = () => {
    setError('');
    setStep(1);
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
          companyName: formData.companyName,
          industry: formData.industry,
          companySize: formData.companySize,
          websiteUrl: formData.websiteUrl,
          companyDescription: formData.companyDescription
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to register');
      }
      
      // Redirect to login page with success message
      navigate('/login', { 
        state: { 
          message: 'Registration successful! Please log in with your new account.',
          email: formData.email
        } 
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-lg px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold text-center mb-6">Business Account Registration</h2>
        
        {error && (
          <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {step === 1 ? (
          <div className="space-y-4">
            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2" htmlFor="email">
                Email Address
              </label>
              <div className="flex items-center bg-black/30 border border-white/10 rounded overflow-hidden">
                <div className="p-2 border-r border-white/10 text-gray-500">
                  <Mail size={20} />
                </div>
                <input
                  className="appearance-none bg-transparent w-full px-3 py-2 leading-tight focus:outline-none"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@company.com"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2" htmlFor="displayName">
                Contact Person's Name
              </label>
              <div className="flex items-center bg-black/30 border border-white/10 rounded overflow-hidden">
                <div className="p-2 border-r border-white/10 text-gray-500">
                  <User size={20} />
                </div>
                <input
                  className="appearance-none bg-transparent w-full px-3 py-2 leading-tight focus:outline-none"
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2" htmlFor="password">
                Password
              </label>
              <div className="flex items-center bg-black/30 border border-white/10 rounded overflow-hidden">
                <div className="p-2 border-r border-white/10 text-gray-500">
                  <Lock size={20} />
                </div>
                <input
                  className="appearance-none bg-transparent w-full px-3 py-2 leading-tight focus:outline-none"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="********"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="flex items-center bg-black/30 border border-white/10 rounded overflow-hidden">
                <div className="p-2 border-r border-white/10 text-gray-500">
                  <Lock size={20} />
                </div>
                <input
                  className="appearance-none bg-transparent w-full px-3 py-2 leading-tight focus:outline-none"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="********"
                  required
                />
              </div>
            </div>
            
            <div className="flex items-center justify-center mt-6">
              <button
                type="button"
                onClick={handleNextStep}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2" htmlFor="companyName">
                Company Name
              </label>
              <div className="flex items-center bg-black/30 border border-white/10 rounded overflow-hidden">
                <div className="p-2 border-r border-white/10 text-gray-500">
                  <Building size={20} />
                </div>
                <input
                  className="appearance-none bg-transparent w-full px-3 py-2 leading-tight focus:outline-none"
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Acme Inc."
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2" htmlFor="industry">
                Industry
              </label>
              <div className="flex items-center bg-black/30 border border-white/10 rounded overflow-hidden">
                <div className="p-2 border-r border-white/10 text-gray-500">
                  <Briefcase size={20} />
                </div>
                <input
                  className="appearance-none bg-transparent w-full px-3 py-2 leading-tight focus:outline-none"
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  placeholder="Technology, Healthcare, etc."
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2" htmlFor="companySize">
                Company Size
              </label>
              <div className="flex items-center bg-black/30 border border-white/10 rounded overflow-hidden">
                <div className="p-2 border-r border-white/10 text-gray-500">
                  <Users size={20} />
                </div>
                <select
                  className="appearance-none bg-transparent w-full px-3 py-2 leading-tight focus:outline-none"
                  name="companySize"
                  value={formData.companySize}
                  onChange={handleChange}
                >
                  <option value="small">Small (1-10 employees)</option>
                  <option value="medium">Medium (11-50 employees)</option>
                  <option value="large">Large (51-200 employees)</option>
                  <option value="enterprise">Enterprise (201+ employees)</option>
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2" htmlFor="websiteUrl">
                Website URL (optional)
              </label>
              <div className="flex items-center bg-black/30 border border-white/10 rounded overflow-hidden">
                <div className="p-2 border-r border-white/10 text-gray-500">
                  <Globe size={20} />
                </div>
                <input
                  className="appearance-none bg-transparent w-full px-3 py-2 leading-tight focus:outline-none"
                  type="url"
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleChange}
                  placeholder="https://yourcompany.com"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2" htmlFor="companyDescription">
                Company Description (optional)
              </label>
              <textarea
                className="appearance-none bg-black/30 border border-white/10 rounded w-full px-3 py-2 mb-1 leading-tight focus:outline-none"
                name="companyDescription"
                value={formData.companyDescription}
                onChange={handleChange}
                rows="3"
                placeholder="Brief description of your company..."
              ></textarea>
            </div>
            
            <div className="flex items-center justify-between mt-6">
              <button
                type="button"
                onClick={handlePrevStep}
                className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Complete Registration'}
              </button>
            </div>
          </div>
        )}
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-400 hover:text-purple-300">
              Sign in
            </Link>
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Looking to sign up as a freelancer?{' '}
            <Link to="/signup" className="text-purple-400 hover:text-purple-300">
              Freelancer signup
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default BusinessSignupForm;

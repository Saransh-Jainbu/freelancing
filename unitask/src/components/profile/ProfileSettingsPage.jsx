import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContextValue';
import { API_URL } from '../../api/constants';
import { 
  User, 
  Mail, 
  MapPin, 
  Globe, 
  Briefcase, 
  Plus, 
  Trash, 
  AlertCircle, 
  CheckCircle,
  Upload,
  X
} from 'lucide-react';

const ProfileSettingsPage = () => {
  const { currentUser, updateProfile } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState({
    displayName: '',
    title: '',
    description: '',
    location: '',
    website: '',
    skills: [],
  });
  
  // For education section
  const [education, setEducation] = useState([]);
  const [newEducation, setNewEducation] = useState({
    institution: '',
    degree: '',
    startYear: '',
    endYear: '',
  });
  
  // For experience section
  const [experience, setExperience] = useState([]);
  const [newExperience, setNewExperience] = useState({
    position: '',
    company: '',
    startDate: '',
    endDate: '',
    description: '',
  });
  
  // For languages section
  const [languages, setLanguages] = useState([]);
  const [newLanguage, setNewLanguage] = useState({
    name: '',
    level: 'conversational',
  });
  
  // For skill input
  const [skillInput, setSkillInput] = useState('');
  
  // For avatar upload
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  
  // Load user profile data
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/profile/${currentUser.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }
        
        const data = await response.json();
        
        if (data.success) {
          const profile = data.profile;
          
          setProfileData({
            displayName: profile.display_name || '',
            title: profile.title || '',
            description: profile.description || '',
            location: profile.location || '',
            website: profile.website || '',
            skills: profile.skills || [],
          });
          
          setAvatarPreview(profile.avatar_url || '');
          setEducation(profile.education || []);
          setExperience(profile.experience || []);
          setLanguages(profile.languages || []);
        } else {
          throw new Error(data.message || 'Failed to load profile data');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setError(error.message || 'Error loading profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [currentUser]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }
    
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };
  
  // Skills management
  const addSkill = () => {
    if (!skillInput.trim()) return;
    
    if (profileData.skills.includes(skillInput.trim())) {
      setError('This skill already exists');
      return;
    }
    
    if (profileData.skills.length >= 10) {
      setError('You can add a maximum of 10 skills');
      return;
    }
    
    setProfileData(prev => ({
      ...prev,
      skills: [...prev.skills, skillInput.trim()]
    }));
    
    setSkillInput('');
    setError('');
  };
  
  const removeSkill = (skillToRemove) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };
  
  // Education management
  const handleEducationChange = (e) => {
    const { name, value } = e.target;
    setNewEducation(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const addEducation = () => {
    if (!newEducation.institution || !newEducation.degree || !newEducation.startYear) {
      setError('Please fill all required education fields');
      return;
    }
    
    setEducation(prev => [...prev, newEducation]);
    setNewEducation({
      institution: '',
      degree: '',
      startYear: '',
      endYear: '',
    });
    setError('');
  };
  
  const removeEducation = (index) => {
    setEducation(prev => prev.filter((_, i) => i !== index));
  };
  
  // Experience management
  const handleExperienceChange = (e) => {
    const { name, value } = e.target;
    setNewExperience(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const addExperience = () => {
    if (!newExperience.position || !newExperience.company || !newExperience.startDate) {
      setError('Please fill all required experience fields');
      return;
    }
    
    setExperience(prev => [...prev, newExperience]);
    setNewExperience({
      position: '',
      company: '',
      startDate: '',
      endDate: '',
      description: '',
    });
    setError('');
  };
  
  const removeExperience = (index) => {
    setExperience(prev => prev.filter((_, i) => i !== index));
  };
  
  // Languages management
  const handleLanguageChange = (e) => {
    const { name, value } = e.target;
    setNewLanguage(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const addLanguage = () => {
    if (!newLanguage.name) {
      setError('Please enter a language name');
      return;
    }
    
    if (languages.some(lang => lang.name.toLowerCase() === newLanguage.name.toLowerCase())) {
      setError('This language already exists');
      return;
    }
    
    setLanguages(prev => [...prev, newLanguage]);
    setNewLanguage({
      name: '',
      level: 'conversational',
    });
    setError('');
  };
  
  const removeLanguage = (index) => {
    setLanguages(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Build FormData for avatar upload
      const formData = new FormData();
      
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      
      // Add regular fields
      formData.append('displayName', profileData.displayName);
      formData.append('title', profileData.title);
      formData.append('description', profileData.description);
      formData.append('location', profileData.location);
      formData.append('website', profileData.website);
      formData.append('skills', JSON.stringify(profileData.skills));
      formData.append('education', JSON.stringify(education));
      formData.append('experience', JSON.stringify(experience));
      formData.append('languages', JSON.stringify(languages));
      
      // Send update request
      const response = await fetch(`${API_URL}/api/profile/${currentUser.id}`, {
        method: 'PUT',
        body: formData,
        credentials: 'include', // Include cookies for authentication
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }
      
      setSuccess('Profile updated successfully');
      
      // Update auth context with new display name
      updateProfile({ displayName: profileData.displayName });
      
      // Scroll to top to see success message
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!currentUser) {
    navigate('/login');
    return null;
  }
  
  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Profile Settings</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{success}</p>
          </div>
        )}
        
        <div className="flex border-b border-white/10 mb-6">
          <button
            className={`px-4 py-2 border-b-2 ${
              activeTab === 'general' ? 'border-purple-500 text-white' : 'border-transparent text-gray-400'
            }`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`px-4 py-2 border-b-2 ${
              activeTab === 'education' ? 'border-purple-500 text-white' : 'border-transparent text-gray-400'
            }`}
            onClick={() => setActiveTab('education')}
          >
            Education
          </button>
          <button
            className={`px-4 py-2 border-b-2 ${
              activeTab === 'experience' ? 'border-purple-500 text-white' : 'border-transparent text-gray-400'
            }`}
            onClick={() => setActiveTab('experience')}
          >
            Experience
          </button>
          <button
            className={`px-4 py-2 border-b-2 ${
              activeTab === 'languages' ? 'border-purple-500 text-white' : 'border-transparent text-gray-400'
            }`}
            onClick={() => setActiveTab('languages')}
          >
            Languages
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* General Information */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Avatar section */}
              <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Profile Picture</h2>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
                      {avatarPreview ? (
                        <img 
                          src={avatarPreview} 
                          alt="Avatar Preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-gray-500" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-grow">
                    <label className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg cursor-pointer w-fit">
                      <Upload className="w-4 h-4" />
                      <span>Upload Image</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarChange} 
                        className="hidden"
                      />
                    </label>
                    <p className="text-gray-400 text-sm mt-2">
                      Maximum file size: 5MB. Recommended size: 400x400px
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Basic information */}
              <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2" htmlFor="displayName">
                      Display Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        type="text"
                        id="displayName"
                        name="displayName"
                        value={profileData.displayName}
                        onChange={handleInputChange}
                        required
                        className="bg-black/30 border border-white/10 text-white placeholder-gray-500 pl-10 pr-4 py-2 w-full rounded-lg focus:outline-none focus:border-purple-500"
                        placeholder="Your name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 text-sm mb-2" htmlFor="title">
                      Professional Title
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Briefcase className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={profileData.title}
                        onChange={handleInputChange}
                        className="bg-black/30 border border-white/10 text-white placeholder-gray-500 pl-10 pr-4 py-2 w-full rounded-lg focus:outline-none focus:border-purple-500"
                        placeholder="e.g. Web Developer, Graphic Designer"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 text-sm mb-2" htmlFor="email">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        value={currentUser?.email || ''}
                        disabled
                        className="bg-black/30 border border-white/10 text-gray-400 pl-10 pr-4 py-2 w-full rounded-lg cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email address cannot be changed</p>
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 text-sm mb-2" htmlFor="location">
                      Location
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={profileData.location}
                        onChange={handleInputChange}
                        className="bg-black/30 border border-white/10 text-white placeholder-gray-500 pl-10 pr-4 py-2 w-full rounded-lg focus:outline-none focus:border-purple-500"
                        placeholder="e.g. New York, USA"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 text-sm mb-2" htmlFor="website">
                      Website
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Globe className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        value={profileData.website}
                        onChange={handleInputChange}
                        className="bg-black/30 border border-white/10 text-white placeholder-gray-500 pl-10 pr-4 py-2 w-full rounded-lg focus:outline-none focus:border-purple-500"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">About Me</h2>
                <div>
                  <textarea
                    id="description"
                    name="description"
                    value={profileData.description}
                    onChange={handleInputChange}
                    rows={6}
                    className="bg-black/30 border border-white/10 text-white placeholder-gray-500 p-4 w-full rounded-lg focus:outline-none focus:border-purple-500"
                    placeholder="Tell potential clients about your skills and experience..."
                  ></textarea>
                </div>
              </div>
              
              {/* Skills */}
              <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {profileData.skills.map((skill, index) => (
                    <span 
                      key={index} 
                      className="bg-gray-800 text-white px-3 py-1 rounded-full flex items-center gap-2"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="hover:text-red-400 focus:outline-none"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Add a skill..."
                    className="flex-grow bg-black/30 border border-white/10 text-white placeholder-gray-500 px-4 py-2 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Add up to 10 skills relevant to your services
                </p>
              </div>
            </div>
          )}
          
          {/* Education */}
          {activeTab === 'education' && (
            <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-6">Education</h2>
              
              {/* Existing education entries */}
              {education.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {education.map((edu, index) => (
                    <div key={index} className="flex justify-between items-start p-4 border border-white/10 rounded-lg">
                      <div>
                        <p className="font-medium">{edu.institution}</p>
                        <p className="text-gray-400">{edu.degree}</p>
                        <p className="text-sm text-gray-500">
                          {edu.startYear} - {edu.endYear || 'Present'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEducation(index)}
                        className="text-red-400 hover:text-red-300 focus:outline-none"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 mb-6">No education entries added yet.</p>
              )}
              
              {/* Add new education form */}
              <div className="border border-white/10 rounded-lg p-4">
                <h3 className="font-medium mb-4">Add Education</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2" htmlFor="institution">
                      Institution
                    </label>
                    <input
                      type="text"
                      id="institution"
                      name="institution"
                      value={newEducation.institution}
                      onChange={handleEducationChange}
                      className="bg-black/30 border border-white/10 text-white placeholder-gray-500 px-4 py-2 w-full rounded-lg focus:outline-none focus:border-purple-500"
                      placeholder="University or School"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 text-sm mb-2" htmlFor="degree">
                      Degree
                    </label>
                    <input
                      type="text"
                      id="degree"
                      name="degree"
                      value={newEducation.degree}
                      onChange={handleEducationChange}
                      className="bg-black/30 border border-white/10 text-white placeholder-gray-500 px-4 py-2 w-full rounded-lg focus:outline-none focus:border-purple-500"
                      placeholder="e.g. Bachelor of Science, High School Diploma"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2" htmlFor="startYear">
                        Start Year
                      </label>
                      <input
                        type="number"
                        id="startYear"
                        name="startYear"
                        value={newEducation.startYear}
                        onChange={handleEducationChange}
                        min="1900" 
                        max={new Date().getFullYear()}
                        className="bg-black/30 border border-white/10 text-white placeholder-gray-500 px-4 py-2 w-full rounded-lg focus:outline-none focus:border-purple-500"
                        placeholder="e.g. 2018"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-400 text-sm mb-2" htmlFor="endYear">
                        End Year (or expected)
                      </label>
                      <input
                        type="number"
                        id="endYear"
                        name="endYear"
                        value={newEducation.endYear}
                        onChange={handleEducationChange}
                        min="1900" 
                        max={new Date().getFullYear() + 10}
                        className="bg-black/30 border border-white/10 text-white placeholder-gray-500 px-4 py-2 w-full rounded-lg focus:outline-none focus:border-purple-500"
                        placeholder="Leave blank if current"
                      />
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={addEducation}
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 w-full rounded-lg flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Education
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Experience */}
          {activeTab === 'experience' && (
            <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-6">Work Experience</h2>
              
              {/* Existing experience entries */}
              {experience.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {experience.map((exp, index) => (
                    <div key={index} className="flex justify-between items-start p-4 border border-white/10 rounded-lg">
                      <div>
                        <p className="font-medium">{exp.position}</p>
                        <p className="text-gray-400">{exp.company}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(exp.startDate).toLocaleDateString()} - {
                            exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'Present'
                          }
                        </p>
                        {exp.description && <p className="text-sm mt-2">{exp.description}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExperience(index)}
                        className="text-red-400 hover:text-red-300 focus:outline-none"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 mb-6">No work experience added yet.</p>
              )}
              
              {/* Add new experience form */}
              <div className="border border-white/10 rounded-lg p-4">
                <h3 className="font-medium mb-4">Add Experience</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2" htmlFor="position">
                      Position
                    </label>
                    <input
                      type="text"
                      id="position"
                      name="position"
                      value={newExperience.position}
                      onChange={handleExperienceChange}
                      className="bg-black/30 border border-white/10 text-white placeholder-gray-500 px-4 py-2 w-full rounded-lg focus:outline-none focus:border-purple-500"
                      placeholder="Job Title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 text-sm mb-2" htmlFor="company">
                      Company
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={newExperience.company}
                      onChange={handleExperienceChange}
                      className="bg-black/30 border border-white/10 text-white placeholder-gray-500 px-4 py-2 w-full rounded-lg focus:outline-none focus:border-purple-500"
                      placeholder="Company Name"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2" htmlFor="startDate">
                        Start Date
                      </label>
                      <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={newExperience.startDate}
                        onChange={handleExperienceChange}
                        className="bg-black/30 border border-white/10 text-white placeholder-gray-500 px-4 py-2 w-full rounded-lg focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-400 text-sm mb-2" htmlFor="endDate">
                        End Date
                      </label>
                      <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={newExperience.endDate}
                        onChange={handleExperienceChange}
                        className="bg-black/30 border border-white/10 text-white placeholder-gray-500 px-4 py-2 w-full rounded-lg focus:outline-none focus:border-purple-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave blank if current position</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 text-sm mb-2" htmlFor="description">
                      Description (Optional)
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={newExperience.description}
                      onChange={handleExperienceChange}
                      className="bg-black/30 border border-white/10 text-white placeholder-gray-500 px-4 py-2 w-full rounded-lg focus:outline-none focus:border-purple-500"
                      placeholder="Brief description of your responsibilities and achievements"
                      rows={3}
                    ></textarea>
                  </div>
                  
                  <button
                    type="button"
                    onClick={addExperience}
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 w-full rounded-lg flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Experience
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Languages */}
          {activeTab === 'languages' && (
            <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-6">Languages</h2>
              
              {/* Existing languages entries */}
              {languages.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {languages.map((lang, index) => (
                    <div key={index} className="flex justify-between items-center p-4 border border-white/10 rounded-lg">
                      <div>
                        <p className="font-medium">{lang.name}</p>
                        <p className="text-sm text-gray-400">{lang.level}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLanguage(index)}
                        className="text-red-400 hover:text-red-300 focus:outline-none"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 mb-6">No languages added yet.</p>
              )}
              
              {/* Add new language form */}
              <div className="border border-white/10 rounded-lg p-4">
                <h3 className="font-medium mb-4">Add Language</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2" htmlFor="languageName">
                      Language
                    </label>
                    <input
                      type="text"
                      id="languageName"
                      name="name"
                      value={newLanguage.name}
                      onChange={handleLanguageChange}
                      className="bg-black/30 border border-white/10 text-white placeholder-gray-500 px-4 py-2 w-full rounded-lg focus:outline-none focus:border-purple-500"
                      placeholder="e.g. English, Spanish, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 text-sm mb-2" htmlFor="languageLevel">
                      Proficiency Level
                    </label>
                    <select
                      id="languageLevel"
                      name="level"
                      value={newLanguage.level}
                      onChange={handleLanguageChange}
                      className="bg-black/30 border border-white/10 text-white px-4 py-2 w-full rounded-lg focus:outline-none focus:border-purple-500"
                    >
                      <option value="basic">Basic</option>
                      <option value="conversational">Conversational</option>
                      <option value="fluent">Fluent</option>
                      <option value="native">Native/Bilingual</option>
                    </select>
                  </div>
                  
                  <button
                    type="button"
                    onClick={addLanguage}
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 w-full rounded-lg flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Language
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Submit Button - show on all tabs */}
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;

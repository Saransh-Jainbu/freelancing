import { useState, useEffect } from 'react';
import { 
  Edit2, 
  MapPin, 
  Clock, 
  Star, 
  Check, 
  Globe, 
  Plus,
  Camera,
  X,
  Save,
  ChevronDown
} from 'lucide-react';

// Reusing the Modal component from your existing code
const Modal = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-50 w-full max-w-lg bg-gray-900 rounded-xl shadow-xl">
        {children}
      </div>
    </div>
  );
};

// Edit Profile Modal Component
const EditProfileModal = ({ isOpen, onClose, profileData, onSaveProfile }) => {
  const [formData, setFormData] = useState({...profileData});

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveProfile(formData);
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillChange = (index, value) => {
    const updatedSkills = [...formData.skills];
    updatedSkills[index] = value;
    setFormData(prev => ({
      ...prev,
      skills: updatedSkills
    }));
  };

  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, '']
    }));
  };

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center mb-4">
            <div className="relative w-24 h-24 mb-3">
              <img 
                src={formData.avatar || "/api/placeholder/100/100"} 
                alt="Profile" 
                className="w-24 h-24 rounded-full object-cover border-2 border-purple-500"
              />
              <button
                type="button"
                className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center border-2 border-gray-900"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Display Name
            </label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Hourly Rate (USD)
            </label>
            <input
              type="number"
              name="hourlyRate"
              value={formData.hourlyRate}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-400">
                Skills
              </label>
              <button 
                type="button" 
                onClick={addSkill}
                className="text-purple-400 text-sm hover:text-purple-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Skill
              </button>
            </div>
            
            <div className="space-y-2">
              {formData.skills.map((skill, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={skill}
                    onChange={(e) => handleSkillChange(index, e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  />
                  <button 
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-opacity text-white"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

// Profile Page Component
const ProfilePage = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: "Alex Morgan",
    title: "Full-Stack Developer & UI/UX Designer",
    location: "San Francisco, CA",
    memberSince: "September 2023",
    bio: "I'm a passionate developer with over 5 years of experience building web applications and designing user interfaces. Specialized in React, Node.js, and modern JavaScript frameworks.",
    hourlyRate: 45,
    completionRate: 98,
    responseTime: "Under 2 hours",
    totalEarnings: "$24,850",
    totalProjects: 47,
    rating: 4.9,
    reviews: 38,
    skills: ["React.js", "Node.js", "UI/UX Design", "JavaScript", "MongoDB", "Tailwind CSS"],
    isVerified: true,
    languages: ["English (Native)", "Spanish (Conversational)"]
  });

  const handleSaveProfile = (updatedProfile) => {
    setProfileData(updatedProfile);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profileData={profileData}
        onSaveProfile={handleSaveProfile}
      />

      {/* Header */}
      <div className="border-b border-white/5 bg-black/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">My Profile</h1>
              <p className="text-gray-400 mt-1">Manage your freelancer profile</p>
            </div>
            <button 
              className="px-4 py-2 rounded-full border border-white/10 hover:bg-white/5 flex items-center gap-2 transition-colors"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              {/* Profile Banner */}
              <div className="h-32 bg-gradient-to-r from-purple-600 to-pink-600 relative">
                <div className="absolute -bottom-12 left-6">
                  <div className="relative">
                    <img 
                      src="/api/placeholder/100/100" 
                      alt="Profile" 
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-900"
                    />
                    {profileData.isVerified && (
                      <div className="absolute bottom-0 right-0 bg-green-500 p-1 rounded-full border-2 border-gray-900">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-14 px-6 pb-6">
                <h2 className="text-xl font-bold">{profileData.displayName}</h2>
                <p className="text-gray-400 mb-4">{profileData.title}</p>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{profileData.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>Member since {profileData.memberSince}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {profileData.bio}
                  </p>
                </div>

                <button 
                  className="w-full mt-4 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 flex items-center justify-center gap-2 transition-colors"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>

            {/* Skills Card */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <h3 className="text-lg font-semibold mb-4">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((skill, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Languages Card */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <h3 className="text-lg font-semibold mb-4">Languages</h3>
              <div className="space-y-2">
                {profileData.languages.map((language, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span>{language}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Reviews */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Dollar className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{profileData.totalEarnings}</h3>
                    <p className="text-gray-400 text-sm">Total Earnings</p>
                  </div>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full">
                  <div className="h-1 w-3/4 bg-gradient-to-r from-green-500 to-teal-500 rounded-full" />
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{profileData.totalProjects}</h3>
                    <p className="text-gray-400 text-sm">Completed Projects</p>
                  </div>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full">
                  <div className="h-1 w-5/6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-gray-400">Rating</span>
                  </div>
                  <p className="text-2xl font-semibold">{profileData.rating} <span className="text-gray-400 text-sm">/ 5</span></p>
                  <p className="text-gray-400 text-sm mt-1">{profileData.reviews} reviews</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-400">Completion Rate</span>
                  </div>
                  <p className="text-2xl font-semibold">{profileData.completionRate}%</p>
                  <p className="text-gray-400 text-sm mt-1">On-time delivery</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-400">Response Time</span>
                  </div>
                  <p className="text-xl font-semibold">{profileData.responseTime}</p>
                  <p className="text-gray-400 text-sm mt-1">Average</p>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Client Reviews</h3>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">★</span>
                  <span>{profileData.rating}</span>
                  <span className="text-gray-400">({profileData.reviews})</span>
                </div>
              </div>

              {/* Sample Review Item */}
              <div className="border-b border-white/5 pb-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <img 
                    src="/api/placeholder/40/40" 
                    alt="Client" 
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h4 className="font-medium">Daniel Brown</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        <span className="text-yellow-400 text-sm">★★★★★</span>
                      </div>
                      <span className="text-gray-400 text-sm">2 weeks ago</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 text-sm">
                  Alex delivered exceptional work on our e-commerce platform. The code is clean, well-documented, and he implemented all the features we requested. Very responsive and professional throughout the project.
                </p>
              </div>

              {/* Sample Review Item */}
              <div className="border-b border-white/5 pb-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <img 
                    src="/api/placeholder/40/40" 
                    alt="Client" 
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h4 className="font-medium">Sarah Wilson</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        <span className="text-yellow-400 text-sm">★★★★★</span>
                      </div>
                      <span className="text-gray-400 text-sm">1 month ago</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 text-sm">
                  Great communication and excellent work. Alex helped us redesign our dashboard UI and improved the overall user experience. Would definitely hire again for future projects.
                </p>
              </div>

              <button className="w-full mt-2 text-gray-400 hover:text-white flex items-center justify-center gap-1 py-2">
                <span>View all reviews</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper components for icons not included in the imports
const Dollar = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);

const CheckCircle = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

export default ProfilePage;
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContextValue';
import { getProfile, updateProfile } from '../api/profile';
import { Loader, Edit2, Plus, X, Star, CheckCircle, Clock, User, AlertCircle } from 'lucide-react';

const ProfilePage = () => {
  const { userId: urlUserId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Use URL param if available, otherwise use current user's ID
  const userId = urlUserId || (currentUser ? currentUser.id : null);
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [languages, setLanguages] = useState([]);
  const [newLanguage, setNewLanguage] = useState('');

  const isOwnProfile = !urlUserId || (currentUser && urlUserId === String(currentUser.id));

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) {
        return;
      }
      
      try {
        setLoading(true);
        const profileData = await getProfile(userId);
        
        console.log(`[Profile] Loaded profile for user ${userId}:`, profileData);
        
        setProfile(profileData);
        
        // Initialize edited profile state
        setEditedProfile({
          displayName: profileData.display_name || '',
          title: profileData.title || '',
          location: profileData.location || '',
          bio: profileData.bio || '',
          hourlyRate: profileData.hourly_rate || '',
        });
        
        // Initialize skills and languages
        setSkills(profileData.skills || []);
        setLanguages(profileData.languages || []);
      } catch (error) {
        console.error('[Profile] Failed to load profile:', error);
        setError('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [userId, currentUser]);

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    // Reset edited values
    if (profile) {
      setEditedProfile({
        displayName: profile.display_name,
        title: profile.title,
        location: profile.location,
        bio: profile.bio,
        hourlyRate: profile.hourly_rate,
      });
      setSkills(profile.skills || []);
      setLanguages(profile.languages || []);
    }
    
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSkill = () => {
    if (newSkill && !skills.includes(newSkill)) {
      setSkills([...skills, newSkill]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleAddLanguage = () => {
    const languageWithProficiency = newLanguage + " (Fluent)";
    if (newLanguage && !languages.includes(languageWithProficiency)) {
      setLanguages([...languages, languageWithProficiency]);
      setNewLanguage('');
    }
  };

  const handleRemoveLanguage = (langToRemove) => {
    setLanguages(languages.filter(lang => lang !== langToRemove));
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      
      const updatedProfile = await updateProfile(userId, {
        displayName: editedProfile.displayName,
        title: editedProfile.title,
        location: editedProfile.location,
        bio: editedProfile.bio,
        hourlyRate: editedProfile.hourlyRate,
        skills,
        languages
      });
      
      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('[Profile] Failed to save profile:', error);
      setError('Failed to save profile changes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <Loader className="w-10 h-10 text-purple-500 animate-spin mb-4" />
        <p className="text-gray-400">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Error Loading Profile</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10 mb-8 relative">
          {/* Profile Avatar */}
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center text-4xl font-bold relative">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.display_name} 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                profile.display_name?.charAt(0).toUpperCase()
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              {/* Edit Mode: Display Name */}
              {isEditing ? (
                <input
                  type="text"
                  name="displayName"
                  value={editedProfile.displayName}
                  onChange={handleInputChange}
                  className="mb-2 w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-xl font-bold"
                />
              ) : (
                <h1 className="text-3xl font-bold mb-2">{profile.display_name}</h1>
              )}
              
              {/* Edit Mode: Title */}
              {isEditing ? (
                <input
                  type="text"
                  name="title"
                  value={editedProfile.title || ''}
                  onChange={handleInputChange}
                  placeholder="Your professional title"
                  className="mb-4 w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
                />
              ) : (
                <p className="text-xl text-gray-300 mb-4">{profile.title || 'University Student'}</p>
              )}
              
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                {/* Location */}
                <div className="bg-white/5 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  {isEditing ? (
                    <input
                      type="text"
                      name="location"
                      value={editedProfile.location || ''}
                      onChange={handleInputChange}
                      placeholder="Your location"
                      className="w-32 px-2 py-1 bg-transparent focus:outline-none"
                    />
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      <span>{profile.location || 'Not specified'}</span>
                    </>
                  )}
                </div>
                
                {/* Member Since */}
                <div className="bg-white/5 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>Member since {profile.member_since || 'Recently'}</span>
                </div>
                
                {/* Edit Mode: Hourly Rate */}
                {isEditing ? (
                  <div className="bg-white/5 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <span>$</span>
                    <input
                      type="number"
                      name="hourlyRate"
                      value={editedProfile.hourlyRate || ''}
                      onChange={handleInputChange}
                      placeholder="Hourly rate"
                      className="w-16 px-2 py-0 bg-transparent focus:outline-none"
                    />
                    <span>/hr</span>
                  </div>
                ) : profile.hourly_rate ? (
                  <div className="bg-white/5 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>${profile.hourly_rate}/hr</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          
          {/* Edit Button for Own Profile */}
          {isOwnProfile && !isEditing && (
            <button 
              onClick={handleEditProfile}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors group"
            >
              <Edit2 className="w-5 h-5 group-hover:text-purple-400" />
            </button>
          )}
          
          {/* Edit/Cancel Buttons */}
          {isEditing && (
            <div className="flex gap-3 mt-6 justify-end">
              <button 
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:opacity-90 transition-opacity"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-8">
              <h2 className="text-xl font-semibold mb-4">About Me</h2>
              
              {/* Edit Mode: Bio */}
              {isEditing ? (
                <textarea
                  name="bio"
                  value={editedProfile.bio || ''}
                  onChange={handleInputChange}
                  placeholder="Tell others about yourself, your experience and what you do..."
                  rows="6"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                ></textarea>
              ) : (
                <p className="text-gray-300 whitespace-pre-wrap">
                  {profile.bio || 'No biography available.'}
                </p>
              )}
            </div>
            
            {/* Skills */}
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-8">
              <h2 className="text-xl font-semibold mb-4">Skills</h2>
              
              {/* Edit Mode: Skills Input */}
              {isEditing && (
                <div className="mb-4 flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill"
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                  />
                  <button
                    onClick={handleAddSkill}
                    className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2">
                {skills.length > 0 ? (
                  skills.map((skill, index) => (
                    <div key={index} className="bg-white/5 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      <span>{skill}</span>
                      {/* Remove skill button when editing */}
                      {isEditing && (
                        <button 
                          onClick={() => handleRemoveSkill(skill)} 
                          className="ml-1 text-gray-400 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No skills listed yet.</p>
                )}
              </div>
            </div>
            
            {/* Languages */}
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold mb-4">Languages</h2>
              
              {/* Edit Mode: Languages Input */}
              {isEditing && (
                <div className="mb-4 flex gap-2">
                  <input
                    type="text"
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    placeholder="Add a language"
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()}
                  />
                  <button
                    onClick={handleAddLanguage}
                    className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2">
                {languages.length > 0 ? (
                  languages.map((language, index) => (
                    <div key={index} className="bg-white/5 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      <span>{language}</span>
                      {/* Remove language button when editing */}
                      {isEditing && (
                        <button 
                          onClick={() => handleRemoveLanguage(language)} 
                          className="ml-1 text-gray-400 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No languages listed yet.</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Column */}
          <div>
            {/* Stats */}
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-8">
              <h2 className="text-xl font-semibold mb-4">Stats</h2>
              
              <div className="space-y-4">
                {/* Rating */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-400 mr-2 fill-yellow-400" />
                    <span>Rating</span>
                  </div>
                  <span className="font-semibold">{profile.rating || '0.0'}/5.0</span>
                </div>
                
                {/* Verified */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                    <span>Verified</span>
                  </div>
                  <span className="font-semibold">{profile.is_verified ? 'Yes' : 'No'}</span>
                </div>
                
                {/* Response Time */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-blue-400 mr-2" />
                    <span>Response Time</span>
                  </div>
                  <span className="font-semibold">{profile.response_time || 'N/A'}</span>
                </div>
                
                {/* Projects */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    <span>Projects</span>
                  </div>
                  <span className="font-semibold">{profile.total_projects || '0'}</span>
                </div>
                
                {/* Completion Rate */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-orange-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Completion Rate</span>
                  </div>
                  <span className="font-semibold">{profile.completion_rate ? `${profile.completion_rate}%` : 'N/A'}</span>
                </div>
                
                {/* Total Earnings */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Total Earnings</span>
                  </div>
                  <span className="font-semibold">${profile.total_earnings || '0'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_URL } from '../../api/constants';
import { User, Star, MapPin, Globe, Calendar, MessageSquare, Briefcase } from 'lucide-react';

const UserProfile = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/profile/${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setProfile(data.profile);
        } else {
          throw new Error(data.message || 'Failed to load profile');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError(error.message || 'Error loading profile');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [userId]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-purple-500 rounded-full mb-4"></div>
        <p className="text-gray-400">Loading profile...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-4 text-center">Error Loading Profile</h2>
          <p className="text-center mb-6">{error}</p>
          <div className="flex justify-center">
            <Link
              to="/"
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
        <div className="bg-gray-900 border border-white/10 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-4 text-center">Profile Not Found</h2>
          <p className="text-center mb-6">The requested profile could not be found.</p>
          <div className="flex justify-center">
            <Link
              to="/"
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-800 rounded-full flex items-center justify-center overflow-hidden">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.display_name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-gray-500" />
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold mb-2">{profile.display_name}</h1>
              
              {profile.title && (
                <p className="text-gray-300 mb-2">{profile.title}</p>
              )}
              
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-4">
                {profile.location && (
                  <span className="flex items-center gap-1 text-sm text-gray-400">
                    <MapPin className="w-4 h-4" />
                    {profile.location}
                  </span>
                )}
                
                <span className="flex items-center gap-1 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  Member since {new Date(profile.created_at).toLocaleDateString()}
                </span>
                
                {profile.rating !== null && (
                  <span className="flex items-center gap-1 text-yellow-400">
                    <Star className="w-4 h-4" />
                    {profile.rating.toFixed(1)} ({profile.reviews_count} reviews)
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Contact Me
                </button>
                
                {profile.website && (
                  <a 
                    href={profile.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg flex items-center gap-2"
                  >
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* About */}
            <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">About Me</h2>
              {profile.description ? (
                <div className="prose prose-invert max-w-none">
                  <p className="whitespace-pre-line text-gray-300">{profile.description}</p>
                </div>
              ) : (
                <p className="text-gray-500">No description provided.</p>
              )}
            </div>
            
            {/* Portfolio/Services */}
            {profile.user_type === 'freelancer' && (
              <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Services</h2>
                  <span className="text-sm text-gray-400">
                    {profile.gigs_count} service{profile.gigs_count !== 1 && 's'}
                  </span>
                </div>
                
                {profile.gigs && profile.gigs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.gigs.map((gig) => (
                      <Link
                        key={gig.id}
                        to={`/gig/${gig.id}`}
                        className="block bg-black/30 border border-white/10 hover:border-purple-500/30 rounded-lg overflow-hidden transition-colors"
                      >
                        <div className="h-32 bg-gray-800">
                          {gig.main_image && (
                            <img
                              src={gig.main_image}
                              alt={gig.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="text-sm font-medium mb-2 line-clamp-2">{gig.title}</h3>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Starting at</span>
                            <span className="font-semibold">${gig.base_price}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No services available.</p>
                )}
              </div>
            )}

            {/* Reviews */}
            <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Reviews</h2>
                <span className="text-sm text-gray-400">
                  {profile.reviews_count} review{profile.reviews_count !== 1 && 's'}
                </span>
              </div>
              
              {profile.reviews && profile.reviews.length > 0 ? (
                <div className="space-y-4">
                  {profile.reviews.map((review, index) => (
                    <div key={index} className="border-b border-white/5 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">{review.reviewer_name}</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-700'}`}
                              fill={i < review.rating ? 'currentColor' : 'none'}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-300">{review.comment}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No reviews yet.</p>
              )}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Skills */}
            <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-3">Skills</h2>
              {profile.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span 
                      key={index}
                      className="bg-purple-900/30 border border-purple-500/30 text-purple-300 rounded-full px-3 py-1 text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No skills listed.</p>
              )}
            </div>
            
            {/* Languages */}
            <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-3">Languages</h2>
              {profile.languages && profile.languages.length > 0 ? (
                <div className="space-y-2">
                  {profile.languages.map((lang, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{lang.name}</span>
                      <span className="text-gray-400">{lang.level}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No languages listed.</p>
              )}
            </div>
            
            {/* Education or Experience */}
            {profile.education && profile.education.length > 0 && (
              <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-3">Education</h2>
                <div className="space-y-3">
                  {profile.education.map((edu, index) => (
                    <div key={index} className="border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
                      <h3 className="font-medium">{edu.institution}</h3>
                      <p className="text-sm text-gray-300">{edu.degree}</p>
                      <p className="text-xs text-gray-500">
                        {edu.start_year} - {edu.end_year || 'Present'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {profile.experience && profile.experience.length > 0 && (
              <div className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-3">Experience</h2>
                <div className="space-y-3">
                  {profile.experience.map((exp, index) => (
                    <div key={index} className="border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
                      <h3 className="font-medium">{exp.position}</h3>
                      <p className="text-sm text-gray-300">{exp.company}</p>
                      <p className="text-xs text-gray-500">
                        {exp.start_date} - {exp.end_date || 'Present'}
                      </p>
                      {exp.description && (
                        <p className="text-xs text-gray-400 mt-1">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

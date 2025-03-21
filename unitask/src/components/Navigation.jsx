import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Grid, User, Briefcase, Settings, ChevronDown, MessageSquare, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContextValue';
import { getProfile } from '../api/profile';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch profile data when currentUser changes
  useEffect(() => {
    const fetchProfileData = async () => {
      if (currentUser?.id) {
        try {
          const profile = await getProfile(currentUser.id);
          console.log("Fetched profile data:", profile);
          setProfileData(profile);
        } catch (error) {
          console.error("Error fetching profile data:", error);
        }
      }
    };

    fetchProfileData();
  }, [currentUser]);

  // For debugging
  useEffect(() => {
    console.log("Navigation currentUser:", currentUser);
    console.log("Navigation profileData:", profileData);
  }, [currentUser, profileData]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileMenuOpen) {
        setIsProfileMenuOpen(false);
      }
    };
    
    // Add event listener when component mounts
    document.addEventListener('mousedown', handleClickOutside);
    
    // Remove event listener when component unmounts
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAvatarError = () => {
    console.log("Avatar failed to load");
    setAvatarError(true);
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Grid },
    { name: 'My Gigs', path: '/my-gigs', icon: Briefcase },
    { name: 'Marketplace', path: '/marketplace', icon: ShoppingBag },
    { name: 'Messages', path: '/chat', icon: MessageSquare },
    { name: 'Profile', path: '/profile', icon: User }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Get avatar URL from currentUser with proper fallback handling
  const getAvatarUrl = () => {
    // First check profile data from API
    if (profileData?.avatar_url) {
      return profileData.avatar_url;
    }
    // Then check different possible locations in currentUser
    if (currentUser?.avatar_url) {
      return currentUser.avatar_url;
    } else if (currentUser?.photoURL) {
      return currentUser.photoURL;
    } else if (currentUser?.profile?.avatar_url) {
      return currentUser.profile.avatar_url;
    }
    return null;
  };

  // Default avatar or initials if no avatar is available
  const getAvatarContent = () => {
    const avatarUrl = getAvatarUrl();
    console.log("Avatar URL being used:", avatarUrl);
    
    if (!avatarError && avatarUrl) {
      return (
        <img
          className="h-8 w-8 rounded-full object-cover"
          src={avatarUrl}
          alt="Profile"
          onError={handleAvatarError}
        />
      );
    } else {
      // Get display name from profile data first, then fall back to currentUser
      const displayName = profileData?.display_name || currentUser?.display_name || currentUser?.name || '';
      return (
        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-600 flex items-center justify-center text-white font-bold">
          {displayName.charAt(0) || 'U'}
        </div>
      );
    }
  };

  const getMobileAvatarContent = () => {
    const avatarUrl = getAvatarUrl();
    
    if (!avatarError && avatarUrl) {
      return (
        <img
          className="h-10 w-10 rounded-full object-cover"
          src={avatarUrl}
          alt="Profile"
          onError={handleAvatarError}
        />
      );
    } else {
      return (
        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-600 flex items-center justify-center text-white font-bold">
          {currentUser?.display_name?.charAt(0) || currentUser?.name?.charAt(0) || 'U'}
        </div>
      );
    }
  };

  // Get display name with fallbacks
  const getDisplayName = () => {
    return profileData?.display_name || currentUser?.display_name || currentUser?.name || 'User';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-white/10 h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link to="/dashboard" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
                UniTask
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-10 md:flex md:items-center md:space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
                    isActive(item.path)
                      ? 'bg-white/10 text-white'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon size={16} />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Profile dropdown */}
          <div className="hidden md:flex md:items-center">
            <div className="ml-3 relative">
              <div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProfileMenuOpen(!isProfileMenuOpen);
                  }}
                  className="flex items-center gap-2 text-sm bg-white/5 border border-white/10 rounded-full px-3 py-2 hover:bg-white/10 focus:outline-none"
                >
                  {getAvatarContent()}
                  <span className="hidden md:block">{getDisplayName()}</span>
                  <ChevronDown size={16} />
                </button>
              </div>
              {isProfileMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-gray-900 border border-white/10 ring-1 ring-black ring-opacity-5">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <User size={16} />
                    Your Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <Settings size={16} />
                    Settings
                  </Link>
                  <div className="border-t border-white/5 my-1" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/5 focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`block px-3 py-2 rounded-md text-base font-medium flex items-center gap-3 ${
                  isActive(item.path)
                    ? 'bg-white/10 text-white'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-white/5">
            <div className="flex items-center px-5">
              <div className="flex-shrink-0">
                {getMobileAvatarContent()}
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-white">
                  {getDisplayName()}
                </div>
                <div className="text-sm font-medium text-gray-400">
                  {currentUser?.email || 'user@example.com'}
                </div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <Link
                to="/profile"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <User size={18} />
                Your Profile
              </Link>
              <Link
                to="/settings"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <Settings size={18} />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-white/5 flex items-center gap-3"
              >
                <LogOut size={18} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;

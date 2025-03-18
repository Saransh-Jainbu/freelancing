import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContextValue';
import { Bell, MessageSquare, Menu, X, ChevronDown, LogOut, User, Grid, Settings } from 'lucide-react';

const Navigation = () => {
  const { currentUser, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [avatarUrl, setAvatarUrl] = useState(null);

  // Get avatar URL when current user changes
  useEffect(() => {
    if (currentUser) {
      // Fetch the user's profile to get the latest avatar URL with SAS token
      fetch(`${API_URL}/api/profile/${currentUser.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.profile && data.profile.avatar_url) {
            console.log("Updated avatar URL from profile:", data.profile.avatar_url);
            setAvatarUrl(data.profile.avatar_url);
          }
        })
        .catch(err => {
          console.error("Error fetching user profile for avatar:", err);
        });
    }
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfileMenu = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  };

  if (!currentUser) return null;

  return (
    <nav className="bg-black border-b border-white/10 py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
              UniTask
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/marketplace"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              Marketplace
            </NavLink>
            <NavLink
              to="/my-gigs"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              My Gigs
            </NavLink>
            <NavLink
              to="/chat"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              Messages
            </NavLink>
          </div>

          {/* Right Navigation Items (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5">
              <Bell className="w-5 h-5" />
            </button>
            <Link to="/chat" className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5">
              <MessageSquare className="w-5 h-5" />
            </Link>
            <div className="relative">
              <button
                onClick={toggleProfileMenu}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/10"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-medium">
                      {currentUser.display_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg z-10 py-1 border border-white/10">
                  <Link
                    to="/profile"
                    className="px-4 py-2.5 flex items-center gap-2 hover:bg-white/5 w-full text-left"
                    onClick={closeMenus}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="px-4 py-2.5 flex items-center gap-2 hover:bg-white/5 w-full text-left"
                    onClick={closeMenus}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <hr className="border-white/10 my-1" />
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2.5 flex items-center gap-2 hover:bg-red-900/20 text-red-400 w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-900 border-t border-white/10 animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium ${
                  isActive ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`
              }
              onClick={closeMenus}
            >
              <Grid className="w-5 h-5 mr-2 inline-block" />
              Dashboard
            </NavLink>
            <NavLink
              to="/marketplace"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium ${
                  isActive ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`
              }
              onClick={closeMenus}
            >
              <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
              </svg>
              Marketplace
            </NavLink>
            <NavLink
              to="/my-gigs"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium ${
                  isActive ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`
              }
              onClick={closeMenus}
            >
              <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
              My Gigs
            </NavLink>
            <NavLink
              to="/chat"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium ${
                  isActive ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`
              }
              onClick={closeMenus}
            >
              <MessageSquare className="w-5 h-5 mr-2 inline-block" />
              Messages
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium ${
                  isActive ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`
              }
              onClick={closeMenus}
            >
              <User className="w-5 h-5 mr-2 inline-block" />
              Profile
            </NavLink>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-red-900/20"
            >
              <LogOut className="w-5 h-5 mr-2 inline-block" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;

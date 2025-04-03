import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContextValue';
import NotificationBell from './NotificationBell';
import { 
  Menu, X, Home, User, PanelLeft, Briefcase, Clipboard, 
  LogOut, MessageSquare, Settings, ChevronDown, Wallet, Building
} from 'lucide-react';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const isLoggedIn = !!currentUser;
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const closeDropdowns = (e) => {
      if (showUserDropdown && 
          !e.target.closest('.user-dropdown-toggle') && 
          !e.target.closest('.user-dropdown-menu')) {
        setShowUserDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', closeDropdowns);
    return () => {
      document.removeEventListener('mousedown', closeDropdowns);
    };
  }, [showUserDropdown]);
  
  return (
    <nav className="bg-black/80 backdrop-blur-md border-b border-white/10 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 h-8 w-8 rounded-lg"></span>
                <span className="font-bold text-xl">UniTask</span>
              </Link>
            </div>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link to="/" className="px-3 py-2 rounded-md text-sm hover:bg-white/5">
              Home
            </Link>
            <Link to="/gigs" className="px-3 py-2 rounded-md text-sm hover:bg-white/5">
              Services
            </Link>
            <Link to="/projects" className="px-3 py-2 rounded-md text-sm hover:bg-white/5">
              Projects
            </Link>
            {!isLoggedIn ? (
              <>
                <Link to="/login" className="ml-4 px-4 py-2 rounded-md text-sm hover:bg-white/5 transition-colors">
                  Login
                </Link>
                <Link to="/signup" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-md text-sm hover:opacity-90 transition-opacity">
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                {currentUser.user_type === 'business' ? (
                  <Link to="/business/projects" className="px-3 py-2 rounded-md text-sm hover:bg-white/5">
                    My Projects
                  </Link>
                ) : (
                  <Link to="/orders" className="px-3 py-2 rounded-md text-sm hover:bg-white/5">
                    Orders
                  </Link>
                )}
                <Link to="/chat" className="px-3 py-2 rounded-md text-sm hover:bg-white/5">
                  Messages
                </Link>
                <div className="ml-2">
                  <NotificationBell />
                </div>
                <div className="relative">
                  <button
                    className="ml-2 flex items-center gap-2 user-dropdown-toggle"
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                      {currentUser.avatarUrl ? (
                        <img 
                          src={currentUser.avatarUrl} 
                          alt={currentUser.displayName || 'User'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-lg shadow-lg user-dropdown-menu z-20">
                      <div className="p-2 border-b border-white/10">
                        <div className="font-medium">
                          {currentUser.displayName || 'User'}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {currentUser.email}
                        </div>
                      </div>
                      <div className="py-1">
                        <Link 
                          to="/dashboard" 
                          className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 text-sm"
                        >
                          <PanelLeft className="w-4 h-4" />
                          Dashboard
                        </Link>
                        <Link 
                          to="/profile" 
                          className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 text-sm"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                        
                        {currentUser.user_type === 'business' ? (
                          <Link 
                            to="/business/projects" 
                            className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 text-sm"
                          >
                            <Building className="w-4 h-4" />
                            Business Projects
                          </Link>
                        ) : (
                          <>
                            <Link 
                              to="/orders" 
                              className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 text-sm"
                            >
                              <Clipboard className="w-4 h-4" />
                              Orders
                            </Link>
                            <Link 
                              to={`/profile/${currentUser.id}`} 
                              className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 text-sm"
                            >
                              <User className="w-4 h-4" />
                              My Profile
                            </Link>
                          </>
                        )}
                        
                        <Link 
                          to="/chat" 
                          className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 text-sm"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Messages
                        </Link>
                        
                        <button 
                          onClick={logout} 
                          className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 text-sm w-full text-left text-red-400"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            {isLoggedIn && (
              <>
                <div className="mr-2">
                  <NotificationBell />
                </div>
                <Link to="/chat" className="p-2 rounded-md text-sm hover:bg-white/5 mr-2">
                  <MessageSquare className="w-5 h-5" />
                </Link>
              </>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md hover:bg-white/5"
            >
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link 
              to="/" 
              className="block px-3 py-2 rounded-md hover:bg-white/5 flex items-center gap-2"
            >
              <Home className="w-5 h-5" />
              Home
            </Link>
            <Link 
              to="/gigs" 
              className="block px-3 py-2 rounded-md hover:bg-white/5 flex items-center gap-2"
            >
              <Briefcase className="w-5 h-5" />
              Services
            </Link>
            <Link 
              to="/projects" 
              className="block px-3 py-2 rounded-md hover:bg-white/5 flex items-center gap-2"
            >
              <Clipboard className="w-5 h-5" />
              Projects
            </Link>

            {isLoggedIn ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="block px-3 py-2 rounded-md hover:bg-white/5 flex items-center gap-2"
                >
                  <PanelLeft className="w-5 h-5" />
                  Dashboard
                </Link>
                {currentUser.user_type === 'business' ? (
                  <Link 
                    to="/business/projects" 
                    className="block px-3 py-2 rounded-md hover:bg-white/5 flex items-center gap-2"
                  >
                    <Building className="w-5 h-5" />
                    Business Projects
                  </Link>
                ) : (
                  <Link 
                    to="/orders" 
                    className="block px-3 py-2 rounded-md hover:bg-white/5 flex items-center gap-2"
                  >
                    <Clipboard className="w-5 h-5" />
                    Orders
                  </Link>
                )}
                <Link 
                  to="/profile" 
                  className="block px-3 py-2 rounded-md hover:bg-white/5 flex items-center gap-2"
                >
                  <User className="w-5 h-5" />
                  Profile
                </Link>
                <button 
                  onClick={logout} 
                  className="block w-full text-left px-3 py-2 rounded-md hover:bg-white/5 text-red-400 flex items-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block px-3 py-2 rounded-md hover:bg-white/5 border border-white/10 text-center"
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="block px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-md text-center"
                >
                  Sign Up
                </Link>
                <Link 
                  to="/business-signup" 
                  className="block px-3 py-2 rounded-md hover:bg-white/5 text-center text-sm"
                >
                  Register as a Business
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;

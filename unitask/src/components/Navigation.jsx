import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContextValue';
import { useBreakpoints } from '../hooks/useMediaQuery';
import { Menu, X, User, Bell, MessageSquare, ChevronDown } from 'lucide-react';
import NotificationBell from './NotificationBell';

const Navigation = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { isMobile } = useBreakpoints();
  
  // Close mobile menu when changing routes
  useEffect(() => {
    setIsOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  const isFreelancer = currentUser?.user_type === 'freelancer';
  const isBusiness = currentUser?.user_type === 'business';
  
  return (
    <nav className="bg-gray-900/80 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and left nav */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
                UniTask
              </span>
            </Link>
            
            {/* Desktop Nav Links */}
            <div className="hidden md:ml-8 md:flex md:items-center md:space-x-4">
              <Link 
                to="/gigs" 
                className="px-3 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Services
              </Link>
              <Link 
                to="/projects" 
                className="px-3 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Projects
              </Link>
            </div>
          </div>
          
          {/* Right side nav items */}
          <div className="flex items-center">
            {currentUser ? (
              <>
                {/* Desktop Nav Links */}
                <div className="hidden md:flex md:items-center md:space-x-1">
                  {isFreelancer && (
                    <Link
                      to="/orders"
                      className="p-2 text-gray-300 hover:text-white transition-colors"
                    >
                      Orders
                    </Link>
                  )}
                  
                  {isBusiness && (
                    <Link
                      to="/business/projects"
                      className="p-2 text-gray-300 hover:text-white transition-colors"
                    >
                      My Projects
                    </Link>
                  )}
                  
                  <Link
                    to="/chat"
                    className="p-2 text-gray-300 hover:text-white transition-colors relative"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </Link>
                  
                  <NotificationBell />
                  
                  <div className="relative ml-3">
                    <div>
                      <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center text-sm rounded-full focus:outline-none"
                      >
                        <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center">
                          {currentUser.avatarUrl ? (
                            <img
                              className="h-8 w-8 rounded-full object-cover"
                              src={currentUser.avatarUrl}
                              alt={currentUser.displayName}
                            />
                          ) : (
                            <User className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                        <ChevronDown className="w-4 h-4 ml-1 text-gray-400" />
                      </button>
                    </div>
                    
                    {dropdownOpen && (
                      <div 
                        className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none"
                      >
                        <div className="px-4 py-2 border-b border-white/5">
                          <p className="text-sm">{currentUser.displayName}</p>
                          <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
                        </div>
                        <Link
                          to="/dashboard"
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 w-full text-left"
                        >
                          Dashboard
                        </Link>
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 w-full text-left"
                        >
                          Profile Settings
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 w-full text-left"
                        >
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Mobile menu button */}
                <div className="flex md:hidden">
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
                  >
                    {isOpen ? (
                      <X className="block h-6 w-6" />
                    ) : (
                      <Menu className="block h-6 w-6" />
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="hidden md:flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Sign Up
                  </Link>
                </div>
                
                {/* Mobile menu button */}
                <div className="flex md:hidden">
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
                  >
                    {isOpen ? (
                      <X className="block h-6 w-6" />
                    ) : (
                      <Menu className="block h-6 w-6" />
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-gray-900 border-b border-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/gigs"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              Services
            </Link>
            <Link
              to="/projects"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              Projects
            </Link>
            
            {currentUser ? (
              <>
                {isFreelancer && (
                  <Link
                    to="/orders"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                    onClick={() => setIsOpen(false)}
                  >
                    Orders
                  </Link>
                )}
                
                {isBusiness && (
                  <Link
                    to="/business/projects"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                    onClick={() => setIsOpen(false)}
                  >
                    My Projects
                  </Link>
                )}
                
                <Link
                  to="/chat"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Messages
                </Link>
                
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                
                <Link
                  to="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Profile Settings
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Log In
                </Link>
                
                <Link
                  to="/signup"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
                
                <Link
                  to="/business-signup"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Business Sign Up
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

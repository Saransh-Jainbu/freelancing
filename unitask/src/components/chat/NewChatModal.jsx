import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Search, Loader, UserPlus } from 'lucide-react';
import { API_URL } from '../../constants';

const NewChatModal = ({ isOpen, onClose, onSelectUser, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && searchTerm.length >= 2) {
      searchUsers(searchTerm);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, isOpen]);

  const searchUsers = async (query) => {
    if (query.length < 2) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/users/search?q=${encodeURIComponent(query)}&currentUserId=${currentUser.id}`
      );
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const data = await response.json();
      setSearchResults(data.users || []);
      setError('');
    } catch (error) {
      console.error('Error searching users:', error);
      setError('Failed to search users. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      ></div>
      
      <div className="relative bg-gray-900 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 p-4 border-b border-white/10 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold">New Message</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-10 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
          </div>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 text-red-300 text-sm">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="py-8 flex justify-center">
              <Loader className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          ) : searchResults.length === 0 && searchTerm.length >= 2 ? (
            <div className="text-center py-8 text-gray-400">
              No users found
            </div>
          ) : (
            <ul className="space-y-2">
              {searchResults.map(user => (
                <li key={user.id}>
                  <button 
                    onClick={() => onSelectUser(user.id)}
                    className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden mr-3 flex-shrink-0">
                        {user.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            alt={user.display_name} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center text-white font-medium">
                                  ${user.display_name?.charAt(0).toUpperCase()}
                                </div>
                              `;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-medium">
                            {user.display_name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{user.display_name}</p>
                        <p className="text-gray-400 text-sm">{user.title || 'Student'}</p>
                      </div>
                    </div>
                    <UserPlus className="w-5 h-5 text-purple-400" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          
          {!loading && searchTerm.length < 2 && (
            <div className="text-center py-8 text-gray-400">
              Type at least 2 characters to search
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

NewChatModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelectUser: PropTypes.func.isRequired,
  currentUser: PropTypes.object.isRequired,
};

export default NewChatModal;

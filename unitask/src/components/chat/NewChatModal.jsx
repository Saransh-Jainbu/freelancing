import { useState } from 'react';
import PropTypes from 'prop-types';
import { X, Search, Loader, User, Check } from 'lucide-react';
import Modal from '../common/Modal';

const NewChatModal = ({ isOpen, onClose, onCreateConversation, users }) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filteredUsers = users.filter(user => 
    user.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserToggle = (user) => {
    if (selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user to chat with');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Extract just the IDs for API call
      const participantIds = selectedUsers.map(user => user.id);
      await onCreateConversation(participantIds);
      onClose();
      setSelectedUsers([]);
      setSearchQuery('');
    } catch (err) {
      setError(err.message || 'Failed to create conversation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">New Conversation</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}
        
        {/* Selected Users Pills */}
        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedUsers.map(user => (
              <div 
                key={user.id}
                className="bg-white/10 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
              >
                <span>{user.display_name}</span>
                <button 
                  onClick={() => handleUserToggle(user)}
                  className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full px-10 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
          />
        </div>
        
        {/* User List */}
        <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => {
              const isSelected = selectedUsers.some(u => u.id === user.id);
              return (
                <div 
                  key={user.id}
                  onClick={() => handleUserToggle(user)}
                  className={`p-2 flex items-center gap-3 rounded-lg cursor-pointer ${
                    isSelected ? 'bg-purple-500/20' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="relative w-10 h-10">
                    <img 
                      src={user.avatar_url || "/api/placeholder/40/40"} 
                      alt={user.display_name} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 bg-purple-500 text-white w-5 h-5 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{user.display_name}</h4>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center py-6 text-gray-400">
              <User className="w-12 h-12 mb-2 opacity-50" />
              <p>No users found</p>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-white"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateChat}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-opacity text-white flex items-center gap-2"
            disabled={loading || selectedUsers.length === 0}
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : 'Start Conversation'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

NewChatModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreateConversation: PropTypes.func.isRequired,
  users: PropTypes.array.isRequired
};

export default NewChatModal;

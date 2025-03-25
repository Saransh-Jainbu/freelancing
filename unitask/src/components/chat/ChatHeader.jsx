import PropTypes from 'prop-types';
import { MoreVertical, ChevronLeft, User, Trash } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ChatHeader = ({ participants, onToggleSidebar, showSidebarToggle, onDeleteChat }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const displayParticipant = participants[0] || {};
  const multipleParticipants = participants.length > 1;
  const navigate = useNavigate();
  
  return (
    <div className="sticky top-0 z-20 p-4 border-b border-white/10 flex items-center gap-3 bg-gray-900/95 backdrop-blur-sm">
      {/* Mobile back button */}
      <button 
        onClick={() => navigate('/chat')}
        className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/5"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      {/* Avatar */}
      <div className="flex-shrink-0">
        {displayParticipant.avatar_url ? (
          <img 
            src={displayParticipant.avatar_url} 
            alt={displayParticipant.display_name || 'User'}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-600 flex items-center justify-center text-white text-lg font-semibold">
            {displayParticipant.display_name?.charAt(0) || '?'}
          </div>
        )}
      </div>
      
      {/* User info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-base truncate">
          {displayParticipant.display_name || 'Unknown'}
          {multipleParticipants && (
            <span className="text-gray-400 text-sm ml-1">
              +{participants.length - 1}
            </span>
          )}
        </h3>
        <p className="text-xs text-gray-400 truncate">Online</p>
      </div>
      
      {/* Actions dropdown */}
      <div className="relative">
        <button 
          onClick={() => setShowDropdown(!showDropdown)}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Chat options"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
        
        {showDropdown && (
          <>
            {/* Backdrop for mobile */}
            <div 
              className="fixed inset-0 bg-black/50 md:hidden z-30"
              onClick={() => setShowDropdown(false)}
            />
            
            {/* Dropdown menu */}
            <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-gray-900/95 backdrop-blur-sm border border-white/10 py-1 z-40">
              <Link
                to={`/profile/${displayParticipant.id}`}
                className="px-4 py-2 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                onClick={() => setShowDropdown(false)}
              >
                <User className="w-4 h-4" />
                View Profile
              </Link>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this conversation?')) {
                    onDeleteChat();
                  }
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2"
              >
                <Trash className="w-4 h-4" />
                Delete Conversation
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

ChatHeader.propTypes = {
  participants: PropTypes.array.isRequired,
  onToggleSidebar: PropTypes.func.isRequired,
  showSidebarToggle: PropTypes.bool.isRequired,
  onDeleteChat: PropTypes.func.isRequired
};

export default ChatHeader;

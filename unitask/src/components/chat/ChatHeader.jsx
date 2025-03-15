import PropTypes from 'prop-types';
import { MoreVertical, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Trash } from 'lucide-react';

const ChatHeader = ({ participants, onToggleSidebar, showSidebarToggle, onDeleteChat }) => {
  const displayParticipant = participants[0] || {};
  const multipleParticipants = participants.length > 1;
  const [showDropdown, setShowDropdown] = useState(false);
  
  return (
    <div className="p-4 border-b border-white/10 flex items-center gap-3">
      {showSidebarToggle && (
        <button 
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-white/5"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      
      <img 
        src={displayParticipant.avatar_url || "/api/placeholder/40/40"} 
        alt="Avatar" 
        className="w-10 h-10 rounded-full object-cover"
      />
      
      <div className="flex-1">
        <h3 className="font-medium">
          {displayParticipant.display_name || 'Unknown'}
          {multipleParticipants && <span className="text-gray-400 text-sm"> + {participants.length - 1} others</span>}
        </h3>
        <p className="text-xs text-gray-400">
          {displayParticipant.status || 'Online'}
        </p>
      </div>
      
      <div className="relative">
        <button 
          className="p-2 rounded-lg hover:bg-white/5"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <MoreVertical className="w-5 h-5" />
        </button>
        
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg border border-white/10 py-1 z-50">
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

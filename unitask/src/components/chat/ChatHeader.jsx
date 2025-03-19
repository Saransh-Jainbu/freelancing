import PropTypes from 'prop-types';
import { MoreVertical, ChevronLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Trash } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const ChatHeader = ({ participants, onToggleSidebar, showSidebarToggle, onDeleteChat, onlineUsers = [] }) => {
  const displayParticipant = participants[0] || {};
  const multipleParticipants = participants.length > 1;
  const [showDropdown, setShowDropdown] = useState(false);
  const [formattedLastActive, setFormattedLastActive] = useState('');
  
  const isOnline = onlineUsers?.includes(String(displayParticipant.id));
  
  // Format and periodically update the last active time
  useEffect(() => {
    if (!displayParticipant.last_active || isOnline) {
      setFormattedLastActive('');
      return;
    }
    
    const updateLastActive = () => {
      try {
        const lastActiveDate = new Date(displayParticipant.last_active);
        
        if (isNaN(lastActiveDate.getTime())) {
          setFormattedLastActive('');
          return;
        }
        
        const now = new Date();
        const diffMinutes = Math.round((now - lastActiveDate) / (1000 * 60));
        
        if (diffMinutes < 1) {
          setFormattedLastActive('Just now');
        } else if (diffMinutes < 60) {
          setFormattedLastActive(`${diffMinutes}m ago`);
        } else if (diffMinutes < 24 * 60) {
          setFormattedLastActive(formatDistanceToNow(lastActiveDate, { addSuffix: true }));
        } else {
          setFormattedLastActive(format(lastActiveDate, 'MMM d, h:mm a'));
        }
      } catch (err) {
        console.error('Error formatting last active time:', err);
        setFormattedLastActive('');
      }
    };
    
    // Update immediately and then every minute
    updateLastActive();
    const interval = setInterval(updateLastActive, 60000);
    
    return () => clearInterval(interval);
  }, [displayParticipant.last_active, isOnline]);
  
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
      
      <div className="relative">
        <img 
          src={displayParticipant.avatar_url || "/api/placeholder/40/40"} 
          alt="Avatar" 
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
          isOnline ? 'bg-green-500' : 'bg-gray-500'
        }`}></div>
      </div>
      
      <div className="flex-1">
        <h3 className="font-medium">
          {displayParticipant.display_name || 'Unknown'}
          {multipleParticipants && <span className="text-gray-400 text-sm"> + {participants.length - 1} others</span>}
        </h3>
        <p className="text-xs text-gray-400">
          {isOnline 
            ? 'Online now' 
            : formattedLastActive 
              ? `Last active ${formattedLastActive}` 
              : 'Offline'}
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
  onDeleteChat: PropTypes.func.isRequired,
  onlineUsers: PropTypes.array
};

export default ChatHeader;

import { useState } from 'react';
import { User, MoreVertical, ArrowLeft, Phone, Video, Info } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const ChatHeader = ({ conversation, onClose }) => {
  const [showOptions, setShowOptions] = useState(false);
  const { isMobile } = useMediaQuery();
  
  if (!conversation) return null;
  
  // Get the other participant (the one who is not the current user)
  const otherParticipant = conversation.participants?.[0] || {
    display_name: 'User',
    avatar_url: null
  };
  
  return (
    <div className="bg-gray-800 border-b border-white/10 p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {isMobile && (
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/5 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        
        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
          {otherParticipant.avatar_url ? (
            <img 
              src={otherParticipant.avatar_url} 
              alt={otherParticipant.display_name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-gray-400" />
          )}
        </div>
        
        <div>
          <h2 className="font-medium">{otherParticipant.display_name}</h2>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-xs text-gray-400 ml-1">Online</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button className="p-1.5 hover:bg-white/5 rounded-full">
          <Phone className="w-5 h-5 text-gray-400" />
        </button>
        <button className="p-1.5 hover:bg-white/5 rounded-full">
          <Video className="w-5 h-5 text-gray-400" />
        </button>
        <button className="p-1.5 hover:bg-white/5 rounded-full">
          <Info className="w-5 h-5 text-gray-400" />
        </button>
        
        <div className="relative">
          <button 
            onClick={() => setShowOptions(!showOptions)}
            className="p-1.5 hover:bg-white/5 rounded-full"
          >
            <MoreVertical className="w-5 h-5 text-gray-400" />
          </button>
          
          {showOptions && (
            <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-white/10 rounded-lg w-48 shadow-lg">
              <div className="py-1">
                <button className="w-full text-left px-4 py-2 hover:bg-white/5 text-sm">
                  View Profile
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-white/5 text-sm">
                  Search in Conversation
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-white/5 text-sm text-red-400">
                  Clear Conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Search, Plus, Menu } from 'lucide-react';
import NewChatModal from './NewChatModal';

const ChatList = ({ conversations, selectedConversation, onSelectConversation, onNewChat, currentUser, onlineUsers = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  const filteredConversations = conversations.filter(conversation => {
    const participants = conversation.participants || [];
    return participants.some(participant => 
      participant.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleOpenNewChat = () => {
    setIsNewChatModalOpen(true);
  };

  const handleNewChat = (userId) => {
    onNewChat(userId);
    setIsNewChatModalOpen(false);
  };

  // Helper function to get conversation title
  const getConversationTitle = (conversation) => {
    if (!conversation.participants) return 'Chat';
    
    // Filter out current user
    const otherParticipants = conversation.participants.filter(
      p => p.id !== currentUser.id
    );
    
    if (otherParticipants.length === 0) return 'Chat';
    
    // Return the display name of the first other participant
    return otherParticipants[0].display_name;
  };

  // Helper function to get conversation avatar
  const getParticipantAvatar = (conversation) => {
    if (!conversation.participants) return null;
    
    // Filter out current user
    const otherParticipants = conversation.participants.filter(
      p => p.id !== currentUser.id
    );
    
    if (otherParticipants.length === 0) return null;
    
    // Return the avatar of the first other participant
    return otherParticipants[0].avatar_url;
  };
  
  // Helper function to check if the other participant is online
  const isParticipantOnline = (conversation) => {
    if (!conversation?.participants || !onlineUsers || !onlineUsers.length) return false;
    
    const otherParticipant = conversation.participants.find(
      p => p.id !== currentUser.id
    );
    
    return otherParticipant && onlineUsers.includes(otherParticipant.id.toString());
  };

  return (
    <div className="flex flex-col h-full">
      <NewChatModal 
        isOpen={isNewChatModalOpen} 
        onClose={() => setIsNewChatModalOpen(false)} 
        onSelectUser={handleNewChat}
        currentUser={currentUser}
      />
      
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Messages</h2>
          <button 
            onClick={handleOpenNewChat}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            <p>No conversations found</p>
          </div>
        ) : (
          <ul>
            {filteredConversations.map(conversation => {
              const isSelected = selectedConversation && selectedConversation.id === conversation.id;
              const hasUnread = conversation.unread_count > 0;
              const avatarUrl = getParticipantAvatar(conversation);
              const isOnline = isParticipantOnline(conversation);
              
              return (
                <li key={conversation.id}>
                  <button 
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors ${
                      isSelected ? 'bg-white/10' : ''
                    }`}
                    onClick={() => onSelectConversation(conversation)}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                        {avatarUrl ? (
                          <img 
                            src={avatarUrl} 
                            alt="Avatar"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.log("List avatar image error, falling back to initial");
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center text-white font-medium">
                                  ${getConversationTitle(conversation).charAt(0).toUpperCase()}
                                </div>
                              `;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-medium">
                            {getConversationTitle(conversation).charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {/* Add online status indicator */}
                      <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-gray-900 ${
                        isOnline ? 'bg-green-500' : 'bg-gray-500'
                      }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className={`font-medium truncate ${hasUnread ? 'text-white' : 'text-gray-300'}`}>
                          {getConversationTitle(conversation)}
                        </span>
                        {hasUnread && (
                          <span className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 truncate">
                        {conversation.last_message || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

ChatList.propTypes = {
  conversations: PropTypes.array.isRequired,
  selectedConversation: PropTypes.object,
  onSelectConversation: PropTypes.func.isRequired,
  onNewChat: PropTypes.func.isRequired,
  currentUser: PropTypes.object.isRequired,
  onlineUsers: PropTypes.array,
};

export default ChatList;

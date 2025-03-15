import PropTypes from 'prop-types';
import { formatDistanceToNow } from 'date-fns';

const ConversationList = ({ 
  conversations, 
  activeConversationId, 
  currentUserId,
  onSelectConversation 
}) => {
  return (
    <div className="divide-y divide-white/5">
      {conversations.map((conversation) => {
        // Get the other participant
        const otherParticipants = conversation.participants || [];
        const displayParticipant = otherParticipants[0] || {};
        
        return (
          <div
            key={conversation.id}
            onClick={() => onSelectConversation(conversation)}
            className={`p-4 hover:bg-white/5 cursor-pointer flex items-center gap-3 ${
              conversation.id === activeConversationId ? 'bg-white/10' : ''
            }`}
          >
            {/* Avatar */}
            <div className="relative">
              <img 
                src={displayParticipant.avatar_url || "/api/placeholder/40/40"} 
                alt="Avatar" 
                className="w-12 h-12 rounded-full object-cover"
              />
              {conversation.unread_count > 0 && (
                <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {conversation.unread_count}
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between">
                <h3 className="font-medium truncate">{displayParticipant.display_name || 'Unknown'}</h3>
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-gray-400 text-sm truncate">
                {conversation.last_message || 'No messages yet'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

ConversationList.propTypes = {
  conversations: PropTypes.array.isRequired,
  activeConversationId: PropTypes.number,
  currentUserId: PropTypes.number.isRequired,
  onSelectConversation: PropTypes.func.isRequired
};

export default ConversationList;

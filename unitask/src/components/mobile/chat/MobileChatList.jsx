import { PlusCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const MobileChatList = ({ conversations, currentUser, onSelectChat, onNewChat }) => {
  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <h1 className="text-xl font-bold">Messages</h1>
        <button
          onClick={onNewChat}
          className="p-2 rounded-lg hover:bg-white/5"
        >
          <PlusCircle className="w-6 h-6" />
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.map(conversation => {
          const participant = conversation.participants?.find(p => p.id !== currentUser.id) || {};
          
          return (
            <button
              key={conversation.id}
              onClick={() => onSelectChat(conversation)}
              className="w-full p-4 flex items-center gap-4 hover:bg-white/5 border-b border-white/5"
            >
              {/* Avatar */}
              <div className="relative">
                {participant.avatar_url ? (
                  <img
                    src={participant.avatar_url}
                    alt={participant.display_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-600 flex items-center justify-center text-lg font-semibold">
                    {participant.display_name?.[0] || '?'}
                  </div>
                )}
                {conversation.unread_count > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-xs">
                    {conversation.unread_count}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-semibold truncate">
                    {participant.display_name || 'Unknown'}
                  </h3>
                  <span className="text-xs text-gray-400 ml-2">
                    {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-400 truncate">
                  {conversation.last_message || 'No messages yet'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileChatList;

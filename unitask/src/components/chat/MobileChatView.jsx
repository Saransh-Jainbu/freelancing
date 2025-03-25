import { ChevronLeft, Send } from 'lucide-react';
import PropTypes from 'prop-types';

const MobileChatView = ({ 
  activeConversation,
  messages,
  currentUser,
  onSendMessage,
  onBack,
  messageInput,
  setMessageInput,
  typingUsers,
  participants
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    onSendMessage(messageInput);
    setMessageInput('');
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Chat Header */}
      <div className="bg-gray-900 border-b border-white/10 p-4 flex items-center gap-3 sticky top-0">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-white/5"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="flex-shrink-0">
          {participants[0]?.avatar_url ? (
            <img 
              src={participants[0].avatar_url} 
              alt={participants[0].display_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-600 flex items-center justify-center">
              <span className="text-lg font-semibold">
                {participants[0]?.display_name?.charAt(0) || '?'}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">
            {participants[0]?.display_name || 'Unknown'}
          </h3>
          {typingUsers.length > 0 && (
            <p className="text-xs text-purple-400">Typing...</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((message) => {
          const isMyMessage = message.sender_id === currentUser.id;
          return (
            <div 
              key={message.id}
              className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
            >
              {/* Message content */}
              <div 
                className={`px-4 py-2 rounded-2xl max-w-[85%] ${
                  isMyMessage 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                    : 'bg-gray-800'
                }`}
              >
                <p className="break-words">{message.content}</p>
                <p className="text-xs opacity-60 mt-1">
                  {new Date(message.created_at).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="border-t border-white/10 p-4 bg-gray-900/80 backdrop-blur sticky bottom-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={!messageInput.trim()}
            className={`p-3 rounded-full ${
              messageInput.trim() 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
                : 'bg-gray-800'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

MobileChatView.propTypes = {
  activeConversation: PropTypes.object,
  messages: PropTypes.array.isRequired,
  currentUser: PropTypes.object.isRequired,
  onSendMessage: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  messageInput: PropTypes.string.isRequired,
  setMessageInput: PropTypes.func.isRequired,
  typingUsers: PropTypes.array.isRequired,
  participants: PropTypes.array.isRequired
};

export default MobileChatView;

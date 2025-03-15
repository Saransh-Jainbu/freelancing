import PropTypes from 'prop-types';
import { format } from 'date-fns';

const MessageBubble = ({ message, isOwnMessage }) => {
  const sender = message.sender || {};
  
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className="flex max-w-[80%]">
        {!isOwnMessage && (
          <img 
            src={sender.avatar_url || "/api/placeholder/32/32"} 
            alt="Avatar" 
            className="w-8 h-8 rounded-full object-cover mr-2 self-end"
          />
        )}
        
        <div>
          <div 
            className={`p-3 rounded-2xl ${
              isOwnMessage 
                ? 'bg-gradient-to-r from-purple-700 to-pink-700 text-white rounded-br-none' 
                : 'bg-white/10 rounded-bl-none'
            }`}
          >
            {message.content}
          </div>
          <div className={`text-xs text-gray-400 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
            {format(new Date(message.created_at), 'h:mm a')}
          </div>
        </div>
      </div>
    </div>
  );
};

MessageBubble.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.number.isRequired,
    content: PropTypes.string.isRequired,
    created_at: PropTypes.string.isRequired,
    sender_id: PropTypes.number.isRequired,
    sender: PropTypes.shape({
      id: PropTypes.number,
      display_name: PropTypes.string,
      avatar_url: PropTypes.string
    })
  }).isRequired,
  isOwnMessage: PropTypes.bool.isRequired
};

export default MessageBubble;

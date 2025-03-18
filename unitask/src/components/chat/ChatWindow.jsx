import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Send, Loader, MoreVertical, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { deleteConversation } from '../../api/chat';
import { useNavigate } from 'react-router-dom';

const ChatWindow = ({ conversation, messages, onSendMessage, currentUser, onDeleteConversation }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      setLoading(true);
      setError('');
      await onSendMessage(message);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteConversation = async () => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      try {
        setLoading(true);
        setError('');
        await deleteConversation(conversation.id);
        if (onDeleteConversation) {
          onDeleteConversation(conversation.id);
        }
        navigate('/chat');
      } catch (error) {
        console.error('Error deleting conversation:', error);
        setError('Failed to delete conversation. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleActionMenu = () => {
    setActionMenuOpen(!actionMenuOpen);
  };

  // Get the conversation partner (assuming 2 people in conversation)
  const getPartner = () => {
    if (!conversation?.participants) return null;
    return conversation.participants.find(p => p.id !== currentUser.id);
  };
  
  const partner = getPartner();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden mr-3">
            {partner?.avatar_url ? (
              <img 
                src={partner.avatar_url} 
                alt={partner.display_name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.log("Avatar image error, falling back to initial");
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `
                    <div class="w-full h-full flex items-center justify-center text-white font-medium">
                      ${partner.display_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  `;
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-medium">
                {partner?.display_name?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{partner?.display_name || 'Chat'}</h2>
            {conversation.gig_title && (
              <p className="text-xs text-gray-400">RE: {conversation.gig_title}</p>
            )}
          </div>
        </div>
        <div className="relative">
          <button onClick={handleToggleActionMenu} className="p-2 hover:bg-white/10 rounded-full">
            <MoreVertical className="w-5 h-5" />
          </button>
          {actionMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg z-10 py-1 border border-white/10">
              <button
                onClick={handleDeleteConversation}
                className="px-4 py-2.5 flex items-center gap-2 hover:bg-red-900/20 text-red-400 w-full text-left text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete Conversation
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>Start a conversation by sending a message.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender_id !== currentUser.id && (
                <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden mr-2 flex-shrink-0">
                  {msg.sender?.avatar_url ? (
                    <img 
                      src={msg.sender.avatar_url} 
                      alt={msg.sender.display_name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log("Message avatar image error, falling back to initial");
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `
                          <div class="w-full h-full flex items-center justify-center text-white font-medium">
                            ${msg.sender.display_name?.charAt(0).toUpperCase() || '?'}
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-medium">
                      {msg.sender?.display_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                </div>
              )}
              <div 
                className={`max-w-xs md:max-w-md p-3 rounded-lg ${
                  msg.sender_id === currentUser.id 
                    ? 'bg-purple-600 text-white rounded-br-none' 
                    : 'bg-gray-800 text-gray-300 rounded-bl-none'
                }`}
              >
                <p className="break-words">{msg.content}</p>
                <p className="text-xs opacity-70 mt-1 text-right">
                  {format(new Date(msg.created_at), 'p')}
                </p>
              </div>
            </div>
          ))
        )}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-300 p-3 rounded-lg max-w-xs rounded-bl-none">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-white/10">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
        <div className="flex items-center gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            rows="1"
            disabled={loading}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !message.trim()}
            className={`p-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-opacity flex-shrink-0 ${loading || !message.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

ChatWindow.propTypes = {
  conversation: PropTypes.object.isRequired,
  messages: PropTypes.array.isRequired,
  onSendMessage: PropTypes.func.isRequired,
  currentUser: PropTypes.object.isRequired,
  onDeleteConversation: PropTypes.func,
};

export default ChatWindow;
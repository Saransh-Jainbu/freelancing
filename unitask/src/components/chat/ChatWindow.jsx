import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Send, Loader, MoreVertical, Trash2, AlertCircle, Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import { deleteConversation, markMessagesAsRead } from '../../api/chat';
import { useNavigate } from 'react-router-dom';

const ChatWindow = ({ conversation, messages, onSendMessage, currentUser, onDeleteConversation, onlineUsers, socket }) => {
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

  // Add useEffect to mark messages as read when messages are updated
  useEffect(() => {
    // Get unread messages from other users
    const unreadMessages = messages.filter(
      msg => msg.sender_id !== currentUser.id && !msg.is_read
    );
    
    if (unreadMessages.length > 0 && socket) {
      // Mark messages as read using socket
      socket.emit('mark-messages-read', {
        conversationId: conversation.id,
        messageIds: unreadMessages.map(msg => msg.id),
        userId: currentUser.id
      });
    }
  }, [messages, conversation.id, currentUser.id, socket]);

  // Add typing status handling
  useEffect(() => {
    if (!socket || !conversation) return;
    
    // Add typing event listener
    socket.on('user-typing', (data) => {
      if (data.conversationId === conversation.id && data.userId !== currentUser.id) {
        console.log(`User ${data.userId} is typing: ${data.isTyping}`);
        setTyping(data.isTyping);
        
        // Auto-clear typing indicator after 5 seconds as a fallback
        if (data.isTyping) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          
          typingTimeoutRef.current = setTimeout(() => {
            setTyping(false);
          }, 5000);
        }
      }
    });
    
    return () => {
      socket.off('user-typing');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, conversation, currentUser.id]);

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

  // Helper function to check if user is online
  const isUserOnline = (userId) => {
    return onlineUsers?.includes(userId) || false;
  };
  
  // Get the conversation partner (assuming 2 people in conversation)
  const getPartner = () => {
    if (!conversation?.participants) return null;
    return conversation.participants.find(p => p.id !== currentUser.id);
  };
  
  const partner = getPartner();
  const isOnline = isUserOnline(partner?.id);
  
  // Add a state for formatted last seen time that updates periodically
  const [formattedLastSeen, setFormattedLastSeen] = useState('');
  
  // Update last seen time format every minute
  useEffect(() => {
    if (!partner || isOnline) return;
    
    const updateLastSeen = () => {
      if (partner?.last_active) {
        const lastActiveDate = new Date(partner.last_active);
        const now = new Date();
        const diffMinutes = Math.floor((now - lastActiveDate) / (1000 * 60));
        
        if (diffMinutes < 1) {
          setFormattedLastSeen('Just now');
        } else if (diffMinutes < 60) {
          setFormattedLastSeen(`${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`);
        } else if (diffMinutes < 24 * 60) {
          const hours = Math.floor(diffMinutes / 60);
          setFormattedLastSeen(`${hours} hour${hours === 1 ? '' : 's'} ago`);
        } else {
          setFormattedLastSeen(format(lastActiveDate, 'MMM d, h:mm a'));
        }
      }
    };
    
    // Update immediately and then every minute
    updateLastSeen();
    const interval = setInterval(updateLastSeen, 60000);
    
    return () => clearInterval(interval);
  }, [partner, isOnline]);

  // Handle input changes and emit typing status
  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    // Emit typing status
    if (socket && conversation) {
      // Only emit if this is a new typing event or after 3 seconds
      if (!typingTimeoutRef.current) {
        socket.emit('typing', {
          conversationId: conversation.id,
          userId: currentUser.id,
          isTyping: true
        });
      }
      
      // Clear any existing typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to clear typing status
      typingTimeoutRef.current = setTimeout(() => {
        if (socket) {
          socket.emit('typing', {
            conversationId: conversation.id,
            userId: currentUser.id,
            isTyping: false
          });
        }
        typingTimeoutRef.current = null;
      }, 3000);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center">
          <div className="relative">
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
            {/* Add online status indicator */}
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
              isOnline ? 'bg-green-500' : 'bg-gray-500'
            }`}></div>
          </div>
          <div>
            <h2 className="text-lg font-semibold">{partner?.display_name || 'Chat'}</h2>
            <p className="text-xs text-gray-400">
              {isOnline ? 'Online now' : formattedLastSeen ? `Last seen ${formattedLastSeen}` : 'Offline'}
              {conversation.gig_title && ` • ${conversation.gig_title}`}
            </p>
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
              
              {/* System message for gig context */}
              {msg.is_system && (
                <div className="max-w-md py-2 px-3 bg-gray-700/40 text-xs text-gray-300 rounded-lg border border-white/10 mx-auto my-2">
                  {msg.content}
                </div>
              )}
              
              {/* Regular message */}
              {!msg.is_system && (
                <div 
                  className={`max-w-xs md:max-w-md p-3 rounded-lg ${
                    msg.sender_id === currentUser.id 
                      ? 'bg-purple-600 text-white rounded-br-none' 
                      : 'bg-gray-800 text-gray-300 rounded-bl-none'
                  }`}
                >
                  <p className="break-words">{msg.content}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <p className="text-xs opacity-70">
                      {format(new Date(msg.created_at), 'p')}
                    </p>
                    
                    {/* Show read status for own messages */}
                    {msg.sender_id === currentUser.id && (
                      msg.is_read ? (
                        <CheckCheck className="w-3 h-3 text-blue-300" />
                      ) : (
                        <Check className="w-3 h-3 text-gray-400" />
                      )
                    )}
                  </div>
                </div>
              )}
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
            onChange={handleInputChange}
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
  onlineUsers: PropTypes.array,
  socket: PropTypes.object
};

export default ChatWindow;
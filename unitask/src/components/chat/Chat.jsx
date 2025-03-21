import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContextValue';
import { useNavigate, useParams } from 'react-router-dom';
import { Send, ArrowLeft, MoreVertical, Menu, Phone, Video, User, AlertCircle } from 'lucide-react';
import io from 'socket.io-client';
import { API_URL } from '../../api/constants';
import { getProfile } from '../../api/profile';

const ChatComponent = () => {
  const { conversationId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [conversation, setConversation] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const [participantAvatars, setParticipantAvatars] = useState({});
  const [loadingAvatars, setLoadingAvatars] = useState(true);

  // Connect to socket when component mounts
  useEffect(() => {
    const newSocket = io(API_URL);
    setSocket(newSocket);

    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Handle conversation joining and message fetching
  useEffect(() => {
    if (!socket || !conversationId || !currentUser?.id) return;

    setLoading(true);
    
    // Join conversation room
    socket.emit('join-conversation', conversationId);
    
    // Listen for new messages
    socket.on('new-message', (message) => {
      // When receiving a new message, ensure we have the sender's avatar
      if (message.sender_id !== currentUser.id) {
        fetchUserAvatar(message.sender_id);
      }
      setMessages(prev => [...prev, message]);
    });
    
    // Listen for typing indicators
    socket.on('user-typing', ({ userId, isTyping }) => {
      if (isTyping) {
        setTypingUsers(prev => [...prev.filter(id => id !== userId), userId]);
      } else {
        setTypingUsers(prev => prev.filter(id => id !== userId));
      }
    });

    // Fetch messages and ensure avatars are loaded for each sender
    const fetchMessages = async () => {
      try {
        const response = await fetch(`${API_URL}/api/conversations/${conversationId}/messages?userId=${currentUser.id}`);
        const data = await response.json();
        
        if (data.success) {
          setMessages(data.messages);
          
          // Create a Set of unique sender IDs to load avatars for
          const senderIds = new Set();
          data.messages.forEach(message => {
            if (message.sender_id !== currentUser.id) {
              senderIds.add(message.sender_id);
            }
          });
          
          // Load avatars for all unique senders in parallel
          const promises = Array.from(senderIds).map(fetchUserAvatar);
          await Promise.all(promises);
        } else {
          setError(data.message || 'Failed to load messages');
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    // Fetch conversation details
    const fetchConversation = async () => {
      try {
        const response = await fetch(`${API_URL}/api/conversations/${conversationId}`);
        const data = await response.json();
        
        if (data.success) {
          setConversation(data.conversation);
          const otherParticipants = data.conversation.participants?.filter(
            p => p.id !== currentUser.id
          ) || [];
          setParticipants(otherParticipants);
          
          // Pre-load avatars for participants
          for (const participant of otherParticipants) {
            fetchUserAvatar(participant.id);
          }
        } else {
          setError(data.message || 'Failed to load conversation');
        }
      } catch (err) {
        console.error('Error fetching conversation:', err);
        setError('Failed to load conversation. Please try again.');
      }
    };

    // Fetch and cache messages and conversation data
    Promise.all([fetchMessages(), fetchConversation()]);

    // Clean up event listeners
    return () => {
      socket.off('new-message');
      socket.off('user-typing');
    };
  }, [socket, conversationId, currentUser]);

  // Add a new function to fetch and cache user avatars
  const fetchUserAvatar = async (userId) => {
    // Skip if we already have this user's avatar
    if (participantAvatars[userId]) return participantAvatars[userId];
    
    try {
      // First check if this is already in participants with avatar_url
      const existingParticipant = participants.find(p => p.id === userId);
      if (existingParticipant?.avatar_url) {
        setParticipantAvatars(prev => ({
          ...prev,
          [userId]: existingParticipant.avatar_url
        }));
        return existingParticipant.avatar_url;
      }
      
      // Otherwise, fetch the complete profile
      const profileData = await getProfile(userId);
      const avatarUrl = profileData?.avatar_url || null;
      
      // Cache the fetched avatar URL
      setParticipantAvatars(prev => ({
        ...prev,
        [userId]: avatarUrl
      }));
      
      // If we're still loading avatars and we've found avatars for all participants, mark as done
      if (loadingAvatars) {
        const allParticipantsHaveAvatars = participants.every(
          p => p.id === currentUser.id || participantAvatars[p.id] !== undefined
        );
        
        if (allParticipantsHaveAvatars) {
          setLoadingAvatars(false);
        }
      }
      
      return avatarUrl;
    } catch (error) {
      console.error(`Error fetching avatar for user ${userId}:`, error);
      setParticipantAvatars(prev => ({
        ...prev,
        [userId]: null
      }));
      return null;
    }
  };

  // Modified getAvatarUrl function with better caching
  const getAvatarUrl = (sender) => {
    if (!sender) return null;
    
    if (sender.id === currentUser?.id) {
      // For current user
      return currentUser?.avatar_url || currentUser?.photoURL || null;
    } else {
      // For other participants
      
      // First check our cached avatars map - this should be the quickest way
      if (participantAvatars[sender.id] !== undefined) {
        return participantAvatars[sender.id];
      }
      
      // If not in cache, check if sender has avatar_url directly
      if (sender.avatar_url) {
        // Cache it for future use
        if (participantAvatars[sender.id] === undefined) {
          setParticipantAvatars(prev => ({
            ...prev,
            [sender.id]: sender.avatar_url
          }));
        }
        return sender.avatar_url;
      }
      
      // If we get here, we need to fetch the avatar
      // Trigger fetch in background but don't wait for it
      fetchUserAvatar(sender.id);
      
      // Return null for now
      return null;
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim() || !socket) return;
    
    // Emit message to server
    socket.emit('send-message', {
      conversationId,
      senderId: currentUser.id,
      content: input.trim()
    });
    
    // Clear input
    setInput('');
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    
    // Send typing indicator
    if (socket) {
      socket.emit('typing', {
        conversationId,
        userId: currentUser.id,
        isTyping: e.target.value.length > 0
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get avatar URL for a sender with proper fallbacks
  const getAvatarUrl = (sender) => {
    if (sender?.id === currentUser?.id) {
      // For current user
      if (currentUser?.avatar_url) return currentUser.avatar_url;
      if (currentUser?.photoURL) return currentUser.photoURL;
      return null;
    } else {
      // For other participants
      if (!sender) return null;
      
      // First try from loaded avatar in participantAvatars state
      if (participantAvatars[sender.id]) return participantAvatars[sender.id];
      
      // Then try from sender object directly
      if (sender.avatar_url) return sender.avatar_url;
    }
    return null;
  };

  // Get initials for avatar placeholder
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-gray-400">Loading conversation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Error Loading Chat</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/messages')}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg"
          >
            Back to Messages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/50 border-b border-white/10 p-4 flex items-center justify-between sticky top-16 z-10 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/messages')}
            className="p-2 rounded-full hover:bg-white/5"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            {participants[0] && (
              <div className="relative">
                {loadingAvatars ? (
                  <div className="h-10 w-10 rounded-full bg-white/10 animate-pulse"></div>
                ) : getAvatarUrl(participants[0]) ? (
                  <img 
                    src={getAvatarUrl(participants[0])} 
                    alt={participants[0].display_name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-600 flex items-center justify-center text-white font-bold">
                    {getInitials(participants[0].display_name)}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></span>
              </div>
            )}
            <div>
              <h2 className="font-medium">
                {participants[0]?.display_name || 'Chat Partner'}
              </h2>
              <p className="text-xs text-gray-400">
                {typingUsers.length > 0 ? 'Typing...' : 'Online'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-white/5">
            <Phone size={20} />
          </button>
          <button className="p-2 rounded-full hover:bg-white/5">
            <Video size={20} />
          </button>
          <button className="p-2 rounded-full hover:bg-white/5">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isMyMessage = message.sender_id === currentUser.id;
          return (
            <div 
              key={message.id} 
              className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
            >
              {!isMyMessage && (
                <div className="flex-shrink-0 mr-3"></div>
                  {loadingAvatars ? (
                    <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse"></div>
                  ) : getAvatarUrl(message.sender) ? (
                    <img 
                      src={getAvatarUrl(message.sender)} 
                      alt={message.sender?.display_name || 'User'}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-600 flex items-center justify-center text-white font-bold text-sm">
                      {getInitials(message.sender?.display_name)}
                    </div>
                  )}
                </div>
              )}
              <div 
                className={`p-3 rounded-lg max-w-xs sm:max-w-md break-words ${
                  isMyMessage 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tr-none' 
                    : 'bg-white/10 rounded-tl-none'
                }`}
              ></div>
                {message.content}
                <div className={`text-xs mt-1 ${isMyMessage ? 'text-white/70' : 'text-gray-400'}`}></div>
                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/50 border-t border-white/10 p-4 sticky bottom-0 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows="1"
            />
          </div>
          <button 
            onClick={handleSendMessage}
            disabled={!input.trim()}
            className={`p-3 rounded-lg ${
              input.trim() 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90' 
                : 'bg-white/5 cursor-not-allowed'
            } transition-colors`}
          ></button>
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;

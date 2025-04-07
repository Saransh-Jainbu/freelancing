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
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isNewConversation, setIsNewConversation] = useState(false);

  // Fetch user avatar and store it
  const fetchUserAvatar = async (userId) => {
    if (participantAvatars[userId]) return participantAvatars[userId];

    try {
      const existingParticipant = participants.find(p => p.id === userId);
      if (existingParticipant?.avatar_url) {
        setParticipantAvatars(prev => ({
          ...prev,
          [userId]: existingParticipant.avatar_url
        }));
        return existingParticipant.avatar_url;
      }

      const profileData = await getProfile(userId);
      const avatarUrl = profileData?.avatar_url || '/path/to/default-avatar.png';

      setParticipantAvatars(prev => ({
        ...prev,
        [userId]: avatarUrl
      }));

      // Trigger re-render by updating state
      setMessages((prevMessages) => [...prevMessages]);

      return avatarUrl;
    } catch (error) {
      console.error(`Error fetching avatar for user ${userId}:`, error);
      setParticipantAvatars(prev => ({
        ...prev,
        [userId]: '/path/to/default-avatar.png'
      }));

      // Trigger re-render by updating state
      setMessages((prevMessages) => [...prevMessages]);

      return '/path/to/default-avatar.png';
    }
  };

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
    if (!socket || !conversationId || !currentUser) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        // Join the conversation room in socket.io
        socket.emit('join-conversation', conversationId);
        
        // Get conversation details
        const conversationResponse = await fetch(`${API_URL}/api/conversations/${conversationId}`);
        
        if (!conversationResponse.ok) {
          // If conversation doesn't exist, redirect to chat home
          navigate('/chat');
          return;
        }
        
        const conversationData = await conversationResponse.json();
        setConversation(conversationData.conversation);
        
        // Extract participants excluding current user
        const otherParticipants = conversationData.conversation.participants?.filter(
          p => p.id !== currentUser.id
        ) || [];
        setParticipants(otherParticipants);
        
        // Check if this is a new conversation (no messages yet)
        const messagesResponse = await fetch(
          `${API_URL}/api/conversations/${conversationId}/messages?userId=${currentUser.id}`
        );
        const messagesData = await messagesResponse.json();
        
        if (messagesData.success) {
          const fetchedMessages = messagesData.messages || [];
          setMessages(fetchedMessages);
          
          // If no messages and this is first load, set isNewConversation flag
          if (fetchedMessages.length === 0 && isFirstLoad) {
            setIsNewConversation(true);
          }
        }
        
        // Fetch avatars for all participants
        for (const participant of otherParticipants) {
          if (participant.id) {
            await fetchUserAvatar(participant.id);
          }
        }
        
        setIsFirstLoad(false);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to load conversation. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [socket, conversationId, currentUser, navigate, isFirstLoad]);

  // Preload avatars for all unique senders in the messages
  useEffect(() => {
    const preloadAvatars = async () => {
      if (!conversation || !messages.length) return;

      const uniqueSenderIds = [...new Set(messages.map((msg) => msg.sender_id))];

      for (const senderId of uniqueSenderIds) {
        if (!participantAvatars[senderId]) {
          await fetchUserAvatar(senderId);
        }
      }

      setLoadingAvatars(false);
    };

    preloadAvatars();
  }, [conversation, messages]);

  // Show initial message prompt if new conversation
  useEffect(() => {
    if (isNewConversation && !loading) {
      setInput("Hi! I'm interested in discussing this project with you.");
      setIsNewConversation(false);
    }
  }, [isNewConversation, loading]);

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
    if (!sender) return '/path/to/default-avatar.png';

    if (sender.id === currentUser?.id) {
      return currentUser?.avatar_url || currentUser?.photoURL || '/path/to/default-avatar.png';
    } else {
      if (participantAvatars[sender.id] !== undefined) {
        return participantAvatars[sender.id] || '/path/to/default-avatar.png';
      }

      // Fetch avatar asynchronously and trigger re-render
      fetchUserAvatar(sender.id).then(() => {
        setMessages((prevMessages) => [...prevMessages]);
      });
      return '/path/to/default-avatar.png';
    }
  };

  // Get initials for avatar placeholder
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-gray-400">Loading conversation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-center">
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
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Messages Container - The ONLY element that should scroll */}
      <div className="flex-1 overflow-y-scroll overflow-x-hidden p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {messages.map((message) => {
          const isMyMessage = message.sender_id === currentUser.id;
          return (
            <div 
              key={message.id} 
              className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
            >
              {!isMyMessage && (
                <div className="flex-shrink-0 mr-3">
                  {getAvatarUrl(message.sender) ? (
                    <img 
                      src={getAvatarUrl(message.sender)} 
                      alt={message.sender?.display_name || 'User'}
                      className="h-8 w-8 rounded-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null; // Prevent infinite loop
                        e.target.src = '/path/to/default-avatar.png'; // Replace with default avatar path
                      }}
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
              >
                {message.content}
                <div className={`text-xs mt-1 ${isMyMessage ? 'text-white/70' : 'text-gray-400'}`}>
                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area - Fixed at bottom */}
      <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/50 border-t border-white/10 p-4 z-20 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none max-h-20"
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
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;

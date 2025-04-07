import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContextValue';
import { useNavigate, useParams } from 'react-router-dom';
import { Send } from 'lucide-react';
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
  const [participants, setParticipants] = useState([]);
  const [socket, setSocket] = useState(null);
  const [avatars, setAvatars] = useState({});
  const messagesEndRef = useRef(null);
  const prevMessagesLengthRef = useRef(0);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    const newSocket = io(API_URL);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket || !conversationId || !currentUser) return;

    const fetchConversation = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/conversations/${conversationId}`);
        if (!response.ok) {
          navigate('/chat');
          return;
        }
        const data = await response.json();
        setParticipants(data.conversation.participants);
        setMessages(data.messages);
        initialLoadRef.current = true;
        prevMessagesLengthRef.current = data.messages.length;

        const avatarPromises = data.conversation.participants.map(async (participant) => {
          if (participant.id !== currentUser.id) {
            const profile = await getProfile(participant.id);
            return { [participant.id]: profile.avatar_url || '/path/to/default-avatar.png' };
          }
          return null;
        });

        const avatarResults = await Promise.all(avatarPromises);
        const avatarMap = avatarResults.reduce((acc, avatar) => ({ ...acc, ...avatar }), {});
        setAvatars(avatarMap);
      } catch (err) {
        setError('Failed to load conversation.');
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [socket, conversationId, currentUser, navigate]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [socket]);

  // Only scroll to bottom on new messages, not on initial load
  useEffect(() => {
    // Skip scrolling on initial load of an existing conversation
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    
    // Scroll only when a new message is added
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      prevMessagesLengthRef.current = messages.length;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim() || !socket) return;

    socket.emit('send-message', {
      conversationId,
      senderId: currentUser.id,
      content: input.trim(),
    });

    setInput('');
  };

  // Scroll to bottom when sending a new message
  const handleSendAndScroll = () => {
    handleSendMessage();
    // We want to scroll immediately when the user sends a message
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100vh-180px)] scrollbar-thin scrollbar-thumb-gray-600">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
            <div className="flex max-w-[80%]">
              {message.sender_id !== currentUser.id && (
                <img
                  src={avatars[message.sender_id] || '/path/to/default-avatar.png'}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover mr-2 self-end"
                  onError={(e) => {
                    e.target.src = '/path/to/default-avatar.png';
                  }}
                />
              )}
              <div>
                <div className={`p-3 rounded-2xl ${
                  message.sender_id === currentUser.id 
                    ? 'bg-gradient-to-r from-purple-700 to-pink-700 text-white rounded-br-none' 
                    : 'bg-white/10 rounded-bl-none'
                }`}>
                  {message.content}
                </div>
                <div className={`text-xs text-gray-400 mt-1 ${message.sender_id === currentUser.id ? 'text-right' : 'text-left'}`}>
                  {new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-white/10 flex-shrink-0 bg-gray-900">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendAndScroll();
            }}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Type a message..."
          />
          <button 
            onClick={handleSendAndScroll} 
            className="p-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-opacity"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
            {message.sender_id !== currentUser.id && (
              <img
                src={avatars[message.sender_id] || '/path/to/default-avatar.png'}
                alt="Avatar"
                className="h-8 w-8 rounded-full object-cover mr-2"
                onError={(e) => {
                  e.target.src = '/path/to/default-avatar.png';
                }}
              />
            )}
            <div className="p-2 bg-gray-200 rounded-lg">
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          className="w-full p-2 border rounded"
          placeholder="Type a message..."
        />
      </div>
    </div>
  );
};

export default ChatComponent;

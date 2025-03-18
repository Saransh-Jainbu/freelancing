import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContextValue';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserConversations, getConversationMessages, searchUsers, createConversation } from '../../api/chat';
import { io } from 'socket.io-client';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import { API_URL } from '../../constants';

const ChatPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Initialize socket connection
  useEffect(() => {
    if (!currentUser) return;
    
    const socketInstance = io(API_URL);
    setSocket(socketInstance);
    
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
    });
    
    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
    });
    
    return () => {
      socketInstance.disconnect();
    };
  }, [currentUser]);
  
  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const userConversations = await getUserConversations(currentUser.id);
        setConversations(userConversations);
        
        // If conversationId is provided in URL, select that conversation
        if (conversationId) {
          const conversation = userConversations.find(c => c.id === parseInt(conversationId));
          if (conversation) {
            setSelectedConversation(conversation);
          } else {
            // If conversation doesn't exist, redirect to chat home
            navigate('/chat');
          }
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
        setError('Failed to load your conversations. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadConversations();
  }, [currentUser, conversationId, navigate]);
  
  // Load messages when conversation is selected
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentUser || !selectedConversation) return;
      
      try {
        const conversationMessages = await getConversationMessages(
          selectedConversation.id,
          currentUser.id
        );
        
        setMessages(conversationMessages);
        
        // Join socket room for this conversation
        if (socket) {
          socket.emit('join-conversation', selectedConversation.id);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
        setError('Failed to load messages. Please try again.');
      }
    };
    
    loadMessages();
  }, [currentUser, selectedConversation, socket]);
  
  // Listen for new messages
  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (message) => {
      setMessages(prevMessages => [...prevMessages, message]);
      
      // Update conversation's last message
      setConversations(prevConversations => {
        return prevConversations.map(conv => {
          if (conv.id === message.conversation_id) {
            return {
              ...conv,
              last_message: message.content,
              unread_count: message.sender_id !== currentUser.id ? (conv.unread_count + 1) : conv.unread_count
            };
          }
          return conv;
        });
      });
    };
    
    socket.on('new-message', handleNewMessage);
    
    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [socket, currentUser]);
  
  // Handle new message submission
  const handleSendMessage = (content) => {
    if (!socket || !selectedConversation || !content.trim()) return;
    
    socket.emit('send-message', {
      conversationId: selectedConversation.id,
      senderId: currentUser.id,
      content: content.trim()
    });
  };

  // Handle user search
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearchLoading(true);
      
      // CRITICAL FIX: Explicitly use the fixed API endpoint with /api prefix
      const apiUrl = `${API_URL}/api/users/search?q=${encodeURIComponent(query || '')}&currentUserId=${currentUser.id}`;
      console.log('[ChatPage] Searching users at URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ChatPage] Search failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setSearchResults(data.users || []);
    } catch (err) {
      console.error('[ChatPage] Search error:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle starting a new conversation
  const handleStartConversation = async (userId) => {
    try {
      const conversation = await createConversation([currentUser.id, userId]);
      
      // Add the new conversation to list
      setConversations(prev => [conversation, ...prev]);
      
      // Select the new conversation
      setSelectedConversation(conversation);
      
      // Close modal
      setIsNewChatModalOpen(false);
    } catch (err) {
      console.error('Failed to start conversation:', err);
      setError('Failed to start a new conversation. Please try again.');
    }
  };

  return (
    <div className="chat-page">
      <ChatList
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={setSelectedConversation}
        onNewChat={() => setIsNewChatModalOpen(true)}
      />
      <ChatWindow
        conversation={selectedConversation}
        messages={messages}
        onSendMessage={handleSendMessage}
      />
      {isNewChatModalOpen && (
        <div className="new-chat-modal">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {searchLoading ? (
            <p>Loading...</p>
          ) : (
            <ul>
              {searchResults.map(user => (
                <li key={user.id} onClick={() => handleStartConversation(user.id)}>
                  {user.name}
                </li>
              ))}
            </ul>
          )}
          <button onClick={() => setIsNewChatModalOpen(false)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default ChatPage;

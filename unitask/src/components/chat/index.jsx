import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Send, Loader, PlusCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContextValue';
import { getUserConversations, getConversationMessages, createConversation, deleteConversation } from '../../api/chat';
import API_URL from '../../api/config';
import { 
  initializeSocket, 
  joinConversation, 
  sendMessage, 
  setTypingStatus, 
  onNewMessage, 
  onUserTyping 
} from '../../services/socket';
import ConversationList from './ConversationList';
import MessageBubble from './MessageBubble';
import ChatHeader from './ChatHeader';
import NewChatModal from './NewChatModal';

const ChatPage = () => {
  const { currentUser } = useAuth();
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const [showSidebar, setShowSidebar] = useState(true);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [users, setUsers] = useState([]); // This would be fetched from an API
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef({});

  // Convert fetchUsers to useCallback to avoid dependency issues
  const fetchUsers = useCallback(async (searchQuery = '') => {
    try {
      const response = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(searchQuery)}&currentUserId=${currentUser.id}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }
      
      return data.users;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }, [currentUser.id]);

  // Initialize socket
  useEffect(() => {
    initializeSocket();
    
    // Cleanup function
    return () => {
      // Clean up any typing indicators when unmounting
      if (activeConversation) {
        setTypingStatus(activeConversation.id, currentUser.id, false);
      }
    };
  }, [activeConversation, currentUser.id]);

  // Load users when new chat modal opens
  useEffect(() => {
    if (isNewChatModalOpen) {
      fetchUsers().then(setUsers);
    }
  }, [isNewChatModalOpen, fetchUsers]);

  // Handle new conversation creation
  const handleCreateConversation = async (participantIds) => {
    try {
      // Check for existing conversations
      const existingChat = conversations.find(conv => {
        const otherParticipant = conv.participants[0];
        return participantIds.includes(otherParticipant.id);
      });

      if (existingChat) {
        navigate(`/chat/${existingChat.id}`);
        setIsNewChatModalOpen(false);
        return;
      }

      // If no existing chat, create new one
      const newConversation = await createConversation([currentUser.id, ...participantIds]);
      setConversations(prev => [newConversation, ...prev]);
      navigate(`/chat/${newConversation.id}`);
      setIsNewChatModalOpen(false);
    } catch (err) {
      console.error('Failed to create conversation:', err);
      throw err;
    }
  };

  // Fetch user's conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const data = await getUserConversations(currentUser.id);
        setConversations(data);
        setError('');
        
        // If there's a conversation ID in the URL, set it as active
        if (conversationId) {
          const conversation = data.find(c => c.id === parseInt(conversationId));
          if (conversation) {
            setActiveConversation(conversation);
          } else if (data.length > 0) {
            // Redirect to the first conversation if invalid ID
            navigate(`/chat/${data[0].id}`);
          }
        } else if (data.length > 0) {
          // If no ID in URL, navigate to first conversation
          navigate(`/chat/${data[0].id}`);
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
        setError('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };
    
    fetchConversations();
  }, [currentUser, navigate, conversationId]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConversation || !currentUser) return;
      
      try {
        setLoading(true);
        const data = await getConversationMessages(activeConversation.id, currentUser.id);
        setMessages(data);
        setError('');
        
        // Join the socket room for this conversation
        joinConversation(activeConversation.id);
      } catch (err) {
        console.error('Failed to load messages:', err);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, [activeConversation, currentUser]);

  // Listen for new messages
  useEffect(() => {
    const cleanupMessageListener = onNewMessage((newMessage) => {
      setMessages(prev => [...prev, newMessage]);
      
      // Update conversation with new last message
      setConversations(prev => {
        return prev.map(conv => {
          if (conv.id === newMessage.conversation_id) {
            return {
              ...conv,
              last_message: newMessage.content,
              updated_at: newMessage.created_at,
              unread_count: newMessage.sender_id === currentUser.id ? 
                conv.unread_count : conv.unread_count + 1
            };
          }
          return conv;
        });
      });
    });
    
    // Listen for typing indicators
    const cleanupTypingListener = onUserTyping(({ userId, isTyping }) => {
      setTypingUsers(prev => ({
        ...prev,
        [userId]: isTyping
      }));
    });
    
    return () => {
      cleanupMessageListener();
      cleanupTypingListener();
    };
  }, [currentUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConversation) return;
    
    sendMessage(activeConversation.id, currentUser.id, messageInput);
    setMessageInput('');
    
    // Clear typing indicator
    setTypingStatus(activeConversation.id, currentUser.id, false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessageInput(value);
    
    // Set typing indicator
    if (activeConversation) {
      setTypingStatus(activeConversation.id, currentUser.id, value.length > 0);
      
      // Clear typing indicator after 2 seconds of inactivity
      clearTimeout(typingTimeoutRef.current[activeConversation.id]);
      typingTimeoutRef.current[activeConversation.id] = setTimeout(() => {
        setTypingStatus(activeConversation.id, currentUser.id, false);
      }, 2000);
    }
  };

  const getActiveParticipants = () => {
    if (!activeConversation || !activeConversation.participants) return [];
    return activeConversation.participants.filter(p => p.id !== currentUser?.id);
  };

  const isParticipantTyping = () => {
    const participants = getActiveParticipants();
    return participants.some(p => typingUsers[p.id]);
  };

  const handleDeleteChat = async () => {
    if (!activeConversation) return;
    
    try {
      await deleteConversation(activeConversation.id);
      setConversations(prev => prev.filter(c => c.id !== activeConversation.id));
      navigate('/chat');
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      alert('Failed to delete conversation. Please try again.');
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-semibold mb-4">Login Required</h2>
          <p className="text-gray-400 mb-6">Please login to access your messages</p>
          <button 
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onCreateConversation={handleCreateConversation}
        users={users}
      />
    
      <div className="flex-1 flex">
        {/* Conversations sidebar */}
        <div 
          className={`border-r border-white/10 bg-gray-900 ${
            showSidebar ? 'w-80' : 'w-0'
          } transition-all duration-300 overflow-hidden flex flex-col`}
        >
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Messages</h2>
            <button 
              onClick={() => setIsNewChatModalOpen(true)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="New Conversation"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-auto">
            {conversations.length > 0 ? (
              <ConversationList
                conversations={conversations}
                activeConversationId={activeConversation?.id}
                currentUserId={currentUser.id}
                onSelectConversation={(conv) => navigate(`/chat/${conv.id}`)}
              />
            ) : (
              <div className="p-4 text-center text-gray-400">
                {loading ? 'Loading conversations...' : 'No conversations yet'}
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col bg-black">
          {error && (
            <div className="bg-red-500/10 text-red-500 p-4 text-center">
              {error}
            </div>
          )}
          {activeConversation ? (
            <>
              <ChatHeader
                participants={getActiveParticipants()}
                onToggleSidebar={() => setShowSidebar(prev => !prev)}
                showSidebarToggle={!showSidebar}
                onDeleteChat={handleDeleteChat}
              />
              
              {/* Messages */}
              <div className="flex-1 p-4 overflow-auto">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader className="w-8 h-8 text-purple-500 animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          isOwnMessage={message.sender_id === currentUser.id}
                        />
                      ))}
                      {isParticipantTyping() && (
                        <div className="flex items-center text-gray-400 text-sm pl-12">
                          <div className="flex gap-1">
                            <span className="animate-bounce">.</span>
                            <span className="animate-bounce delay-75">.</span>
                            <span className="animate-bounce delay-150">.</span>
                          </div>
                          <span className="ml-2">Typing</span>
                        </div>
                      )}
                    </div>
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
              
              {/* Message input */}
              <div className="p-4 border-t border-white/10">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={handleInputChange}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className={`p-2 rounded-lg ${
                      messageInput.trim() 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90' 
                        : 'bg-white/10 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">No Conversation Selected</h3>
                <p className="text-gray-400">
                  {conversations.length > 0 
                    ? 'Select a conversation from the sidebar' 
                    : 'Start by creating a new conversation'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

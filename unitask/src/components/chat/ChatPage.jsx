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
  const [notificationPermission, setNotificationPermission] = useState(null);
  
  // Request notification permission
  useEffect(() => {
    // Check if notifications are supported by the browser
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notifications");
      return;
    }

    // Check if permission is already granted
    if (Notification.permission === "granted") {
      setNotificationPermission("granted");
    } else if (Notification.permission !== "denied") {
      // Request permission
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    } else {
      setNotificationPermission(Notification.permission);
    }
  }, []);

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
  
  // Show notification for new messages
  const showNotification = (message, sender) => {
    // Only show notifications if permission is granted and conversation is not selected
    if (notificationPermission === "granted" && 
        (!selectedConversation || selectedConversation.id !== message.conversation_id) &&
        message.sender_id !== currentUser.id) {
      try {
        // Find the sender's info from conversations
        const conversation = conversations.find(c => c.id === message.conversation_id);
        const senderName = sender?.display_name || "Someone";
        
        const notification = new Notification("New message from UniTask", {
          body: `${senderName}: ${message.content}`,
          icon: "/favicon.ico"
        });
        
        // When notification is clicked, navigate to the conversation
        notification.onclick = () => {
          window.focus();
          navigate(`/chat/${message.conversation_id}`);
          notification.close();
        };
        
        // Auto close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);
      } catch (error) {
        console.error("Error showing notification:", error);
      }
    }
  };
  
  // Listen for new messages
  useEffect(() => {
    if (!socket || !currentUser) return;
    
    const handleNewMessage = (message) => {
      setMessages(prevMessages => [...prevMessages, message]);
      
      // Update conversation's last message
      setConversations(prevConversations => {
        return prevConversations.map(conv => {
          if (conv.id === message.conversation_id) {
            // Show notification for new message
            showNotification(message, message.sender);
            
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
  }, [socket, currentUser, conversations, selectedConversation, notificationPermission, navigate]);
  
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

  // Request notification permission again if denied
  const requestNotificationPermission = () => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {notificationPermission === "denied" && (
          <div className="mb-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 flex justify-between items-center">
            <p className="text-yellow-200">
              Enable notifications to get alerts when new messages arrive.
            </p>
            <button 
              onClick={requestNotificationPermission}
              className="px-3 py-1 bg-yellow-500/30 rounded-md hover:bg-yellow-500/40 transition-colors"
            >
              Enable
            </button>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-10rem)]">
          <div className="lg:col-span-1 bg-gray-900/50 rounded-xl border border-white/10 overflow-hidden">
            <ChatList
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelectConversation={setSelectedConversation}
              onNewChat={() => setIsNewChatModalOpen(true)}
              currentUser={currentUser}
            />
          </div>
          
          <div className="lg:col-span-3 bg-gray-900/50 rounded-xl border border-white/10 overflow-hidden">
            {selectedConversation ? (
              <ChatWindow
                conversation={selectedConversation}
                messages={messages}
                onSendMessage={handleSendMessage}
                currentUser={currentUser}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Select a conversation or start a new one
              </div>
            )}
          </div>
        </div>
        
        {/* New chat modal implementation here */}
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
    </div>
  );
};

export default ChatPage;

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContextValue';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserConversations, getConversationMessages, createConversation } from '../../api/chat';
import { io } from 'socket.io-client';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import { API_URL } from '../../constants';
import NewChatModal from './NewChatModal';
import { AlertCircle, Loader } from 'lucide-react';
import { showChatNotification, getNotificationPermission, requestNotificationPermission } from '../../services/notificationService';

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
  const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission());
  const [onlineUsers, setOnlineUsers] = useState([]);
  
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
      requestNotificationPermission().then(granted => {
        setNotificationPermission(granted ? "granted" : "denied");
      });
    } else {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Fix socket initialization with more robust connection handling
  useEffect(() => {
    if (!currentUser) return;
    
    console.log('[Chat] Initializing socket connection...');
    
    // Create socket with explicit connect and reconnection options
    const socketOptions = {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      forceNew: true, // Force a new connection every time
      transports: ['websocket', 'polling'] // Try WebSocket first, fallback to polling
    };
    
    const socketInstance = io(API_URL, socketOptions);
    setSocket(socketInstance);
    
    // Debug socket connection events
    socketInstance.on('connect', () => {
      console.log('[Chat] Socket connected successfully:', socketInstance.id);
      socketInstance.emit('user-online', currentUser.id);
    });
    
    socketInstance.on('connect_error', (error) => {
      console.error('[Chat] Socket connection error:', error);
    });
    
    socketInstance.on('reconnect', (attemptNumber) => {
      console.log(`[Chat] Socket reconnected after ${attemptNumber} attempts`);
      // Rejoin conversation room if applicable
      if (selectedConversation) {
        console.log(`[Chat] Rejoining conversation ${selectedConversation.id} after reconnection`);
        socketInstance.emit('join-conversation', {
          conversationId: selectedConversation.id,
          userId: currentUser.id
        });
      }
    });
    
    socketInstance.on('disconnect', (reason) => {
      console.log('[Chat] Socket disconnected, reason:', reason);
    });
    
    // Cleanup function to disconnect socket when component unmounts
    return () => {
      console.log('[Chat] Cleaning up socket connection');
      socketInstance.disconnect();
    };
  }, [currentUser]); // Only recreate socket when user changes
  
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
        setError(null);
      } catch (err) {
        console.error('[Chat] Failed to load conversations:', err);
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
        setLoading(true);
        const conversationMessages = await getConversationMessages(
          selectedConversation.id,
          currentUser.id
        );
        
        setMessages(conversationMessages);
        
        // Join socket room for this conversation with userId for read receipts
        if (socket) {
          socket.emit('join-conversation', {
            conversationId: selectedConversation.id,
            userId: currentUser.id
          });
        }
        setError(null);
      } catch (err) {
        console.error('[Chat] Failed to load messages:', err);
        setError('Failed to load messages. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadMessages();
  }, [currentUser, selectedConversation, socket]);
  
  // Enhanced message handling with better logging
  useEffect(() => {
    if (!socket || !currentUser) return;
    
    console.log('[Chat] Setting up new-message event listener');
    
    const handleNewMessage = (message) => {
      console.log('[Chat] Received new-message event with data:', message);
      
      // Test if message is valid
      if (!message || !message.conversation_id) {
        console.error('[Chat] Invalid message received:', message);
        return;
      }
      
      // Add message to current messages if for selected conversation
      if (selectedConversation && selectedConversation.id === message.conversation_id) {
        console.log('[Chat] Adding message to current conversation');
        
        // Update with function form to ensure we're using latest state
        setMessages(prevMessages => {
          // Check if message already exists in the list
          const messageExists = prevMessages.some(msg => msg.id === message.id);
          if (messageExists) {
            console.log('[Chat] Message already exists in state, not adding duplicate');
            return prevMessages;
          }
          
          const updatedMessages = [...prevMessages, message];
          console.log('[Chat] Updated messages array length:', updatedMessages.length);
          return updatedMessages;
        });
        
        // Force scroll to bottom
        setTimeout(() => {
          const messagesEnd = document.getElementById('messages-end-ref');
          messagesEnd?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        console.log('[Chat] Message is for a different conversation than the selected one');
      }
      
      // Always update conversations list with latest message info
      setConversations(prevConversations => {
        // Check if conversation exists in the list
        const conversationExists = prevConversations.some(conv => conv.id === message.conversation_id);
        
        if (!conversationExists) {
          console.log('[Chat] Conversation not in list, fetching fresh conversations');
          // If conversation doesn't exist, fetch updated list
          getUserConversations(currentUser.id)
            .then(updatedConversations => {
              setConversations(updatedConversations);
            })
            .catch(error => {
              console.error('[Chat] Error fetching updated conversations:', error);
            });
          return prevConversations;
        }
        
        // Update existing conversation
        const updatedConversations = prevConversations.map(conv => {
          if (conv.id === message.conversation_id) {
            // Handle notifications if needed
            if (message.sender_id !== currentUser.id) {
              // Show notification if this isn't the current conversation or window isn't focused
              if (!selectedConversation || selectedConversation.id !== message.conversation_id || !document.hasFocus()) {
                // Ensure sender info exists
                if (!message.sender) {
                  message.sender = { display_name: 'Someone', id: message.sender_id };
                }
                
                // Show notification
                showChatNotification(message.content, message.sender, message.conversation_id);
              }
            }
            
            // Return updated conversation
            return {
              ...conv,
              last_message: message.content,
              updated_at: new Date().toISOString(),
              unread_count: message.sender_id !== currentUser.id && 
                          (!selectedConversation || selectedConversation.id !== message.conversation_id)
                          ? (conv.unread_count || 0) + 1 
                          : conv.unread_count || 0
            };
          }
          return conv;
        });
        
        // Sort by most recent update
        return updatedConversations.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      });
    };
    
    // Register event handler
    socket.on('new-message', handleNewMessage);
    
    return () => {
      console.log('[Chat] Removing new-message event listener');
      socket.off('new-message', handleNewMessage);
    };
  }, [socket, currentUser, selectedConversation]);
  
  // Update user's online status and track other online users
  useEffect(() => {
    if (!socket || !currentUser) return;
    
    // Setup ping interval to maintain online status
    const pingInterval = setInterval(() => {
      socket.emit('ping', currentUser.id);
    }, 30000); // Every 30 seconds
    
    // Listen for online users updates
    socket.on('online-users', (users) => {
      console.log('[Chat] Online users update:', users);
      setOnlineUsers(users);
    });
    
    // Handle message read receipts
    socket.on('message-read', ({ messageIds, conversationId }) => {
      console.log('[Chat] Message read event:', { messageIds, conversationId });
      setMessages(prevMessages => {
        return prevMessages.map(msg => {
          if (messageIds.includes(msg.id)) {
            return { ...msg, is_read: true };
          }
          return msg;
        });
      });
    });
    
    return () => {
      clearInterval(pingInterval);
      socket.off('online-users');
      socket.off('message-read');
    };
  }, [socket, currentUser]);
  
  // Handle conversation selection
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    navigate(`/chat/${conversation.id}`);
    
    // Join the conversation room with user ID for read receipts
    if (socket) {
      socket.emit('join-conversation', {
        conversationId: conversation.id,
        userId: currentUser.id
      });
    }
    
    // Reset unread count on selection
    setConversations(prevConversations => {
      return prevConversations.map(conv => {
        if (conv.id === conversation.id && conv.unread_count > 0) {
          return { ...conv, unread_count: 0 };
        }
        return conv;
      });
    });
  };
  
  // Handle sending a message with better error handling
  const handleSendMessage = (content) => {
    if (!socket || !selectedConversation || !content.trim()) {
      console.error('[Chat] Cannot send message - missing socket, conversation, or content');
      return;
    }
    
    console.log(`[Chat] Sending message to conversation ${selectedConversation.id}`);
    const payload = {
      conversationId: selectedConversation.id,
      senderId: currentUser.id,
      content: content.trim()
    };
    
    socket.emit('send-message', payload, (acknowledgement) => {
      if (acknowledgement && acknowledgement.error) {
        console.error('[Chat] Error sending message (from server):', acknowledgement.error);
      } else if (acknowledgement && acknowledgement.success) {
        console.log('[Chat] Message sent successfully (server acknowledged)');
      }
    });
  };

  // Handle starting a new conversation
  const handleNewChat = async (userId) => {
    try {
      const conversation = await createConversation([currentUser.id, userId]);
      
      // Add the new conversation to list at the top
      setConversations(prev => [conversation, ...prev]);
      
      // Select the new conversation
      setSelectedConversation(conversation);
      
      // Navigate to new conversation
      navigate(`/chat/${conversation.id}`);
      
      // Close modal
      setIsNewChatModalOpen(false);
    } catch (err) {
      console.error('[Chat] Failed to start conversation:', err);
      setError('Failed to start a new conversation. Please try again.');
    }
  };

  // Handle conversation deletion
  const handleDeleteConversation = (conversationId) => {
    setConversations(prevConversations => 
      prevConversations.filter(conv => conv.id !== conversationId)
    );
    
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(null);
      setMessages([]);
    }
  };

  // Request notification permission again if denied
  const handleRequestNotificationPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(granted ? "granted" : "denied");
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <Loader className="w-10 h-10 text-purple-500 animate-spin mb-4" />
        <p className="text-gray-400">Loading your conversations...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {notificationPermission === "denied" && (
          <div className="mb-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 flex justify-between items-center">
            <p className="text-yellow-200">
              Enable notifications to get alerts when new messages arrive.
            </p>
            <button 
              onClick={handleRequestNotificationPermission}
              className="px-3 py-1 bg-yellow-500/30 rounded-md hover:bg-yellow-500/40 transition-colors"
            >
              Enable
            </button>
          </div>
        )}
        
        {error && (
          <div className="mb-4 bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-300" />
            <p className="text-red-300">{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-10rem)]">
          <div className="lg:col-span-1 bg-gray-900/50 rounded-xl border border-white/10 overflow-hidden">
            <ChatList
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
              onNewChat={() => setIsNewChatModalOpen(true)}
              currentUser={currentUser}
              onlineUsers={onlineUsers}
            />
          </div>
          
          <div className="lg:col-span-3 bg-gray-900/50 rounded-xl border border-white/10 overflow-hidden">
            {selectedConversation ? (
              <ChatWindow
                conversation={selectedConversation}
                messages={messages}
                onSendMessage={handleSendMessage}
                currentUser={currentUser}
                onDeleteConversation={handleDeleteConversation}
                onlineUsers={onlineUsers}
                socket={socket}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Select a conversation or start a new one
              </div>
            )}
            <div ref={messagesEndRef} id="messages-end-ref" />
          </div>
        </div>
        
        {/* New chat modal */}
        <NewChatModal 
          isOpen={isNewChatModalOpen} 
          onClose={() => setIsNewChatModalOpen(false)} 
          onSelectUser={handleNewChat}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
};

export default ChatPage;

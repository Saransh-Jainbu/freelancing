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

  // Initialize socket connection
  useEffect(() => {
    if (!currentUser) return;
    
    // Create socket with explicit connect (helps with reconnection issues)
    const socketInstance = io(API_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      forceNew: true
    });
    
    setSocket(socketInstance);
    
    // Debug socket connection issues
    socketInstance.on('connect', () => {
      console.log('[Chat] Socket connected:', socketInstance.id);
      socketInstance.emit('user-online', currentUser.id);
    });
    
    socketInstance.on('connect_error', (error) => {
      console.error('[Chat] Socket connection error:', error);
    });
    
    socketInstance.on('disconnect', (reason) => {
      console.log('[Chat] Socket disconnected:', reason);
      // Socket.io will automatically try to reconnect
    });
    
    return () => {
      console.log('[Chat] Cleaning up socket connection');
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
  
  // Listen for new messages with improved error handling
  useEffect(() => {
    if (!socket || !currentUser) return;
    
    const handleNewMessage = (message) => {
      console.log('[Chat] Received new message:', message);
      
      try {
        // Add message to current messages if for selected conversation
        if (selectedConversation && selectedConversation.id === message.conversation_id) {
          setMessages(prevMessages => [...prevMessages, message]);
          
          // Force scroll to bottom when a new message comes in
          setTimeout(() => {
            const messagesEnd = document.getElementById('messages-end-ref');
            messagesEnd?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
        
        // Always show notification for messages from others, regardless of the current view
        if (message.sender_id !== currentUser.id) {
          console.log('[Chat] Showing notification for incoming message');
          
          // Ensure sender object has display_name
          if (!message.sender) {
            message.sender = {
              display_name: 'Someone',
              id: message.sender_id
            };
          }
          
          // Send a native notification for all incoming messages
          showChatNotification(
            message.content,
            message.sender,
            message.conversation_id
          );
          
          // Also play a sound to alert the user
          playNotificationSound();
        }
        
        // Update conversations list with new message
        setConversations(prevConversations => {
          const updatedConversations = prevConversations.map(conv => {
            if (conv.id === message.conversation_id) {
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
          return updatedConversations.sort((a, b) => 
            new Date(b.updated_at) - new Date(a.updated_at)
          );
        });
      } catch (err) {
        console.error('[Chat] Error handling new message:', err);
      }
    };
    
    // Register event handler and ensure cleanup
    socket.on('new-message', handleNewMessage);
    
    // Add handler for socket reconnection
    socket.on('reconnect', () => {
      console.log('[Chat] Socket reconnected, rejoining rooms');
      // Rejoin conversation room if needed
      if (selectedConversation) {
        socket.emit('join-conversation', {
          conversationId: selectedConversation.id,
          userId: currentUser.id
        });
      }
    });
    
    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('reconnect');
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
  
  // Handle sending a message
  const handleSendMessage = (content) => {
    if (!socket || !selectedConversation || !content.trim()) return;
    
    socket.emit('send-message', {
      conversationId: selectedConversation.id,
      senderId: currentUser.id,
      content: content.trim()
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

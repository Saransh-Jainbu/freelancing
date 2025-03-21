import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContextValue';
import { useNavigate, useParams } from 'react-router-dom';
import { PlusCircle, Search, X, Loader, User } from 'lucide-react';
import { getUserConversations, createConversation } from '../../api/chat';
import { io } from 'socket.io-client';
import ConversationList from './ConversationList';
import ChatHeader from './ChatHeader';
import ChatComponent from './Chat';
import { API_URL } from '../../api/constants';

const ChatPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  
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
            setActiveConversation(conversation);
          } else if (userConversations.length > 0) {
            // Navigate to first conversation if the ID doesn't exist
            navigate(`/chat/${userConversations[0].id}`);
          }
        } else if (userConversations.length > 0) {
          // Navigate to first conversation if no ID is provided
          navigate(`/chat/${userConversations[0].id}`);
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
  
  // Handle user search
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearchLoading(true);
      
      const apiUrl = `${API_URL}/api/users/search?q=${encodeURIComponent(query || '')}&currentUserId=${currentUser.id}`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setSearchResults(data.users || []);
    } catch (err) {
      console.error('Search error:', err);
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
      
      // Navigate to the new conversation
      navigate(`/chat/${conversation.id}`);
      
      // Close modal
      setIsNewChatModalOpen(false);
    } catch (err) {
      console.error('Failed to start conversation:', err);
      setError('Failed to start a new conversation. Please try again.');
    }
  };

  // Delete a conversation
  const handleDeleteChat = async () => {
    if (!activeConversation) return;
    
    try {
      await fetch(`${API_URL}/api/conversations/${activeConversation.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUser.id })
      });
      
      // Remove from state
      setConversations(prev => prev.filter(c => c.id !== activeConversation.id));
      
      // Navigate to another conversation or the chat home
      if (conversations.length > 1) {
        const nextConversation = conversations.find(c => c.id !== activeConversation.id);
        navigate(`/chat/${nextConversation.id}`);
      } else {
        navigate('/chat');
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      alert('Failed to delete conversation. Please try again.');
    }
  };
  
  // Get participants for header
  const getActiveParticipants = () => {
    if (!activeConversation || !activeConversation.participants) return [];
    return activeConversation.participants.filter(p => p.id !== currentUser?.id);
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
    // Adjust top position to accommodate for navbar
    <div className="fixed inset-x-0 bottom-0 top-16 bg-black text-white overflow-hidden">
      {/* New Chat Modal */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNewChatModalOpen(false)}></div>
          
          <div className="relative bg-gray-900 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 p-4 border-b border-white/10 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold">New Conversation</h2>
              <button 
                onClick={() => setIsNewChatModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Search Input */}
              <div className="relative mb-4">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full px-10 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                />
              </div>
              
              {/* User List */}
              <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                {searchLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader className="w-8 h-8 text-purple-500 animate-spin" />
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(user => (
                    <div 
                      key={user.id}
                      onClick={() => handleStartConversation(user.id)}
                      className="p-3 flex items-center gap-3 rounded-lg cursor-pointer hover:bg-white/5"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                        {user.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            alt={user.display_name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl font-medium">
                            {user.display_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{user.display_name}</h4>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                  ))
                ) : searchQuery.length > 1 ? (
                  <div className="flex flex-col items-center py-10 text-gray-400">
                    <User className="w-12 h-12 mb-2 opacity-50" />
                    <p>No users found</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-10 text-gray-400">
                    <p>Type at least 2 characters to search</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    
      <div className="h-full flex overflow-hidden">
        {/* Conversations sidebar */}
        <div 
          className={`border-r border-white/10 bg-gray-900 ${
            showSidebar ? 'w-80' : 'w-0'
          } transition-all duration-300 overflow-hidden flex flex-col h-full`}
        >
          {/* Sidebar Header - Fixed */}
          <div className="p-4 border-b border-white/10 flex justify-between items-center flex-shrink-0">
            <h2 className="text-xl font-semibold">Messages</h2>
            <button 
              onClick={() => setIsNewChatModalOpen(true)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="New Conversation"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
          </div>
          
          {/* Conversation List - This should scroll */}
          <div className="flex-1 overflow-y-scroll overflow-x-hidden">
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

        {/* Chat area - Fixed container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {error && (
            <div className="bg-red-500/10 text-red-500 p-4 text-center flex-shrink-0">
              {error}
            </div>
          )}
          {activeConversation ? (
            <div className="h-full flex flex-col overflow-hidden">
              {/* Chat Header */}
              <div className="flex-shrink-0">
                <ChatHeader
                  participants={getActiveParticipants()}
                  onToggleSidebar={() => setShowSidebar(prev => !prev)}
                  showSidebarToggle={!showSidebar}
                  onDeleteChat={handleDeleteChat}
                />
              </div>
              
              {/* Chat Component Container */}
              <div className="flex-1 overflow-hidden relative">
                <ChatComponent />
              </div>
            </div>
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

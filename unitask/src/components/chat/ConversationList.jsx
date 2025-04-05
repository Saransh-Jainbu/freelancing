import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../../api/constants';
import { useAuth } from '../../context/AuthContextValue';
import { formatDistanceToNow } from 'date-fns';
import { User, Search, Edit, AlertTriangle } from 'lucide-react';

const ConversationList = ({ onSelect }) => {
  const { currentUser } = useAuth();
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/conversations?userId=${currentUser.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch conversations');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setConversations(data.conversations || []);
        } else {
          throw new Error(data.message || 'Failed to load conversations');
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setError('Error loading conversations. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser]);
  
  useEffect(() => {
    // If a conversationId exists in URL and we have conversations loaded,
    // select that conversation
    if (conversationId && conversations.length > 0) {
      const selectedConversation = conversations.find(
        (conv) => conv.id === parseInt(conversationId)
      );
      
      if (selectedConversation) {
        onSelect(selectedConversation);
      }
    }
  }, [conversationId, conversations, onSelect]);
  
  const handleConversationClick = (conversation) => {
    navigate(`/chat/${conversation.id}`);
    onSelect(conversation);
  };
  
  const filteredConversations = searchTerm
    ? conversations.filter(conv => 
        conv.participants[0].display_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : conversations;
  
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-4 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-white/10 p-4">
        <h2 className="text-xl font-bold mb-4">Messages</h2>
        
        <div className="relative mb-2">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          <div className="divide-y divide-white/5">
            {filteredConversations.map((conversation) => {
              const otherParticipant = conversation.participants[0] || {};
              const isActive = parseInt(conversationId) === conversation.id;
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationClick(conversation)}
                  className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-800 ${
                    isActive ? 'bg-gray-800' : ''
                  }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                      {otherParticipant.avatar_url ? (
                        <img
                          src={otherParticipant.avatar_url}
                          alt={otherParticipant.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-gray-900 ${
                      conversation.online ? 'bg-green-500' : 'bg-gray-500'
                    }`}></div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-medium truncate">
                        {otherParticipant.display_name}
                      </h3>
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(conversation.last_message_at || conversation.updated_at), {
                          addSuffix: true
                        })}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-400 truncate">
                      {conversation.last_message || 'No messages yet'}
                    </p>
                  </div>
                  
                  {conversation.unread_count > 0 && (
                    <div className="flex-shrink-0 bg-purple-600 text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
                      {conversation.unread_count}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            <p>No conversations found</p>
            <p className="text-sm mt-1">Start chatting with someone</p>
          </div>
        )}
      </div>
      
      <div className="border-t border-white/10 p-4">
        <button
          onClick={() => navigate('/gigs')}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg py-2 flex items-center justify-center gap-2"
        >
          <Edit className="w-4 h-4" />
          <span>New Message</span>
        </button>
      </div>
    </div>
  );
};

export default ConversationList;

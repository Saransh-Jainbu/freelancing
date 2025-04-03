import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../../../api/constants';
import { useAuth } from '../../../context/AuthContextValue';
import { ArrowLeft, Send, Paperclip, Image, FileText, X, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const MobileChatView = () => {
  const { conversationId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    if (!conversationId) return;
    
    // Fetch conversation details
    const fetchConversation = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/conversations/${conversationId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch conversation');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setConversation(data.conversation);
        } else {
          throw new Error(data.message || 'Failed to load conversation');
        }
      } catch (error) {
        console.error('Error fetching conversation:', error);
      }
    };
    
    // Fetch messages
    const fetchMessages = async () => {
      try {
        const response = await fetch(`${API_URL}/api/messages/${conversationId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setMessages(data.messages);
        } else {
          throw new Error(data.message || 'Failed to load messages');
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConversation();
    fetchMessages();
    
    // Set up WebSocket for real-time messages
    const socket = new WebSocket(`${API_URL.replace('http', 'ws')}/ws`);
    
    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: 'join',
        conversationId: conversationId,
        userId: currentUser.id
      }));
    };
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'message' && data.conversationId === conversationId) {
        setMessages(prevMessages => [...prevMessages, data.message]);
      }
    };
    
    return () => {
      socket.close();
    };
  }, [conversationId, currentUser?.id]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    
    try {
      const formData = new FormData();
      formData.append('senderId', currentUser.id);
      formData.append('conversationId', conversationId);
      formData.append('content', newMessage);
      
      // Append attachments if any
      attachments.forEach(attachment => {
        formData.append('attachments', attachment);
      });
      
      const response = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      // Clear input and attachments
      setNewMessage('');
      setAttachments([]);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };
  
  const handleAttachmentClick = (type) => {
    setShowAttachmentOptions(false);
    fileInputRef.current.click();
  };
  
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments([...attachments, ...files]);
  };
  
  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };
  
  const formatMessageTime = (timestamp) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };
  
  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-screen bg-black p-4">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900 border-b border-white/10 p-4">
        <div className="flex items-center">
          <button
            className="mr-4"
            onClick={() => navigate('/chat')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          {conversation && (
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-3 overflow-hidden">
                {conversation.participant?.avatar_url ? (
                  <img 
                    src={conversation.participant.avatar_url} 
                    alt={conversation.participant.display_name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="font-medium">{conversation.participant?.display_name || 'Unknown User'}</h3>
                {conversation.project_info && (
                  <p className="text-xs text-gray-400">
                    Project: {conversation.project_info.title}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.sender_id === currentUser.id;
          
          return (
            <div 
              key={message.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[75%] rounded-lg px-4 py-2 ${
                  isOwnMessage ? 
                    'bg-purple-600 text-white' : 
                    'bg-gray-700 text-white'
                }`}
              >
                <p className="break-words">{message.content}</p>
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((attachment, index) => (
                      <a 
                        key={index}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-white/10 rounded p-2 hover:bg-white/20 transition-colors"
                      >
                        {attachment.type.startsWith('image/') ? (
                          <Image className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                        <span className="text-sm truncate">{attachment.filename}</span>
                      </a>
                    ))}
                  </div>
                )}
                <p className="text-xs mt-1 opacity-70">
                  {formatMessageTime(message.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Attachment preview */}
      {attachments.length > 0 && (
        <div className="bg-gray-900 p-2">
          <div className="flex overflow-x-auto gap-2 pb-2">
            {attachments.map((file, index) => (
              <div 
                key={index}
                className="relative flex-shrink-0 bg-gray-800 rounded p-2"
              >
                <button 
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5"
                  onClick={() => removeAttachment(index)}
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-2">
                  {file.type.startsWith('image/') ? (
                    <div className="w-10 h-10 relative">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt="Preview" 
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                  <span className="text-xs max-w-[100px] truncate">{file.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Message input */}
      <div className="bg-gray-900 border-t border-white/10 p-4">
        <div className="flex items-end gap-2">
          <div className="relative">
            <button 
              className="text-gray-400 hover:text-white"
              onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            {/* Attachment options */}
            {showAttachmentOptions && (
              <div className="absolute bottom-full mb-2 left-0 bg-gray-800 border border-white/10 rounded-lg p-2 w-48">
                <button 
                  className="flex items-center gap-2 p-2 hover:bg-white/10 rounded w-full text-left"
                  onClick={() => handleAttachmentClick('image')}
                >
                  <Image className="w-4 h-4" />
                  <span>Image</span>
                </button>
                <button 
                  className="flex items-center gap-2 p-2 hover:bg-white/10 rounded w-full text-left"
                  onClick={() => handleAttachmentClick('file')}
                >
                  <FileText className="w-4 h-4" />
                  <span>File</span>
                </button>
              </div>
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
              multiple
            />
          </div>
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow bg-gray-800 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() && attachments.length === 0}
            className={`p-2 rounded-lg ${
              !newMessage.trim() && attachments.length === 0 ? 
                'bg-gray-800 text-gray-500' : 
                'bg-purple-600 text-white'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileChatView;

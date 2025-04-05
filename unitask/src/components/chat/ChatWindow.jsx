import { useState, useEffect, useRef } from 'react';
import { API_URL } from '../../api/constants';
import { useAuth } from '../../context/AuthContextValue';
import { Send, Paperclip, Smile, Image, File, AlertTriangle } from 'lucide-react';
import ChatHeader from './ChatHeader';

const ChatWindow = ({ conversation, onClose }) => {
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const fetchMessages = async () => {
    if (!conversation?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/messages/${conversation.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages || []);
      } else {
        throw new Error(data.message || 'Failed to load messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Error loading messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchMessages();
    
    // Mark conversation as read when opened
    if (conversation?.id) {
      fetch(`${API_URL}/api/conversations/${conversation.id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      }).catch(err => console.error('Error marking conversation as read:', err));
    }
  }, [conversation?.id]);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || !conversation?.id) return;
    
    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId: conversation.id,
          senderId: currentUser.id,
          content: message.trim()
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      // Clear the input field
      setMessage('');
      
      // Refresh messages
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };
  
  const handleFileUpload = async (file) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', conversation.id);
      formData.append('senderId', currentUser.id);
      
      const response = await fetch(`${API_URL}/api/messages/attachment`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      
      // Refresh messages
      fetchMessages();
      setShowAttachMenu(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  const handleAttachmentClick = (type) => {
    // Set the accept attribute based on the type
    if (fileInputRef.current) {
      if (type === 'image') {
        fileInputRef.current.accept = 'image/*';
      } else {
        fileInputRef.current.accept = '.pdf,.doc,.docx,.zip,.rar,.txt';
      }
      fileInputRef.current.click();
    }
    
    setShowAttachMenu(false);
  };
  
  if (!conversation) {
    return (
      <div className="flex-1 bg-gray-900 border-l border-white/10 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p>Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-white/10">
      <ChatHeader conversation={conversation} onClose={onClose} />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-6 w-6 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-4 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation by sending a message</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSender = msg.sender_id === currentUser.id;
            const isAttachment = msg.attachment_url;
            
            return (
              <div 
                key={msg.id} 
                className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${
                    isSender ? 'bg-purple-600/80' : 'bg-gray-800'
                  }`}
                >
                  {isAttachment ? (
                    <div>
                      <a 
                        href={msg.attachment_url} 
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 hover:underline text-sm"
                      >
                        {msg.attachment_type?.startsWith('image/') ? (
                          <>
                            <Image className="w-4 h-4" />
                            <span>View Image</span>
                          </>
                        ) : (
                          <>
                            <File className="w-4 h-4" />
                            <span>{msg.attachment_name || 'Download File'}</span>
                          </>
                        )}
                      </a>
                    </div>
                  ) : (
                    <p className="break-words">{msg.content}</p>
                  )}
                  
                  <div className={`text-xs mt-1 ${isSender ? 'text-white/70' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="border-t border-white/10 p-4">
        <div className="relative">
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className="text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/5"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              {showAttachMenu && (
                <div className="absolute bottom-full left-0 mb-2 bg-gray-800 border border-white/10 rounded-lg shadow-lg">
                  <div className="p-2 flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => handleAttachmentClick('image')}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 rounded-md text-sm"
                    >
                      <Image className="w-4 h-4" />
                      <span>Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAttachmentClick('file')}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 rounded-md text-sm"
                    >
                      <File className="w-4 h-4" />
                      <span>Document</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button
              type="button"
              className="text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/5 ml-1"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>
          
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-gray-800 border border-white/10 rounded-lg pl-16 pr-12 py-2.5 focus:outline-none focus:border-purple-500"
            disabled={uploading}
          />
          
          <button
            type="submit"
            disabled={!message.trim() || uploading}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800/50 disabled:cursor-not-allowed p-1.5 rounded-full"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
          className="hidden"
        />
      </form>
    </div>
  );
};

export default ChatWindow;
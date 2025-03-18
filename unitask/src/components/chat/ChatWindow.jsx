import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Send, Loader, MoreVertical, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { deleteConversation } from '../../api/chat';
import { useNavigate } from 'react-router-dom';

const ChatWindow = ({ conversation, currentUser, onSendMessage, onDeleteConversation }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      setLoading(true);
      setError('');
      await onSendMessage(message);
      setMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      try {
        setLoading(true);
        setError('');
        await deleteConversation(conversation.id);
        onDeleteConversation(conversation.id);
        navigate('/chat');
      } catch (error) {
        console.error('Error deleting conversation:', error);
        setError('Failed to delete conversation. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleActionMenu = () => {
    setActionMenuOpen(!actionMenuOpen);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h2 className="text-lg font-semibold">{conversation.title}</h2>
          <p className="text-sm text-gray-400">{conversation.participants.map(p => p.display_name).join(', ')}</p>
        </div>
        <div className="relative">
          <button onClick={handleToggleActionMenu} className="p-2 hover:bg-white/10 rounded-full">
            <MoreVertical className="w-5 h-5" />
          </button>
          {actionMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg z-10 py-1 border border-white/10">
              <button
                onClick={handleDeleteConversation}
                className="px-4 py-2.5 flex items-center gap-2 hover:bg-red-900/20 text-red-400 w-full text-left text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete Conversation
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs p-3 rounded-lg ${msg.sender_id === currentUser.id ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-300'}`}>
              <p className="text-sm">{msg.content}</p>
              <p className="text-xs text-gray-400 mt-1">{format(new Date(msg.created_at), 'p')}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-white/10">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={loading}
          />
          <button
            onClick={handleSendMessage}
            className={`p-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-opacity ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

ChatWindow.propTypes = {
  conversation: PropTypes.object.isRequired,
  currentUser: PropTypes.object.isRequired,
  onSendMessage: PropTypes.func.isRequired,
  onDeleteConversation: PropTypes.func.isRequired,
};

export default ChatWindow;
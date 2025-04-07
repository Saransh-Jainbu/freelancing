import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MobileChatView = ({ conversationId, currentUser, onBack, onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSendMessage(message);
    setMessage('');
  };

  return (
    <div className="h-[100vh] flex flex-col bg-black fixed inset-0 z-50">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-gray-900">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold truncate">
            {participants[0]?.display_name || 'Chat'}
          </h2>
        </div>
      </div>

      {/* Messages - Fixed height with scrolling */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-130px)]">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex mb-3 ${message.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.sender_id === currentUser.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                  : 'bg-gray-800'
              }`}
            >
              <p>{message.content}</p>
              <p className="text-xs opacity-60 mt-1">
                {new Date(message.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Fixed at bottom */}
      <div className="p-4 border-t border-white/10 bg-gray-900">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className={`p-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 ${
              !message.trim() ? 'opacity-50' : 'opacity-100'
            }`}
          >
            <Send className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default MobileChatView;

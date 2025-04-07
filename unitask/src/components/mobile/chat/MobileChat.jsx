import { useState, useEffect } from 'react';
import MobileChatList from './MobileChatList';
import MobileChatView from './MobileChatView';
import { useNavigate, useParams } from 'react-router-dom';
import { useMediaQuery } from '../../../hooks/useMediaQuery';

const MobileChat = ({ conversations, currentUser, onSendMessage, onStartChat }) => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [view, setView] = useState(conversationId ? 'chat' : 'list');
  const isMobileDevice = useMediaQuery('(max-width: 768px)');
  
  // Ensure correct view is set based on URL
  useEffect(() => {
    setView(conversationId ? 'chat' : 'list');
  }, [conversationId]);

  const handleBack = () => {
    setView('list');
    navigate('/chat');
  };

  const handleSelectChat = (conversation) => {
    setView('chat');
    navigate(`/chat/${conversation.id}`);
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-black flex flex-col overflow-hidden">
      {view === 'list' ? (
        <MobileChatList 
          conversations={conversations}
          currentUser={currentUser}
          onSelectChat={handleSelectChat}
          onNewChat={() => onStartChat()}
        />
      ) : (
        <MobileChatView 
          conversationId={conversationId}
          currentUser={currentUser}
          onBack={handleBack}
          onSendMessage={onSendMessage}
        />
      )}
    </div>
  );
};

export default MobileChat;

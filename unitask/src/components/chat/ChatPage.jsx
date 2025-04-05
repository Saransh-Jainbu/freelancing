import { useState, useEffect } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import { MessageSquare } from 'lucide-react';

const ChatPage = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const { isMobile } = useMediaQuery();
  const [showConversations, setShowConversations] = useState(true);
  
  // Effect to handle mobile view when a conversation is selected
  useEffect(() => {
    if (isMobile && selectedConversation) {
      setShowConversations(false);
    }
  }, [selectedConversation, isMobile]);
  
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    if (isMobile) {
      setShowConversations(false);
    }
  };
  
  const handleCloseChatWindow = () => {
    if (isMobile) {
      setShowConversations(true);
    }
  };
  
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="h-screen flex">
        {/* Conversation List - hidden on mobile when a conversation is selected */}
        {(!isMobile || showConversations) && (
          <div className="w-full md:w-80 xl:w-96 bg-gray-900 border-r border-white/10">
            <ConversationList onSelect={handleSelectConversation} />
          </div>
        )}
        
        {/* Chat Window */}
        {(!isMobile || !showConversations) && (
          selectedConversation ? (
            <div className="flex-1">
              <ChatWindow 
                conversation={selectedConversation} 
                onClose={handleCloseChatWindow}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-900 border-l border-white/10">
              <div className="text-center p-6">
                <div className="flex justify-center mb-4">
                  <div className="bg-gray-800 p-4 rounded-full">
                    <MessageSquare className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold mb-2">Your Messages</h2>
                <p className="text-gray-400 max-w-md">
                  Select a conversation from the sidebar to view your messages or start a new conversation.
                </p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ChatPage;

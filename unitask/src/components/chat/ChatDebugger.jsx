import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * ChatDebugger component to help debug real-time messaging
 * - Shows recent socket events
 * - Displays connection status
 * - Provides debug controls
 */
const ChatDebugger = ({ socket, visible = false }) => {
  const [isOpen, setIsOpen] = useState(visible);
  const [events, setEvents] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const maxEvents = 50;
  const eventsEndRef = useRef(null);
  
  // Handle socket events
  useEffect(() => {
    if (!socket) return;
    
    // Track connection status
    socket.on('connect', () => {
      addEvent('connect', `Connected with ID: ${socket.id}`);
      setConnectionStatus('connected');
    });
    
    socket.on('disconnect', (reason) => {
      addEvent('disconnect', `Disconnected: ${reason}`);
      setConnectionStatus('disconnected');
    });
    
    socket.on('connect_error', (error) => {
      addEvent('connect_error', `Connection error: ${error.message}`);
      setConnectionStatus('error');
    });
    
    // Track specific chat events
    socket.on('new-message', (data) => {
      addEvent('new-message', `From: ${data.sender_id}, To: ${data.conversation_id}`, data);
    });
    
    socket.on('online-users', (data) => {
      addEvent('online-users', `${data.length} users online`, data);
    });
    
    socket.on('message-read', (data) => {
      addEvent('message-read', `Messages read in conversation ${data.conversationId}`, data);
    });
    
    socket.on('user-typing', (data) => {
      addEvent('user-typing', `User ${data.userId} typing in ${data.conversationId}: ${data.isTyping}`, data);
    });
    
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('new-message');
      socket.off('online-users');
      socket.off('message-read');
      socket.off('user-typing');
    };
  }, [socket]);
  
  // Add an event to the log
  const addEvent = (type, description, data = null) => {
    setEvents(prev => {
      const newEvents = [
        ...prev, 
        { 
          id: Date.now(), 
          type, 
          description, 
          timestamp: new Date().toISOString(),
          data
        }
      ];
      
      // Keep only the most recent events
      if (newEvents.length > maxEvents) {
        return newEvents.slice(-maxEvents);
      }
      return newEvents;
    });
  };
  
  // Scroll to bottom when new events are added
  useEffect(() => {
    if (isOpen) {
      eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, isOpen]);
  
  // Toggle the debugger visibility
  const toggleDebugger = () => {
    setIsOpen(prev => !prev);
  };
  
  // Clear all events
  const clearEvents = () => {
    setEvents([]);
  };
  
  // Force a connection
  const forceConnect = () => {
    if (socket && socket.disconnected) {
      socket.connect();
      addEvent('manual', 'Manually initiated connection');
    }
  };
  
  // Format the timestamp to be more readable
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
  };
  
  // Get the color for a specific event type
  const getEventColor = (type) => {
    switch(type) {
      case 'connect': return 'text-green-500';
      case 'disconnect': return 'text-red-500';
      case 'connect_error': return 'text-red-500';
      case 'new-message': return 'text-blue-500';
      case 'message-read': return 'text-purple-500';
      case 'online-users': return 'text-yellow-500';
      case 'user-typing': return 'text-gray-500';
      default: return 'text-white';
    }
  };
  
  if (!socket) return null;
  
  return (
    <>
      {/* Floating button to toggle debugger */}
      <button 
        onClick={toggleDebugger}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full z-50 shadow-lg hover:bg-gray-700"
        title="Toggle Chat Debugger"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
      
      {/* Debugger panel */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-end">
          <div className="bg-gray-900 w-full md:w-1/2 lg:w-1/3 h-full overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gray-800 p-4 flex justify-between items-center">
              <div className="text-white font-bold">Chat Debugger</div>
              <div className="flex items-center space-x-4">
                <div className={`px-2 py-1 rounded text-xs ${
                  connectionStatus === 'connected' ? 'bg-green-900 text-green-300' :
                  connectionStatus === 'error' ? 'bg-red-900 text-red-300' :
                  'bg-gray-700 text-gray-300'
                }`}>
                  {connectionStatus}
                </div>
                <button 
                  onClick={forceConnect}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                  disabled={connectionStatus === 'connected'}
                >
                  Reconnect
                </button>
                <button 
                  onClick={clearEvents}
                  className="text-gray-400 hover:text-gray-300 text-sm"
                >
                  Clear
                </button>
                <button 
                  onClick={toggleDebugger}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Event log */}
            <div className="flex-1 overflow-y-auto bg-gray-950 p-4 font-mono text-sm">
              {events.length === 0 ? (
                <div className="text-gray-500 text-center mt-8">No events logged yet.</div>
              ) : (
                events.map(event => (
                  <div key={event.id} className="mb-2 border-b border-gray-800 pb-2">
                    <div className="flex justify-between items-start">
                      <span className={`font-bold ${getEventColor(event.type)}`}>
                        {event.type}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {formatTime(event.timestamp)}
                      </span>
                    </div>
                    <div className="text-gray-300 ml-2">{event.description}</div>
                    {event.data && (
                      <pre className="bg-gray-900 p-2 rounded mt-1 text-xs overflow-x-auto">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
              <div ref={eventsEndRef} />
            </div>
            
            {/* Manual event tools */}
            <div className="bg-gray-800 p-4">
              <div className="text-white text-sm mb-2">Debug Tools</div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => {
                    if (socket) {
                      socket.emit('ping', { debugTime: Date.now() });
                      addEvent('manual', 'Sent ping event');
                    }
                  }}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Send Ping
                </button>
                <button 
                  onClick={() => {
                    if (socket) {
                      socket.emit('get-status');
                      addEvent('manual', 'Requested server status');
                    }
                  }}
                  className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                >
                  Get Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

ChatDebugger.propTypes = {
  socket: PropTypes.object,
  visible: PropTypes.bool
};

export default ChatDebugger;

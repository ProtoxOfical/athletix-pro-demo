import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import { Send, User } from 'lucide-react';

interface ChatAreaProps {
  currentUserId: string;
  otherUserName: string;
  messages: Message[];
  onSendMessage: (text: string) => void;
  className?: string;
  showHeader?: boolean; // New prop to toggle internal header
}

const ChatArea: React.FC<ChatAreaProps> = ({ 
  currentUserId, 
  otherUserName, 
  messages, 
  onSendMessage, 
  className = '',
  showHeader = true 
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  return (
    // FIX: Removed fixed height. Added h-full and flex logic to fill parent.
    <div className={`flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden ${className}`}>
      
      {/* Header - Conditionally rendered to save space */}
      {showHeader && (
        <div className="bg-zinc-800/50 p-4 border-b border-zinc-800 flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                <User size={16} className="text-white"/>
            </div>
            <div>
            <h3 className="font-bold text-white text-sm">{otherUserName}</h3>
            <p className="text-xs text-emerald-400">Online</p>
            </div>
        </div>
      )}

      {/* Messages - FIX: Changed to flex-1 to take remaining space, removed min/max height */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-zinc-600 text-sm mt-10">No messages yet. Start the conversation!</div>
        ) : (
          messages.map(msg => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-zinc-800 text-zinc-200 rounded-bl-none border border-zinc-700'
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - FIX: shrink-0 ensures this never gets squashed */}
      <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex gap-2 shrink-0 safe-area-bottom">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 bg-zinc-800 text-white text-sm rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-zinc-700"
        />
        <button 
          onClick={handleSend}
          className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatArea;
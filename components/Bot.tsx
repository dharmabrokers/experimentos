import React, { useState, useRef, useEffect } from 'react';
import { User, ChatMessage } from '../types';
import { getElfAdvice } from '../services/geminiService';

interface BotProps {
  currentUser: User;
  targetUser: User;
}

const Bot: React.FC<BotProps> = ({ currentUser, targetUser }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: `¡Hola ${currentUser.name}! Soy Rodolfo el Reno Burlón. He leído la carta de tu amigo invisible... 🕵️‍♂️ ¡Pregúntame y te daré pistas!` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    const reply = await getElfAdvice(
      currentUser.name,
      targetUser.name,
      targetUser.wishlist,
      userMsg
    );

    setMessages(prev => [...prev, { role: 'model', text: reply }]);
    setLoading(false);
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-xl border-4 border-green-600 mt-6 max-w-md w-full mx-auto relative overflow-hidden">
        {/* Decorative elf hat - Animated */}
      <div className="absolute -top-4 -right-4 text-6xl transform z-10 pointer-events-none animate-wiggle origin-bottom-left filter drop-shadow-lg">
        🦌
      </div>

      <h3 className="text-green-800 text-xl font-bold mb-4 border-b-2 border-red-200 pb-2 christmas-font">
        Pistas del Reno Burlón
      </h3>

      <div 
        ref={scrollRef}
        className="h-64 overflow-y-auto mb-4 space-y-3 pr-2 scrollbar-thin scrollbar-thumb-green-600 scrollbar-track-green-100"
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg text-sm max-w-[85%] font-medium ${
              msg.role === 'user'
                ? 'bg-red-100 text-red-900 ml-auto rounded-br-none'
                : 'bg-green-100 text-green-900 mr-auto rounded-bl-none'
            }`}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="text-gray-500 text-xs animate-pulse italic">
            Rodolfo está leyendo la carta secreta...
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Dame una pista sobre el regalo..."
          className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-full text-gray-900 bg-white focus:outline-none focus:border-green-500 placeholder-gray-500"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center transition-colors disabled:opacity-50 shadow-md"
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default Bot;
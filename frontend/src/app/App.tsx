import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './components/ChatMessage';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  isQuote?: boolean;
  explanation?: string;
}

// Mock philosophical quotes database
const philosophicalQuotes = [
  {
    quote: "The unexamined life is not worth living.",
    author: "Socrates",
    explanation: "Socrates believed that self-reflection and critical thinking are essential to human flourishing. Without examining our beliefs, values, and actions, we live passively rather than intentionally."
  },
  {
    quote: "I think, therefore I am.",
    author: "René Descartes",
    explanation: "Descartes' foundational insight suggests that the very act of doubting one's existence proves that there is a thinking entity doing the doubting. This became the cornerstone of modern philosophy."
  },
  {
    quote: "Man is condemned to be free.",
    author: "Jean-Paul Sartre",
    explanation: "Sartre argued that humans are fundamentally free, but this freedom comes with the burden of responsibility. We cannot escape making choices, and with each choice, we define ourselves."
  },
  {
    quote: "The only true wisdom is in knowing you know nothing.",
    author: "Socrates",
    explanation: "This paradox emphasizes intellectual humility. Recognizing the limits of our knowledge opens us to genuine learning and prevents the arrogance of false certainty."
  },
  {
    quote: "He who has a why to live can bear almost any how.",
    author: "Friedrich Nietzsche",
    explanation: "Nietzsche suggests that having a sense of purpose or meaning makes even the most difficult circumstances bearable. Purpose provides resilience in the face of suffering."
  },
  {
    quote: "The mind is everything. What you think you become.",
    author: "Buddha",
    explanation: "This teaching emphasizes the power of thought in shaping our reality. Our mental patterns and beliefs fundamentally influence our actions, habits, and ultimately our character."
  },
  {
    quote: "To be is to be perceived.",
    author: "George Berkeley",
    explanation: "Berkeley's idealist philosophy argued that objects only exist insofar as they are perceived by a mind. This challenges our common-sense notion of an external, mind-independent reality."
  },
  {
    quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Aristotle",
    explanation: "Aristotle believed that virtue and character are developed through consistent practice. Our repeated actions shape who we become, making habit formation central to living well."
  }
];

function getRelevantQuote(userMessage: string): { quote: string; author: string; explanation: string } {
  // Simple keyword matching for demonstration
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('meaning') || lowerMessage.includes('purpose') || lowerMessage.includes('why')) {
    return philosophicalQuotes[4];
  } else if (lowerMessage.includes('think') || lowerMessage.includes('thought') || lowerMessage.includes('mind')) {
    return philosophicalQuotes[5];
  } else if (lowerMessage.includes('know') || lowerMessage.includes('wisdom') || lowerMessage.includes('learn')) {
    return philosophicalQuotes[3];
  } else if (lowerMessage.includes('free') || lowerMessage.includes('choice') || lowerMessage.includes('decide')) {
    return philosophicalQuotes[2];
  } else if (lowerMessage.includes('exist') || lowerMessage.includes('reality') || lowerMessage.includes('being')) {
    return philosophicalQuotes[1];
  } else if (lowerMessage.includes('habit') || lowerMessage.includes('practice') || lowerMessage.includes('excellence')) {
    return philosophicalQuotes[7];
  }
  
  // Default to a random quote
  return philosophicalQuotes[Math.floor(Math.random() * philosophicalQuotes.length)];
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Welcome to Philosophy Stream. Share your philosophical questions, and I will offer wisdom from the great thinkers.',
      isUser: false
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
  };

  const handlePostQuote = () => {
    const userMessages = messages.filter(m => m.isUser);
    if (userMessages.length === 0) return;

    const lastUserMessage = userMessages[userMessages.length - 1];
    const { quote, author, explanation } = getRelevantQuote(lastUserMessage.text);

    const quoteMessage: Message = {
      id: Date.now().toString(),
      text: `${quote} — ${author}`,
      isUser: false,
      isQuote: true,
      explanation
    };

    setMessages(prev => [...prev, quoteMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden font-sans">
      {/* Mirror Room Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-100 via-gray-50 to-slate-200" />
      
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent" />
      
      {/* Reflective floor gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-slate-300/30 via-transparent to-transparent" />

      {/* Robot Character with Reflection */}
      <div className="absolute bottom-8 left-8 flex flex-col items-center">
        <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl overflow-hidden shadow-2xl border border-gray-300/50 backdrop-blur-sm bg-white/40 mb-2">
          <img 
            src="https://images.unsplash.com/photo-1759395162739-84190996783c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwcm9ib3QlMjBzaXR0aW5nJTIwcm9jayUyMHplbnxlbnwxfHx8fDE3NzE1Mjk0NTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Philosophical Assistant"
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Mirror reflection */}
        <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl overflow-hidden opacity-20 blur-sm scale-y-[-1]">
          <img 
            src="https://images.unsplash.com/photo-1759395162739-84190996783c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwcm9ib3QlMjBzaXR0aW5nJTIwcm9jayUyMHplbnxlbnwxfHx8fDE3NzE1Mjk0NTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 md:p-8">
        <div className="w-full max-w-2xl h-[70vh] flex flex-col">
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-3xl md:text-4xl font-light text-gray-800 tracking-tight">
              Philosophy Stream
            </h1>
            <p className="text-gray-500 mt-1 text-sm font-light tracking-wide">Center of Awareness</p>
          </div>

          {/* Chat Card - Apple style */}
          <div className="flex-1 bg-white/60 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200/50 flex flex-col overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-3">
              {messages.map(message => (
                <ChatMessage
                  key={message.id}
                  message={message.text}
                  isUser={message.isUser}
                  isQuote={message.isQuote}
                  explanation={message.explanation}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white/40 backdrop-blur-xl border-t border-gray-200/50">
              <div className="flex gap-3 mb-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a philosophical question..."
                  className="flex-1 bg-white/80 backdrop-blur-sm border-gray-300/50 focus:bg-white focus:border-gray-400/50 transition-all rounded-2xl px-5 py-6 text-gray-800 placeholder:text-gray-400 shadow-sm"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim()}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-2xl px-6 shadow-md transition-all"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              
              <Button
                onClick={handlePostQuote}
                disabled={messages.filter(m => m.isUser).length === 0}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-2xl py-6 shadow-md font-light tracking-wide transition-all"
              >
                Post Quote
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
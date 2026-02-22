import { motion } from 'motion/react';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  isQuote?: boolean;
  explanation?: string;
}

export function ChatMessage({ message, isUser, isQuote, explanation }: ChatMessageProps) {
  if (isQuote) {
    return (
      <motion.div 
        className="flex justify-start mb-8"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1]
        }}
      >
        <div className="max-w-[90%] bg-white/70 backdrop-blur-md rounded-2xl px-8 py-6 shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-gray-200/60">
          <motion.blockquote 
            className="font-serif text-xl text-gray-900 mb-4 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            "{message}"
          </motion.blockquote>
          {explanation && (
            <motion.p 
              className="font-sans text-sm text-gray-600 leading-relaxed mt-5 pt-5 border-t border-gray-200"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {explanation}
            </motion.p>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${
          isUser
            ? 'bg-gray-900 text-white'
            : 'bg-white/70 text-gray-800 backdrop-blur-sm border border-gray-200/60'
        }`}
      >
        <p className="font-sans text-base leading-relaxed font-light">{message}</p>
      </div>
    </motion.div>
  );
}
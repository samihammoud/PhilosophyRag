import { Tags } from "lucide-react";
import { motion } from "motion/react";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  isQuote?: boolean;
  explanation?: string;
  tradition?: string;
  onQuoteClick?: () => void;
}

export function ChatMessage({
  message,
  isUser,
  isQuote,
  explanation,
  tradition,
  onQuoteClick,
}: ChatMessageProps) {
  if (isQuote) {
    return (
      <motion.div
        className="flex justify-start mb-8"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <button
          type="button"
          onClick={onQuoteClick}
          className={`max-w-[90%] rounded-2xl border border-gray-200/60 bg-white/70 px-8 py-6 text-left shadow-[0_4px_20px_rgb(0,0,0,0.08)] backdrop-blur-md transition ${
            onQuoteClick ? "cursor-pointer hover:bg-white/90" : "cursor-default"
          }`}
        >
          <div className="mb-3 flex items-center">
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-semibold tracking-wide text-slate-700 uppercase">
              <Tags className="size-3" />
              {tradition || "Unlabeled"}
            </span>
          </div>
          <motion.blockquote
            className="mb-4 font-serif text-xl leading-relaxed text-gray-900"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            "{message}"
          </motion.blockquote>
          {explanation && (
            <motion.p
              className="mt-5 border-t border-gray-200 pt-5 font-sans text-sm leading-relaxed text-gray-600"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {explanation}
            </motion.p>
          )}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`flex mb-4 ${isUser ? "justify-end" : "justify-start"}`}
      initial={{ opacity: 0, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${
          isUser
            ? "bg-gray-900 text-white"
            : "border border-gray-200/60 bg-white/70 text-gray-800 backdrop-blur-sm"
        }`}
      >
        <p className="font-sans text-base leading-relaxed font-light">{message}</p>
      </div>
    </motion.div>
  );
}

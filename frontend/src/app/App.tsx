import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./components/ChatMessage";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Send } from "lucide-react";
import { QuoteUpload } from "./components/ui/quote-upload";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  isQuote?: boolean;
  explanation?: string;
}

interface PostQuoteResponse {
  ok: boolean;
  quote: string;
  author: string;
  explanation: string;
}

const QUOTE_ENDPOINT =
  ((import.meta as unknown as { env?: { VITE_QUOTE_ENDPOINT?: string } }).env
    ?.VITE_QUOTE_ENDPOINT as string | undefined) || "/api/quote";

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Welcome to Philosophy Stream. Share your philosophical questions, and I will offer wisdom from the great thinkers.",
      isUser: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [quoteDraft, setQuoteDraft] = useState("");
  const [quoteAuthor, setQuoteAuthor] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userInput = input.trim();

    const newMessage: Message = {
      id: Date.now().toString(),
      text: userInput,
      isUser: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    await handlePostQuote();
  };

  const handlePostQuote = async () => {
    try {
      const response = await fetch(QUOTE_ENDPOINT);
      const contentType = response.headers.get("content-type") || "";
      const rawBody = await response.text();

      if (!contentType.includes("application/json")) {
        throw new Error(
          `Expected JSON from ${QUOTE_ENDPOINT} but got ${contentType || "unknown content type"}`,
        );
      }

      const payload = JSON.parse(rawBody) as PostQuoteResponse | { error?: string };

      if (!response.ok || !("quote" in payload)) {
        throw new Error(
          ("error" in payload && payload.error) ||
            `Quote request failed (${response.status})`,
        );
      }

      const quoteMessage: Message = {
        id: Date.now().toString(),
        text: `${payload.quote} — ${payload.author}`,
        isUser: false,
        isQuote: true,
        explanation: payload.explanation,
      };

      setMessages((prev) => [...prev, quoteMessage]);
    } catch (error) {
      console.error("Failed to retrieve quote:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown network or server error";
      const fallbackMessage: Message = {
        id: Date.now().toString(),
        text: `I couldn't retrieve a quote from the database right now. ${errorMessage}`,
        isUser: false,
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuoteFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      const [firstLine = ""] = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      setQuoteDraft(firstLine);
      setUploadStatus(`Loaded ${file.name}`);
    } catch {
      setUploadStatus("Failed to read file");
    }
  };

  const handleManualQuotePost = () => {
    const quote = quoteDraft.trim();
    const author = quoteAuthor.trim();
    if (!quote || !author) return;

    const quoteMessage: Message = {
      id: Date.now().toString(),
      text: `${quote} — ${author}`,
      isUser: false,
      isQuote: true,
    };

    setMessages((prev) => [...prev, quoteMessage]);
    setQuoteDraft("");
    setQuoteAuthor("");
    setUploadStatus("");
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
      <div className="absolute bottom-8 left-8 z-20 flex flex-col items-center">
        <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl overflow-hidden shadow-2xl border border-gray-300/50 backdrop-blur-sm bg-white/40 mb-2">
          <img
            src="https://images.unsplash.com/photo-1759395162739-84190996783c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwcm9ib3QlMjBzaXR0aW5nJTIwcm9jayUyMHplbnxlbnwxfHx8fDE3NzE1Mjk0NTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Philosophical Assistant"
            className="w-full h-full object-cover"
          />
        </div>

        <QuoteUpload
          quote={quoteDraft}
          author={quoteAuthor}
          uploadStatus={uploadStatus}
          onQuoteChange={setQuoteDraft}
          onAuthorChange={setQuoteAuthor}
          onUpload={handleQuoteFileUpload}
          onPostQuote={handleManualQuotePost}
          className="w-64 relative z-30"
        />

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

          {/* Chat Card - Apple style */}
          <div className="flex-1 bg-white/60 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200/50 flex flex-col overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-3">
              {messages.map((message) => (
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

              {/* <Button
                onClick={handlePostQuote}
                disabled={messages.filter((m) => m.isUser).length === 0}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-2xl py-6 shadow-md font-light tracking-wide transition-all"
              >
                Post Quote
              </Button> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

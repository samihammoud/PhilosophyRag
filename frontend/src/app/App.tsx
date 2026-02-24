import { useEffect, useRef, useState } from "react";
import {
  BookOpenText,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Tags,
} from "lucide-react";

import { ChatMessage } from "./components/ChatMessage";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { QuoteUpload } from "./components/ui/quote-upload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./components/ui/sheet";
import { ScrollArea } from "./components/ui/scroll-area";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  isQuote?: boolean;
  explanation?: string;
}

interface AskResponse {
  ok: boolean;
  answer: string;
  match?: {
    id?: string;
    document?: string;
    distance?: number;
    metadata?: {
      author?: string;
      tradition?: string;
      work?: string;
      source?: string;
      tags?: string[];
    };
  } | null;
}

interface CollectionMetadata {
  author?: string;
  tradition?: string;
}

interface CollectionsResponse {
  ok: boolean;
  documents?: string[];
  metadatas?: CollectionMetadata[];
  ids?: string[];
  error?: string;
}

const ASK_ENDPOINT = "http://localhost:3000/ask";
const COLLECTIONS_ENDPOINT = "http://localhost:3000/getCollections";

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
  const [isAsking, setIsAsking] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  const [libraryQuotes, setLibraryQuotes] = useState<
    { id: string; document: string; author: string; tradition: string }[]
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isLibraryOpen) return;
    void loadCollections();
  }, [isLibraryOpen]);

  const handleSendMessage = async () => {
    if (!input.trim() || isAsking) return;
    const userInput = input.trim();

    const newMessage: Message = {
      id: Date.now().toString(),
      text: userInput,
      isUser: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    await handlePostQuote(userInput);
  };

  const handlePostQuote = async (question: string) => {
    setIsAsking(true);

    try {
      const response = await fetch(ASK_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      const payload = (await response.json()) as AskResponse & {
        error?: string;
      };

      if (!response.ok || !payload.answer) {
        throw new Error(payload.error || `Ask request failed (${response.status})`);
      }

      const matchedQuote = payload.match?.document || "No matching quote found.";
      const matchedAuthor = payload.match?.metadata?.author || "Unknown";

      const quoteMessage: Message = {
        id: Date.now().toString(),
        text: `${matchedQuote} — ${matchedAuthor}`,
        isUser: false,
        isQuote: true,
        explanation: payload.answer,
      };

      setMessages((prev) => [...prev, quoteMessage]);
    } catch (error) {
      console.error("Failed to retrieve quote:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown network or server error";
      const fallbackMessage: Message = {
        id: Date.now().toString(),
        text: `I couldn't retrieve a quote from the database right now. ${errorMessage}`,
        isUser: false,
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsAsking(false);
    }
  };

  const loadCollections = async () => {
    setIsLoadingQuotes(true);
    setLibraryError("");

    try {
      const response = await fetch(COLLECTIONS_ENDPOINT);
      const payload = (await response.json()) as CollectionsResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Failed to load quote library");
      }

      const documents = payload.documents || [];
      const metadatas = payload.metadatas || [];
      const ids = payload.ids || [];

      setLibraryQuotes(
        documents.map((document, index) => ({
          id: ids[index] || String(index),
          document,
          author: metadatas[index]?.author || "Unknown",
          tradition: metadatas[index]?.tradition || "Unlabeled",
        })),
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown network or server error";
      setLibraryError(errorMessage);
    } finally {
      setIsLoadingQuotes(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
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
    setUploadStatus("Quote added to chat");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(148,163,184,0.28),transparent_45%),radial-gradient(circle_at_100%_0%,rgba(30,41,59,0.12),transparent_40%),radial-gradient(circle_at_50%_100%,rgba(226,232,240,0.7),transparent_60%)]" />
      <div className="pointer-events-none absolute -top-16 -left-12 h-56 w-56 rounded-full bg-white/70 blur-2xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-64 w-64 rounded-full bg-slate-300/30 blur-3xl" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8 lg:py-10">
        <header className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white/80 px-6 py-5 shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
              Philosophy Stream
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900 md:text-3xl">
              Thoughtful guidance, grounded in retrieval.
            </h1>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm">
            <Sparkles className="size-3.5" />
            Modern retrieval chat
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="space-y-4 rounded-3xl border border-slate-200/70 bg-white/75 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-12 w-full justify-start gap-2 rounded-2xl bg-slate-900 text-white shadow-md hover:bg-slate-800">
                  <Plus className="size-4" />
                  Add Quote Manually
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl rounded-2xl border-slate-200 bg-slate-50 p-0">
                <DialogHeader className="border-b border-slate-200 bg-white px-6 py-4">
                  <DialogTitle className="text-slate-900">Create Quote</DialogTitle>
                  <DialogDescription className="text-slate-600">
                    Add a quote to the live conversation or import the first line from a
                    file.
                  </DialogDescription>
                </DialogHeader>
                <div className="p-6">
                  <QuoteUpload
                    quote={quoteDraft}
                    author={quoteAuthor}
                    uploadStatus={uploadStatus}
                    onQuoteChange={setQuoteDraft}
                    onAuthorChange={setQuoteAuthor}
                    onUpload={handleQuoteFileUpload}
                    onPostQuote={handleManualQuotePost}
                  />
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              className="h-12 w-full justify-start gap-2 rounded-2xl border-slate-300 bg-white"
              onClick={() => setIsLibraryOpen(true)}
            >
              <BookOpenText className="size-4" />
              View All Quotes
            </Button>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
              <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                Session Snapshot
              </p>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <p>Messages: {messages.length}</p>
                <p>Loaded quotes: {libraryQuotes.length}</p>
              </div>
            </div>
          </aside>

          <main className="flex h-[72vh] flex-col rounded-3xl border border-slate-200/70 bg-white/78 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <p className="text-sm font-medium text-slate-600">Conversation</p>
              <p className="text-xs text-slate-500">
                {isAsking ? "Thinking..." : "Ready"}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
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

            <div className="border-t border-slate-200/80 bg-white/65 p-4 md:p-6">
              <div className="flex gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a philosophical question..."
                  className="h-12 flex-1 rounded-2xl border-slate-300 bg-white"
                />
                <Button
                  onClick={() => void handleSendMessage()}
                  disabled={!input.trim() || isAsking}
                  className="h-12 rounded-2xl bg-slate-900 px-5 text-white hover:bg-slate-800"
                >
                  {isAsking ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Send className="size-5" />
                  )}
                </Button>
              </div>
            </div>
          </main>
        </section>
      </div>

      <Sheet open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
        <SheetContent className="w-[96vw] max-w-2xl border-slate-200 bg-slate-50 p-0 sm:w-[640px] sm:max-w-2xl">
          <SheetHeader className="border-b border-slate-200 bg-white px-6 py-4">
            <SheetTitle className="text-slate-900">Quote Library</SheetTitle>
            <SheetDescription className="text-slate-600">
              Full quote collection retrieved from the vector store.
            </SheetDescription>
            <div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 gap-2 rounded-xl border-slate-300 bg-white"
                onClick={() => void loadCollections()}
                disabled={isLoadingQuotes}
              >
                <RefreshCw className={`size-4 ${isLoadingQuotes ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-140px)] px-6 py-5">
            {isLoadingQuotes && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                Loading quotes...
              </div>
            )}

            {!isLoadingQuotes && libraryError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Failed to load quotes: {libraryError}
              </div>
            )}

            {!isLoadingQuotes && !libraryError && libraryQuotes.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                No quotes found.
              </div>
            )}

            <div className="space-y-3 pb-8">
              {libraryQuotes.map((quote) => (
                <article
                  key={quote.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-sm leading-relaxed text-slate-800">"{quote.document}"</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                      {quote.author}
                    </p>
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-semibold tracking-wide text-slate-700 uppercase">
                      <Tags className="size-3" />
                      {quote.tradition}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}

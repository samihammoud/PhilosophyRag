import { useEffect, useRef, useState } from "react";
import {
  BookOpenText,
  CalendarDays,
  Compass,
  Loader2,
  Lock,
  LogIn,
  NotebookPen,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Tags,
  Waves,
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
import { Textarea } from "./components/ui/textarea";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  isQuote?: boolean;
  explanation?: string;
  quoteId?: string;
  quoteAuthor?: string;
  tradition?: string;
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
  source?: string;
}

interface CollectionsResponse {
  ok: boolean;
  documents?: string[];
  metadatas?: CollectionMetadata[];
  ids?: string[];
  error?: string;
}

interface ReflectionTarget {
  id: string;
  document: string;
  author: string;
  tradition: string;
}

interface ReflectionNote {
  id: string;
  text: string;
  createdAt: string;
}

const ASK_ENDPOINT = "http://localhost:3000/ask";
const COLLECTIONS_ENDPOINT = "http://localhost:3000/getCollections";
const CREATE_EMBEDDING_ENDPOINT = "http://localhost:3000/createEmbedding";

export default function App() {
  const [screen, setScreen] = useState<"splash" | "auth" | "app">("splash");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Welcome to Philosophy Explorer. Share your philosophical questions, and I will offer wisdom from the great thinkers.",
      isUser: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [quoteDraft, setQuoteDraft] = useState("");
  const [quoteAuthor, setQuoteAuthor] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  const [libraryQuotes, setLibraryQuotes] = useState<
    {
      id: string;
      document: string;
      author: string;
      tradition: string;
      source?: string;
    }[]
  >([]);
  const [selectedTradition, setSelectedTradition] = useState<string>("All");
  const [isAddingToBank, setIsAddingToBank] = useState(false);
  const [exploreStatus, setExploreStatus] = useState("");
  const [isReflectionOpen, setIsReflectionOpen] = useState(false);
  const [reflectionTarget, setReflectionTarget] =
    useState<ReflectionTarget | null>(null);
  const [reflectionDraft, setReflectionDraft] = useState("");
  const [reflectionNotes, setReflectionNotes] = useState<
    Record<string, ReflectionNote[]>
  >({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (screen !== "splash") return;
    const timer = window.setTimeout(() => {
      setScreen("auth");
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [screen]);

  useEffect(() => {
    if (!isLibraryOpen) return;
    void loadCollections();
  }, [isLibraryOpen]);

  useEffect(() => {
    if (!isExploreOpen) return;
    if (libraryQuotes.length === 0) {
      void loadCollections();
    }
  }, [isExploreOpen, libraryQuotes.length]);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("reflection-pool-notes-v1");
      if (cached) {
        setReflectionNotes(
          JSON.parse(cached) as Record<string, ReflectionNote[]>,
        );
      }
    } catch {
      setReflectionNotes({});
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "reflection-pool-notes-v1",
      JSON.stringify(reflectionNotes),
    );
  }, [reflectionNotes]);

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
        throw new Error(
          payload.error || `Ask request failed (${response.status})`,
        );
      }

      const matchedQuote =
        payload.match?.document || "No matching quote found.";
      const matchedAuthor = payload.match?.metadata?.author || "Unknown";
      const matchedTradition =
        payload.match?.metadata?.tradition || "Unlabeled";
      const matchedId = payload.match?.id || `${Date.now()}`;

      const quoteMessage: Message = {
        id: Date.now().toString(),
        text: matchedQuote,
        isUser: false,
        isQuote: true,
        explanation: payload.answer,
        quoteId: matchedId,
        quoteAuthor: matchedAuthor,
        tradition: matchedTradition,
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
          source: metadatas[index]?.source || "",
        })),
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown network or server error";
      setLibraryError(errorMessage);
    } finally {
      setIsLoadingQuotes(false);
    }
  };

  const openReflectionPool = (target: ReflectionTarget) => {
    setReflectionTarget(target);
    setReflectionDraft("");
    setIsReflectionOpen(true);
  };

  const handleAddReflectionNote = () => {
    if (!reflectionTarget || !reflectionDraft.trim()) return;

    const newNote: ReflectionNote = {
      id: crypto.randomUUID(),
      text: reflectionDraft.trim(),
      createdAt: new Date().toISOString(),
    };

    setReflectionNotes((prev) => ({
      ...prev,
      [reflectionTarget.id]: [...(prev[reflectionTarget.id] || []), newNote],
    }));
    setReflectionDraft("");
  };

  const handleDummyLogin = (event: React.FormEvent) => {
    event.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError("Enter both email and password.");
      return;
    }
    setLoginError("");
    setScreen("app");
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
      text: quote,
      isUser: false,
      isQuote: true,
      quoteId: `manual-${Date.now()}`,
      quoteAuthor: author,
      tradition: "Manual",
    };

    setMessages((prev) => [...prev, quoteMessage]);
    setQuoteDraft("");
    setQuoteAuthor("");
    setUploadStatus("Quote added to chat");
  };

  const handleAddExplorerQuoteToBank = async (quote: {
    document: string;
    author: string;
    tradition: string;
  }) => {
    if (isAddingToBank) return;
    setIsAddingToBank(true);
    setExploreStatus("");

    try {
      const response = await fetch(CREATE_EMBEDDING_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: quote.document,
          metadata: {
            author: quote.author,
            tradition: quote.tradition,
            source: "explore_philosophies_ui",
            ingestedAt: new Date().toISOString(),
          },
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };
      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.error || `Create embedding failed (${response.status})`,
        );
      }

      setExploreStatus("Quote added to quote bank.");
      await loadCollections();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown network or server error";
      setExploreStatus(`Failed to add quote: ${errorMessage}`);
    } finally {
      setIsAddingToBank(false);
    }
  };

  const activeReflectionNotes = reflectionTarget
    ? reflectionNotes[reflectionTarget.id] || []
    : [];
  const availableTraditions = [
    "All",
    ...Array.from(
      new Set(
        libraryQuotes
          .map((quote) => quote.tradition)
          .filter((item) => Boolean(item)),
      ),
    ),
  ];
  const filteredExploreQuotes =
    selectedTradition === "All"
      ? libraryQuotes
      : libraryQuotes.filter((quote) => quote.tradition === selectedTradition);
  const notesByDate = activeReflectionNotes.reduce<
    Record<string, ReflectionNote[]>
  >((grouped, note) => {
    const dayKey = new Date(note.createdAt).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    grouped[dayKey] = [...(grouped[dayKey] || []), note];
    return grouped;
  }, {});

  if (screen === "splash") {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 text-slate-100">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(148,163,184,0.25),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(56,189,248,0.2),transparent_45%)]" />
        <div className="relative rounded-3xl border border-white/15 bg-white/5 px-10 py-9 text-center shadow-2xl backdrop-blur-xl">
          <p className="text-xs font-semibold tracking-[0.28em] text-slate-300 uppercase">
            Philosophy Explorer
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">
            Entering the Mirror
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Retrieval-backed philosophical guidance
          </p>
          <div className="mx-auto mt-5 h-1.5 w-28 overflow-hidden rounded-full bg-slate-700">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (screen === "auth") {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(51,65,85,0.18),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(148,163,184,0.28),transparent_45%)]" />
        <form
          onSubmit={handleDummyLogin}
          className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl"
        >
          <div className="mb-6">
            <p className="text-xs font-semibold tracking-[0.22em] text-slate-500 uppercase">
              Dummy Access
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">
              Log in
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              This is a placeholder auth screen for UI flow.
            </p>
          </div>

          <div className="space-y-3">
            <Input
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              placeholder="Email"
              className="h-11 rounded-xl border-slate-300 bg-white"
            />
            <Input
              value={loginPassword}
              onChange={(event) => setLoginPassword(event.target.value)}
              type="password"
              placeholder="Password"
              className="h-11 rounded-xl border-slate-300 bg-white"
            />
          </div>

          {loginError && (
            <p className="mt-3 text-sm font-medium text-red-600">
              {loginError}
            </p>
          )}

          <Button
            type="submit"
            className="mt-5 h-11 w-full gap-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
          >
            <LogIn className="size-4" />
            Enter Workspace
          </Button>

          <div className="mt-4 inline-flex items-center gap-2 text-xs text-slate-500">
            <Lock className="size-3.5" />
            Any non-empty credentials are accepted.
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(148,163,184,0.28),transparent_45%),radial-gradient(circle_at_100%_0%,rgba(30,41,59,0.12),transparent_40%),radial-gradient(circle_at_50%_100%,rgba(226,232,240,0.7),transparent_60%)]" />
      <div className="pointer-events-none absolute -top-16 -left-12 h-56 w-56 rounded-full bg-white/70 blur-2xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-64 w-64 rounded-full bg-slate-300/30 blur-3xl" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8 lg:py-10">
        <header className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white/80 px-6 py-5 shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
              Philosophy Explorer
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
                  <DialogTitle className="text-slate-900">
                    Create Quote
                  </DialogTitle>
                  <DialogDescription className="text-slate-600">
                    Add a quote to the live conversation or import the first
                    line from a file.
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

            <div className="rounded-2xl border border-slate-200 bg-white/95 p-4">
              <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                Explore Philosophies
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Browse by tradition and add insights to your chat or quote bank.
              </p>
              <Button
                variant="outline"
                className="mt-3 h-10 w-full justify-start gap-2 rounded-xl border-slate-300 bg-white"
                onClick={() => {
                  setSelectedTradition("All");
                  setExploreStatus("");
                  setIsExploreOpen(true);
                }}
              >
                <Compass className="size-4" />
                Open Explorer
              </Button>
            </div>

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
                  message={
                    message.isQuote
                      ? `${message.text} — ${message.quoteAuthor || "Unknown"}`
                      : message.text
                  }
                  isUser={message.isUser}
                  isQuote={message.isQuote}
                  explanation={message.explanation}
                  tradition={message.tradition}
                  onQuoteClick={
                    message.isQuote
                      ? () =>
                          openReflectionPool({
                            id: message.quoteId || message.id,
                            document: message.text,
                            author: message.quoteAuthor || "Unknown",
                            tradition: message.tradition || "Unlabeled",
                          })
                      : undefined
                  }
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
        <SheetContent className="w-[98vw] max-w-4xl border-slate-200 bg-slate-50 p-0 sm:w-[920px] sm:max-w-4xl">
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
                <RefreshCw
                  className={`size-4 ${isLoadingQuotes ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-125px)] px-8 py-6">
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

            {!isLoadingQuotes &&
              !libraryError &&
              libraryQuotes.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  No quotes found.
                </div>
              )}

            <div className="space-y-3 pb-8">
              {libraryQuotes.map((quote) => (
                <article
                  key={quote.id}
                  className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
                  onClick={() =>
                    openReflectionPool({
                      id: quote.id,
                      document: quote.document,
                      author: quote.author,
                      tradition: quote.tradition,
                    })
                  }
                >
                  <p className="text-sm leading-relaxed text-slate-800">
                    "{quote.document}"
                  </p>
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

      <Dialog open={isExploreOpen} onOpenChange={setIsExploreOpen}>
        <DialogContent className="h-[88vh] max-w-6xl overflow-hidden rounded-2xl border-slate-200 bg-slate-50 p-0">
          <DialogHeader className="border-b border-slate-200 bg-white px-6 py-4">
            <DialogTitle className="text-slate-900">
              Explore Philosophies
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Select a philosophy tradition and explore related quotes.
            </DialogDescription>
          </DialogHeader>

          <div className="grid h-[calc(88vh-88px)] md:grid-cols-[230px_1fr]">
            <div className="border-b border-slate-200 bg-white p-4 md:border-r md:border-b-0">
              <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                Traditions
              </p>
              <div className="space-y-2">
                {availableTraditions.map((tradition) => (
                  <Button
                    key={tradition}
                    variant={
                      selectedTradition === tradition ? "default" : "outline"
                    }
                    className="h-9 w-full justify-start rounded-xl"
                    onClick={() => setSelectedTradition(tradition)}
                  >
                    {tradition}
                  </Button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50">
              <ScrollArea className="h-full px-6 py-5">
                {exploreStatus && (
                  <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                    {exploreStatus}
                  </div>
                )}

                {isLoadingQuotes && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                    Loading traditions...
                  </div>
                )}

                {!isLoadingQuotes && filteredExploreQuotes.length === 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                    No quotes found for this tradition.
                  </div>
                )}

                <div className="space-y-3 pb-10">
                  {filteredExploreQuotes.map((quote) => (
                    <article
                      key={`explore-${quote.id}`}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <p className="text-sm leading-relaxed text-slate-800">
                        "{quote.document}"
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                          {quote.author}
                        </p>
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-semibold tracking-wide text-slate-700 uppercase">
                          <Tags className="size-3" />
                          {quote.tradition}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() =>
                            void handleAddExplorerQuoteToBank(quote)
                          }
                          disabled={isAddingToBank}
                        >
                          {isAddingToBank ? "Adding..." : "Add to Quote Bank"}
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isReflectionOpen} onOpenChange={setIsReflectionOpen}>
        <DialogContent className="h-[92vh] max-w-6xl overflow-hidden rounded-2xl border-slate-200 bg-slate-50 p-0">
          <DialogHeader className="border-b border-slate-200 bg-white px-6 py-4">
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Waves className="size-4 text-slate-500" />
              Reflection Pool
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Journal your notes under a selected quote. Entries are organized
              by date.
            </DialogDescription>
          </DialogHeader>

          {reflectionTarget ? (
            <div className="grid h-[calc(92vh-88px)] gap-0 md:grid-cols-[1.2fr_1fr]">
              <div className="border-b border-slate-200 bg-white p-6 md:border-r md:border-b-0">
                <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                  Selected Quote
                </p>
                <blockquote className="rounded-2xl border border-slate-200 bg-slate-50 p-5 font-serif text-lg leading-relaxed text-slate-900">
                  "{reflectionTarget.document}"
                </blockquote>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-600">
                    {reflectionTarget.author}
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-semibold tracking-wide text-slate-700 uppercase">
                    <Tags className="size-3" />
                    {reflectionTarget.tradition}
                  </span>
                </div>

                <div className="mt-6">
                  <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                    New Reflection
                  </p>
                  <Textarea
                    value={reflectionDraft}
                    onChange={(event) => setReflectionDraft(event.target.value)}
                    placeholder="Write what this quote stirs in you..."
                    className="min-h-32 rounded-xl border-slate-300 bg-white"
                  />
                  <Button
                    className="mt-3 gap-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                    onClick={handleAddReflectionNote}
                    disabled={!reflectionDraft.trim()}
                  >
                    <NotebookPen className="size-4" />
                    Save Note
                  </Button>
                </div>
              </div>

              <div className="bg-slate-50">
                <ScrollArea className="h-full px-6 py-5">
                  {Object.keys(notesByDate).length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                      No reflections yet for this quote.
                    </div>
                  ) : (
                    <div className="space-y-5 pb-10">
                      {Object.entries(notesByDate).map(([dateLabel, notes]) => (
                        <section key={dateLabel}>
                          <div className="mb-2 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
                            <CalendarDays className="size-3" />
                            {dateLabel}
                          </div>
                          <div className="space-y-2">
                            {notes.map((note) => (
                              <article
                                key={note.id}
                                className="rounded-xl border border-slate-200 bg-white p-3"
                              >
                                <p className="text-sm leading-relaxed text-slate-800">
                                  {note.text}
                                </p>
                                <p className="mt-2 text-[11px] text-slate-500">
                                  {new Date(
                                    note.createdAt,
                                  ).toLocaleTimeString()}
                                </p>
                              </article>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          ) : (
            <div className="p-6 text-sm text-slate-600">
              Choose a quote from chat or library to begin reflecting.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

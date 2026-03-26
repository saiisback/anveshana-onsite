"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Bot,
  X,
  Send,
  Loader2,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_QUESTIONS = [
  "What time does registration start?",
  "How long is the pitch?",
  "How do I get help?",
  "When is food served?",
];

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get response");
      }

      const data = await res.json();

      // Strip <think>...</think> tags from response
      let reply = data.reply as string;
      reply = reply.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: reply,
        },
      ]);
    } catch {
      setError("Couldn't reach the assistant. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-24 right-4 z-50 flex size-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 lg:bottom-6",
          open
            ? "bg-muted text-muted-foreground hover:bg-muted/80"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {open ? <X className="size-5" /> : <Bot className="size-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-40 right-4 z-50 flex h-[28rem] w-[22rem] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:w-96 lg:bottom-22">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border bg-primary/5 px-4 py-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/15">
              <Sparkles className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Anveshana Assistant
              </p>
              <p className="text-[10px] text-muted-foreground">
                Ask anything about the event
              </p>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
          >
            {messages.length === 0 && !loading && (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <Bot className="size-10 text-muted-foreground/30" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    How can I help you?
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Ask about schedule, rules, food, or anything event-related
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-muted text-foreground"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="size-3.5 shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-border px-3 py-2.5"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              disabled={loading}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || loading}
              className="size-8 shrink-0 rounded-full"
            >
              <Send className="size-3.5" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}

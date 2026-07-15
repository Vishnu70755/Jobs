import React from "react";
 
import { useState, useRef, useEffect } from "react";
import {
  useGetAiChatHistory,
  useSendAiMessage,
  getGetAiChatHistoryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MODES = [
  { id: "general", label: "General", emoji: "💬" },
  { id: "resume_review", label: "Resume Review", emoji: "📄" },
  { id: "interview_prep", label: "Interview Prep", emoji: "🎯" },
  { id: "cover_letter", label: "Cover Letter", emoji: "✉️" },
  { id: "skill_gap", label: "Skill Gap", emoji: "📈" },
];

export default function AiAssistant() {
  const [mode, setMode] = useState<string>("general");
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: history, isLoading } = useGetAiChatHistory({});
  const sendMessage = useSendAiMessage();
  const queryClient = useQueryClient();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  function handleSend() {
    const msg = input.trim();
    if (!msg || sendMessage.isPending) return;
    setInput("");

    sendMessage.mutate(
      { data: { message: msg, mode: mode as any } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAiChatHistoryQueryKey({}) });
        },
      }
    );
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const messages = history ?? [];

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex-none p-6 pb-0 border-b border-border bg-background">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold tracking-tight mb-3">AI Career Assistant</h1>
          <div className="flex gap-2 flex-wrap pb-4">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
                  mode === m.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                )}
              >
                <span>{m.emoji}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Ask me anything about your job search — resume tips, interview prep, cover
                letters, or career advice.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {[
                  "How do I improve my resume?",
                  "Help me prepare for a system design interview",
                  "Write a cover letter for a senior engineer role",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="px-3 py-2 text-sm border border-border rounded-lg hover:border-primary/50 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3 items-start",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {msg.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card border border-border rounded-tl-sm"
                  )}
                >
                  {msg.content}
                  {msg.mode && msg.role === "assistant" && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs capitalize border-0 px-0 text-muted-foreground">
                        {msg.mode.replace("_", " ")} mode
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {sendMessage.isPending && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Bot className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="flex-none p-4 border-t border-border bg-background">
        <div className="max-w-4xl mx-auto flex gap-3 items-end">
          <Textarea
            placeholder={`Ask anything in ${MODES.find((m) => m.id === mode)?.label ?? "General"} mode…`}
            className="min-h-[52px] max-h-[160px] resize-none flex-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <Button
            size="icon"
            className="h-[52px] w-[52px] flex-shrink-0"
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

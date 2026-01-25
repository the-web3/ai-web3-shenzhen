"use client";

import { useState, useCallback } from "react";
import { Message } from "@/types";
import { sendMessageStream } from "@/lib/api";
import ChatInput from "@/components/ChatInput";
import MessageList from "@/components/MessageList";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = useCallback(async (question: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      const result = await sendMessageStream(
        question,
        (token) => {
          setIsLoading(false);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + token }
                : msg
            )
          );
        },
        (meta) => {
          if (!meta.sources) return;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, sources: meta.sources }
                : msg
            )
          );
        },
        0.4
      );

      if (result) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: result.answer,
                  sources: result.sources,
                  queryTimeMs: result.query_time_ms,
                }
              : msg
          )
        );
      }
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to get response"}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <main className="flex flex-col h-screen overflow-hidden">
      <header className="flex-none px-6 py-4 border-b border-white/5 bg-black/20 backdrop-blur-md z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="App Logo"
            >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Web3 RAG <span className="text-primary font-light">助手</span>
              </h1>
              <p className="text-[10px] uppercase tracking-wider text-muted font-medium">
                基于 Qwen3-4B + LlamaIndex
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse" />
            <span className="text-xs font-medium text-slate-300">系统在线</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        <div className="h-full max-w-4xl mx-auto">
          <MessageList 
            messages={messages} 
            isLoading={isLoading} 
            onSelect={handleSendMessage}
          />
        </div>
      </div>

      <div className="flex-none pt-4 bg-gradient-to-t from-[#030014] via-[#030014]/80 to-transparent z-10">
        <ChatInput onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </main>
  );
}

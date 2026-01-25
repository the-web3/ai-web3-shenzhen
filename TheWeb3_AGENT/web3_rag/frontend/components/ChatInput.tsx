"use client";

import { useState, FormEvent, KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-6 px-4">
      <form onSubmit={handleSubmit} className="relative group">
        <div className={`
          relative flex items-end gap-2 p-2 rounded-[2rem]
          transition-all duration-300 ease-out
          bg-[#0f172a]/40 backdrop-blur-xl border border-white/10
          focus-within:bg-[#0f172a]/60 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 focus-within:shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)]
          hover:border-white/20
        `}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="询问关于 Web3, DeFi, Ethereum 的问题..."
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-white placeholder-slate-400 resize-none outline-none min-h-[50px] max-h-[200px] py-3.5 px-4 text-base leading-relaxed scrollbar-hide"
            style={{
              height: "auto",
            }}
          />
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            aria-label="发送消息"
            className={`
              flex-none w-10 h-10 mb-1.5 mr-1.5 rounded-full flex items-center justify-center transition-all duration-300
              ${!input.trim() || disabled 
                ? "bg-slate-700/50 text-slate-500 cursor-not-allowed" 
                : "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 active:scale-95"
              }
            `}
          >
            <svg
              className="w-5 h-5 ml-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
        
        <div className="absolute -bottom-6 left-0 w-full text-center transition-opacity duration-300 opacity-0 group-focus-within:opacity-100">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
            按 Enter 发送 <span className="mx-1 opacity-30">|</span> Shift+Enter 换行
          </p>
        </div>
      </form>
    </div>
  );
}

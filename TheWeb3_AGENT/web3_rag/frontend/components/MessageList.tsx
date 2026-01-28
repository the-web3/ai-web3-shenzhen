"use client";

import { useEffect, useRef } from "react";
import { Message as MessageType } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import Message from "./Message";
import LoadingDots from "./LoadingDots";

interface MessageListProps {
  messages: MessageType[];
  isLoading: boolean;
  onSelect?: (question: string) => void;
}

export default function MessageList({ messages, isLoading, onSelect }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mb-8"
        >
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-24 h-24 rounded-2xl glass-panel flex items-center justify-center border border-primary/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]"
          >
            <svg
              className="w-12 h-12 text-primary drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          </motion.div>
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-4xl font-bold mb-3 text-gradient-primary tracking-tight"
        >
          Web3 智能助手
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-muted/80 max-w-md mb-10 text-lg font-light leading-relaxed"
        >
          去中心化知识触手可及。询问关于协议、合约和 DeFi 策略的问题。
        </motion.p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
          {[
            { q: "什么是 Uniswap?", icon: "🦄", color: "from-pink-500/20 to-purple-500/20" },
            { q: "以太坊是如何工作的？", icon: "💎", color: "from-blue-500/20 to-cyan-500/20" },
            { q: "解释 DeFi 概念", icon: "🏦", color: "from-green-500/20 to-emerald-500/20" },
            { q: "分析智能合约", icon: "📜", color: "from-orange-500/20 to-amber-500/20" },
          ].map((item, idx) => (
            <motion.button
              key={item.q}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + idx * 0.1, duration: 0.4 }}
              onClick={() => onSelect?.(item.q)}
              className="group relative glass-card px-6 py-4 rounded-xl text-left hover:bg-white/5 transition-all duration-300 border border-white/5 hover:border-primary/30 flex items-center gap-4 cursor-pointer overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[scanline_1.5s_linear_infinite]" />
              
              <span className="relative z-10 text-2xl group-hover:scale-110 transition-transform duration-300 filter grayscale group-hover:grayscale-0">
                {item.icon}
              </span>
              <span className="relative z-10 text-sm font-medium text-muted group-hover:text-white transition-colors">
                {item.q}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto py-6 px-4 md:px-0 space-y-6 scroll-smooth">
      <AnimatePresence initial={false}>
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
      </AnimatePresence>
      
      {isLoading && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="flex gap-4"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div className="glass-panel rounded-2xl rounded-tl-none px-6 py-4 flex items-center">
            <LoadingDots />
          </div>
        </motion.div>
      )}
      <div ref={bottomRef} className="h-4" />
    </div>
  );
}

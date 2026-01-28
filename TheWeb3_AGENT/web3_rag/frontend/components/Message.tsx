"use client";

import { useState } from "react";
import { Message as MessageType } from "@/types";
import { motion } from "framer-motion";
import SourceCard from "./SourceCard";
import MarkdownRenderer from "./MarkdownRenderer";

interface MessageProps {
  message: MessageType;
}

export default function Message({ message }: MessageProps) {
  const [showSources, setShowSources] = useState(false);
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] bg-gradient-to-r from-primary to-primary-light rounded-2xl rounded-br-md px-4 py-3 text-white shadow-lg shadow-primary/10 transition-transform duration-200 hover:scale-[1.02] hover:shadow-primary/20">
          <div className="leading-relaxed">
            <MarkdownRenderer content={message.content} />
          </div>
        </div>
      </motion.div>
    );
  }

  const hasSources = message.sources && message.sources.length > 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex gap-4 group"
    >
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:rotate-12 shadow-lg shadow-primary/20">
        <svg
          className="w-4 h-4 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          role="img"
          aria-label="Assistant Icon"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <div className="bg-card border-l-2 border-primary rounded-xl px-4 py-3 transition-all duration-200 hover:bg-card-hover hover:shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:-translate-y-0.5">
          <div className="text-text leading-relaxed">
            <MarkdownRenderer content={message.content} />
          </div>

            {message.queryTimeMs && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
              <p className="text-xs text-muted font-mono">
                生成耗时 {message.queryTimeMs}ms
              </p>
            </div>
          )}
        </div>

        {hasSources && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors group/btn"
            >
              <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center transition-transform duration-200 group-hover/btn:scale-110">
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${showSources ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  role="img"
                  aria-label="Toggle Sources"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
              <span className="font-medium">
                {showSources ? "隐藏" : "显示"} {message.sources!.length} 个来源
              </span>
            </button>

            <motion.div
              initial={false}
              animate={{ 
                height: showSources ? "auto" : 0,
                opacity: showSources ? 1 : 0
              }}
              className="overflow-hidden"
            >
              <div className="space-y-2 pt-3">
                {message.sources!.map((source, idx) => (
                  <SourceCard key={idx} source={source} index={idx + 1} />
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {!hasSources && message.role === "assistant" && (
          <div className="mt-3 text-xs text-muted/50 italic flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-muted/50" />
            未使用参考文档
          </div>
        )}
      </div>
    </motion.div>
  );
}

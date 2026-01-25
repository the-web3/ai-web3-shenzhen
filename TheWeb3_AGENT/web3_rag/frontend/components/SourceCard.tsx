"use client";

import { useState } from "react";
import { Source } from "@/types";

interface SourceCardProps {
  source: Source;
  index: number;
}

export default function SourceCard({ source, index }: SourceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return "bg-green-500/20 text-green-400 border-green-500/30";
    if (score >= 0.6) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  };

  const scorePercent = Math.round(source.score * 100);

  return (
    <div
      className="bg-card-hover rounded-lg border border-border overflow-hidden cursor-pointer transition-all duration-200 hover:border-primary/30"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex-shrink-0 w-6 h-6 rounded-md bg-primary/20 text-primary text-xs font-medium flex items-center justify-center">
            {index}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-text truncate">
              {source.file_name}
            </p>
            {source.page && (
              <p className="text-xs text-muted">第 {source.page} 页</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={`px-2 py-1 rounded-md text-xs font-medium border ${getScoreColor(source.score)}`}
          >
            {scorePercent}%
          </span>
          <svg
            className={`w-4 h-4 text-muted transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      <div
        className={`overflow-hidden transition-all duration-200 ${
          isExpanded ? "max-h-[400px]" : "max-h-0"
        }`}
      >
        <div className="px-3 pb-3 pt-0">
          <div className="bg-background rounded-lg p-3 border border-border">
            <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">
              {source.text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

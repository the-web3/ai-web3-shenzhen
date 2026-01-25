"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <div className="rounded-lg overflow-hidden my-4 border border-white/10 shadow-lg">
              <div className="bg-[#1e1e1e] px-4 py-2 flex items-center justify-between border-b border-white/5">
                <span className="text-xs text-muted uppercase tracking-wider font-mono">
                  {match[1]}
                </span>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                </div>
              </div>
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  borderRadius: 0,
                  background: "#0d0d0d",
                  fontSize: "0.85rem",
                }}
                {...props}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            </div>
          ) : (
            <code
              className="bg-white/10 text-primary-light px-1.5 py-0.5 rounded text-sm font-mono border border-white/5"
              {...props}
            >
              {children}
            </code>
          );
        },
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold mb-4 mt-6 text-gradient-primary border-b border-white/10 pb-2">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-semibold mb-3 mt-5 text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full" />
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-medium mb-2 mt-4 text-accent">
            {children}
          </h3>
        ),
        ul: ({ children, ...props }) => (
          <ul className="list-disc list-outside ml-6 mb-4 space-y-2 text-muted-foreground" {...props}>
            {children}
          </ul>
        ),
        ol: ({ children, ...props }) => (
          <ol className="list-decimal list-outside ml-6 mb-4 space-y-2 text-muted-foreground" {...props}>
            {children}
          </ol>
        ),
        li: ({ children, ...props }) => (
          <li className="pl-1 marker:text-primary/70" {...props}>{children}</li>
        ),
        p: ({ children }) => (
          <p className="mb-4 leading-relaxed last:mb-0 break-words">{children}</p>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary/30 pl-4 py-1 my-4 bg-primary/5 rounded-r-lg italic text-muted">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-6 rounded-lg border border-white/10 shadow-lg">
            <table className="w-full border-collapse text-left text-sm bg-black/20">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-primary/10 text-primary-light uppercase tracking-wider font-semibold">
            {children}
          </thead>
        ),
        th: ({ children }) => (
          <th className="px-6 py-3 border-b border-white/10 first:pl-6 last:pr-6">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-6 py-4 border-b border-white/5 text-muted-foreground first:pl-6 last:pr-6 whitespace-nowrap md:whitespace-normal">
            {children}
          </td>
        ),
        a: ({ href, children }) => (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-accent hover:text-accent/80 underline decoration-accent/30 underline-offset-2 transition-colors"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

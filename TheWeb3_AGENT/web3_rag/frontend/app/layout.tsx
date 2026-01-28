import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Web3 RAG Assistant",
  description: "AI-powered Q&A for Web3 and blockchain knowledge",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased relative">
        <div className="aurora-bg" />
        <div className="stars-bg" />
        <div className="relative z-0 h-full flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}

"use client";

import { useState } from "react";
import { Bot, X, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function CopilotWidget({
  question,
  onQuestionChange,
  answer,
  loading,
  onAsk,
}: {
  question: string;
  onQuestionChange: (val: string) => void;
  answer: string;
  loading: boolean;
  onAsk: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="mb-3 w-96 max-h-[70vh] bg-slate border border-border rounded-xl shadow-2xl shadow-black/40 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-mint" />
              <span className="text-sm font-medium text-paper">Municipal Copilot</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-mist hover:text-paper">
              <X size={16} />
            </button>
          </div>

          <div className="p-4 overflow-y-auto flex-1">
            {answer ? (
              <div className="text-mist text-sm prose prose-invert prose-sm max-w-none prose-strong:text-paper">
                <ReactMarkdown>{answer}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-mist text-sm">Ask me anything about current complaints — priorities, locations, hazards.</p>
            )}
          </div>

          <div className="p-3 border-t border-border flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => onQuestionChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onAsk()}
              placeholder="Ask a question..."
              className="flex-1 bg-ink text-paper text-sm rounded-lg px-3 py-2 border border-border focus:border-mint outline-none"
            />
            <button
              onClick={onAsk}
              disabled={loading}
              className="bg-mint text-ink rounded-lg px-3 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 bg-mint text-ink rounded-full flex items-center justify-center shadow-2xl shadow-black/40 hover:opacity-90 transition-opacity"
      >
        <Bot size={24} />
      </button>
    </div>
  );
}
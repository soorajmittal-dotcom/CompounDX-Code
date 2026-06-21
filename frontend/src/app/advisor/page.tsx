"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import type { AdvisorResponse } from "@/lib/types";

interface Message {
  role: "user" | "assistant";
  content: string;
  data?: any;
}

const SUGGESTIONS = [
  "Plan a trip to Singapore in Business class",
  "Which card should I use for dining?",
  "Should I transfer HDFC points to KrisFlyer or Marriott?",
  "How much are my points worth?",
  "Am I using all my card benefits?",
  "How can I fly business to London with minimum cash?",
  "Should I renew my HDFC Infinia?",
  "Plan a 10-day Japan trip for family of 4",
];

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your Travel Points AI Advisor. I can help you with:\n\n• **Trip planning** — optimal points usage for your next trip\n• **Transfer recommendations** — best paths between loyalty programs\n• **Card optimization** — which card to use where\n• **Benefits analysis** — find unused perks worth lakhs\n• **Portfolio valuation** — how much your points are worth\n\nWhat would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (query?: string) => {
    const text = query || input.trim();
    if (!text) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res: any = await api.advisor.query(text);
      const response = res.response;

      let content = response.message;
      if (response.recommendation) {
        content += `\n\n**Recommendation:** ${response.recommendation}`;
      }

      if (response.top_recommendations) {
        content += "\n\n**Top picks:**\n";
        response.top_recommendations.forEach((r: any) => {
          content += `• ${r.category}: **${r.card}** (₹${r.annual_value?.toLocaleString()}/yr)\n`;
        });
      }

      if (response.summary) {
        content += "\n\n**Trip Options:**\n";
        response.summary.forEach((s: any) => {
          content += `• ${s.name}: ${s.total_points?.toLocaleString()} pts + ₹${s.cash_outflow?.toLocaleString()} cash (save ₹${s.savings?.toLocaleString()})\n`;
        });
      }

      setMessages((prev) => [...prev, { role: "assistant", content, data: response.data }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I encountered an error. Please make sure the backend server is running on localhost:8000." },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Travel Advisor</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Ask anything about your points strategy</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-primary-600 text-white"
                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              }`}
            >
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {msg.content.split(/(\*\*.*?\*\*)/).map((part, j) =>
                  part.startsWith("**") && part.endsWith("**") ? (
                    <strong key={j}>{part.slice(2, -2)}</strong>
                  ) : (
                    <span key={j}>{part}</span>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length <= 2 && (
        <div className="flex flex-wrap gap-2 pb-3">
          {SUGGESTIONS.slice(0, 4).map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="text-xs px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask about your points, trips, cards..."
          className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}

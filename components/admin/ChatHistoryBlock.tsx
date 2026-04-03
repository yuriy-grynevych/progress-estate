"use client";

import { useState } from "react";
import { Bot, User, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";

function MessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);
  return (
    <>
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline ${isUser ? "text-gold-300" : "text-navy-700 hover:text-navy-900"}`}
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

interface ChatMessage {
  role: string;
  content: string;
}

export default function ChatHistoryBlock({ history, source }: { history: ChatMessage[]; source?: string }) {
  const [open, setOpen] = useState(false);

  if (!history || history.length === 0) return null;

  return (
    <div className="mt-3 border border-blue-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-50 hover:bg-blue-100 transition text-left"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
          <MessageCircle className="w-4 h-4" />
          Історія чату з ботом
          <span className="text-blue-400 font-normal text-xs">({history.length} повідомлень)</span>
          {source && <span className="text-xs bg-blue-100 text-blue-500 px-2 py-0.5 rounded-full">{source}</span>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4 text-blue-400" />}
      </button>

      {open && (
        <div className="px-4 py-3 space-y-2 bg-white max-h-72 overflow-y-auto">
          {history.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-full bg-navy-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] px-3 py-1.5 rounded-xl text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-navy-900 text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-700 rounded-bl-sm"
              }`}>
                <MessageContent content={msg.content} isUser={msg.role === "user"} />
              </div>
              {msg.role === "user" && (
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-3 h-3 text-gray-500" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

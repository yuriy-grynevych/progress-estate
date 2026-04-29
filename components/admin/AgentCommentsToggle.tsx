"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";

interface AgentComment {
  text: string;
  author: string;
  createdAt: string;
}

export default function AgentCommentsToggle({ comments }: { comments: AgentComment[] }) {
  const [open, setOpen] = useState(false);
  if (!comments.length) return null;

  return (
    <div className="mt-1.5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-[10px] font-semibold text-blue-500 hover:text-blue-600 transition"
      >
        <MessageCircle className="w-3 h-3" />
        +{comments.length} коментар{comments.length === 1 ? "" : comments.length < 5 ? "і" : "ів"}
      </button>
      {open && (
        <div className="mt-1 flex flex-col gap-1">
          {comments.map((c, i) => (
            <div key={i} className="text-[10px] bg-blue-50 text-gray-700 rounded px-2 py-1 leading-relaxed">
              <span className="font-semibold text-blue-600">{c.author}:</span> {c.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { MessageCircle, Send, Trash2 } from "lucide-react";

interface AgentComment {
  text: string;
  author: string;
  createdAt: string;
}

interface Props {
  propertyId: string;
  initialComments: AgentComment[];
}

export default function AgentCommentSection({ propertyId, initialComments }: Props) {
  const [comments, setComments] = useState<AgentComment[]>(initialComments);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  async function addComment() {
    const text = input.trim();
    if (!text) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
        setInput("");
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteComment(index: number) {
    const res = await fetch(`/api/properties/${propertyId}/comments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index }),
    });
    if (res.ok) {
      const data = await res.json();
      setComments(data.comments);
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h2 className="text-base font-bold text-navy-900 mb-3 flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-blue-400" />
        Коментарі агента
        {comments.length > 0 && (
          <span className="text-xs font-normal text-gray-400 ml-1">({comments.length})</span>
        )}
      </h2>

      {/* Existing comments */}
      {comments.length > 0 && (
        <div className="space-y-2 mb-3">
          {comments.map((c, i) => (
            <div key={i} className="group flex items-start gap-2 bg-blue-50 rounded-xl px-3 py-2 text-sm text-gray-700">
              <div className="flex-1">
                <span className="font-semibold text-blue-600">{c.author}:</span>{" "}
                {c.text}
                {c.createdAt && (
                  <span className="text-[10px] text-gray-400 ml-2">
                    {new Date(c.createdAt).toLocaleDateString("uk-UA")}
                  </span>
                )}
              </div>
              <button
                onClick={() => deleteComment(i)}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition shrink-0 mt-0.5"
                title="Видалити"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add comment */}
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              addComment();
            }
          }}
          placeholder="Додати коментар... (Ctrl+Enter для збереження)"
          rows={2}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-navy-900/20"
        />
        <button
          onClick={addComment}
          disabled={!input.trim() || saving}
          className="self-end px-3 py-2 bg-navy-900 text-white rounded-xl text-sm font-medium hover:bg-navy-800 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          {saving ? "..." : "Зберегти"}
        </button>
      </div>
    </div>
  );
}

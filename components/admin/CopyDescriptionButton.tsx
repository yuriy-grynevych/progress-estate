"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface Props {
  html: string;
  agentPhone?: string | null;
}

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function CopyDescriptionButton({ html, agentPhone }: Props) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    let text = htmlToText(html);
    if (agentPhone) {
      text += `\n\n📞 ${agentPhone}`;
    }
    // Fallback for HTTP (no Clipboard API)
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      } else {
        const el = document.createElement("textarea");
        el.value = text;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // silent fail
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
        copied
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      }`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Скопійовано!" : "Копіювати опис"}
    </button>
  );
}

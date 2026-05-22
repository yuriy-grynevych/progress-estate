"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export default function CopyCollectionLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}/c/${slug}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const el = document.createElement("textarea");
        el.value = url;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Посилання: " + url);
    }
  }

  return (
    <button
      onClick={copy}
      className="text-gray-400 hover:text-gold-500 transition p-1.5 rounded-lg hover:bg-gray-100"
      title="Скопіювати публічне посилання"
    >
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
    </button>
  );
}

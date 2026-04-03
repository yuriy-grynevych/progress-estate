"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";

export default function CopyAgentLinkButton({
  slug,
  locale,
  agentToken,
}: {
  slug: string;
  locale: string;
  agentToken: string;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    const url = `${window.location.origin}/${locale}/listings/${slug}?t=${agentToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className="text-gray-400 hover:text-gold-500 transition"
      title="Скопіювати моє посилання"
    >
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
    </button>
  );
}

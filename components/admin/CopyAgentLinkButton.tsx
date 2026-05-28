"use client";

import { useState, useEffect, useRef } from "react";
import { Link2, Check, ChevronDown, FolderOpen, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

type Collection = {
  id: string;
  name: string;
  _count: { items: number };
};

export default function CopyAgentLinkButton({
  slug,
  locale,
  agentToken,
  propertyId,
}: {
  slug: string;
  locale: string;
  agentToken: string;
  propertyId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoadingCollections(true);
    fetch("/api/collections")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCollections(data); })
      .finally(() => setLoadingCollections(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        buttonRef.current && buttonRef.current.contains(e.target as Node)
      ) return;
      if (
        dropRef.current && dropRef.current.contains(e.target as Node)
      ) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function openDropdown() {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((v) => !v);
  }

  async function copyLink() {
    const url = `${window.location.origin}/p/${slug}`;
    let success = false;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        success = true;
      }
    } catch {}

    if (!success) {
      try {
        const el = document.createElement("textarea");
        el.value = url;
        el.style.cssText = "position:fixed;top:0;left:0;width:2px;height:2px;opacity:0.01;";
        document.body.appendChild(el);
        el.focus();
        el.select();
        success = document.execCommand("copy");
        document.body.removeChild(el);
      } catch {}
    }

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      window.prompt("Скопіюйте посилання (Ctrl+C):", url);
    }
    setOpen(false);
  }

  async function addToCollection(collectionId: string) {
    await fetch(`/api/collections/${collectionId}/properties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId }),
    });
    setAddedIds((prev) => new Set([...prev, collectionId]));
  }

  const dropdown = open ? (
    <div
      ref={dropRef}
      style={{
        position: "fixed",
        top: dropPos.top,
        right: dropPos.right,
        zIndex: 9999,
      }}
      className="w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-1 overflow-hidden"
    >
      <button
        onClick={copyLink}
        className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition text-left"
      >
        <Link2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
        Скопіювати посилання
      </button>

      <div className="border-t border-gray-100 my-1" />

      <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
        Додати до колекції
      </p>

      {loadingCollections && (
        <div className="px-3 py-2 text-xs text-gray-400">Завантаження…</div>
      )}
      {!loadingCollections && collections.length === 0 && (
        <div className="px-3 py-2 text-xs text-gray-400">Колекцій немає</div>
      )}
      {!loadingCollections && collections.map((col) => {
        const added = addedIds.has(col.id);
        return (
          <button
            key={col.id}
            onClick={() => addToCollection(col.id)}
            disabled={added}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition text-left disabled:opacity-60"
          >
            <FolderOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="flex-1 truncate">{col.name}</span>
            {added && <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
          </button>
        );
      })}

      <div className="border-t border-gray-100 mt-1" />
      <button
        onClick={() => {
          setOpen(false);
          router.push(`/admin/collections/new?propertyId=${propertyId}`);
        }}
        className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-gold-600 hover:bg-gold-50 transition text-left font-medium"
      >
        <Plus className="w-4 h-4 flex-shrink-0" />
        Нова колекція
      </button>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={openDropdown}
        className="flex items-center gap-0.5 text-gray-400 hover:text-gold-500 transition p-1.5 rounded-lg hover:bg-gray-100"
        title="Посилання / Додати до колекції"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Link2 className="w-4 h-4" />
        )}
        <ChevronDown className="w-3 h-3" />
      </button>
      {typeof window !== "undefined" && createPortal(dropdown, document.body)}
    </>
  );
}

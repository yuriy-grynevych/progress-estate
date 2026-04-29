"use client";
import { useState } from "react";
import { Upload, Trash2, ExternalLink, Loader2 } from "lucide-react";

interface Props {
  propertyId: string;
  initialAdId: string | null;
  initialPublishedAt: Date | string | null;
}

export default function OlxPublishButton({ propertyId, initialAdId, initialPublishedAt }: Props) {
  const [adId, setAdId] = useState<string | null>(initialAdId);
  const [publishedAt, setPublishedAt] = useState<string | null>(
    initialPublishedAt ? new Date(initialPublishedAt).toLocaleDateString("uk-UA") : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePublish = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/olx/publish/${propertyId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setAdId(data.adId);
      setPublishedAt(new Date().toLocaleDateString("uk-UA"));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnpublish = async () => {
    if (!confirm("Зняти оголошення з OLX?")) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/olx/unpublish/${propertyId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setAdId(null);
      setPublishedAt(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-navy-900 text-sm">OLX</h3>
          {adId ? (
            <p className="text-xs text-green-600 mt-0.5">
              Опубліковано {publishedAt} · ID: {adId}
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-0.5">Не опубліковано</p>
          )}
        </div>
        {adId && (
          <a
            href={`https://www.olx.ua/obyavlenie/${adId}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-500 hover:text-gold-600"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      {adId ? (
        <button
          onClick={handleUnpublish}
          disabled={loading}
          className="flex items-center gap-2 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-50 transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Зняти з OLX
        </button>
      ) : (
        <button
          onClick={handlePublish}
          disabled={loading}
          className="flex items-center gap-2 bg-[#002f34] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#004b52] transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Опублікувати на OLX
        </button>
      )}
    </div>
  );
}

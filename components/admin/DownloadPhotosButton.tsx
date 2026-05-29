"use client";

import { useState } from "react";
import { Download } from "lucide-react";

interface Props {
  images: { url: string }[];
  title: string;
}

export default function DownloadPhotosButton({ images, title }: Props) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function download() {
    if (loading || images.length === 0) return;
    setLoading(true);
    setProgress(0);

    for (let i = 0; i < images.length; i++) {
      try {
        const res = await fetch(images[i].url);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        const rawExt = images[i].url.split(".").pop()?.split("?")[0] ?? "jpg";
        const ext = rawExt.length <= 4 ? rawExt : "jpg";
        const safeName = title.slice(0, 40).replace(/[^\wа-яёА-ЯЁіІїЇєЄ]/gi, "_");
        a.download = `${safeName}_${i + 1}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
        setProgress(i + 1);
        await new Promise((r) => setTimeout(r, 400));
      } catch {
        setProgress(i + 1);
      }
    }

    setLoading(false);
    setProgress(0);
  }

  if (images.length === 0) return null;

  return (
    <button
      onClick={download}
      disabled={loading}
      title="Завантажити всі фото"
      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-900 px-3 py-2 rounded-xl hover:bg-gray-100 transition"
    >
      <Download className="w-4 h-4" />
      {loading ? `${progress}/${images.length}` : `Фото (${images.length})`}
    </button>
  );
}

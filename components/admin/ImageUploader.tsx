"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Upload, X, GripVertical, Star, Video } from "lucide-react";
import Image from "next/image";

function isVideo(url: string) {
  return url.endsWith(".mp4") || url.endsWith(".webm") || url.endsWith(".mov");
}

interface UploadedImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface ImageUploaderProps {
  propertyId: string;
  initialImages?: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
}

function SortableImage({
  image,
  onRemove,
  onSetPrimary,
}: {
  image: UploadedImage;
  onRemove: (id: string) => void;
  onSetPrimary: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group aspect-video rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50">
      {isVideo(image.url) ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 gap-1">
          <Video className="w-8 h-8 text-white/60" />
          <span className="text-white/50 text-xs">відео</span>
        </div>
      ) : (
        <Image src={image.url} alt="" fill className="object-cover" sizes="200px" />
      )}

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 bg-white/80 rounded p-1 cursor-grab opacity-0 group-hover:opacity-100 transition"
      >
        <GripVertical className="w-3 h-3 text-gray-600" />
      </div>

      {/* Primary badge */}
      {image.isPrimary && (
        <div className="absolute bottom-2 left-2 bg-gold-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
          Головне
        </div>
      )}

      {/* Actions */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
        <button
          type="button"
          onClick={() => onSetPrimary(image.id)}
          className="bg-white/80 hover:bg-gold-500 hover:text-white rounded p-1 transition"
          title="Зробити головним"
        >
          <Star className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(image.id)}
          className="bg-white/80 hover:bg-red-500 hover:text-white rounded p-1 transition"
          title="Видалити"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default function ImageUploader({
  propertyId,
  initialImages = [],
  onChange,
}: ImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!propertyId || propertyId === "new") {
        alert("Спочатку збережіть нерухомість, потім додайте фото.");
        return;
      }
      setUploading(true);
      const newImages: UploadedImage[] = [];

      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("propertyId", propertyId);

        try {
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          if (res.ok) {
            const data = await res.json();
            newImages.push({
              id: data.id,
              url: data.url,
              isPrimary: images.length === 0 && newImages.length === 0,
            });
          }
        } catch (err) {
          console.error("Upload failed", err);
        }
      }

      const updated = [...images, ...newImages];
      setImages(updated);
      onChange(updated);
      setUploading(false);
    },
    [propertyId, images, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp"],
      "video/mp4": [".mp4"],
    },
    multiple: true,
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);
      const updated = arrayMove(images, oldIndex, newIndex);
      setImages(updated);
      onChange(updated);
    }
  }

  function handleRemove(id: string) {
    const updated = images.filter((img) => img.id !== id);
    if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
      updated[0].isPrimary = true;
    }
    setImages(updated);
    onChange(updated);
  }

  function handleSetPrimary(id: string) {
    const updated = images.map((img) => ({ ...img, isPrimary: img.id === id }));
    setImages(updated);
    onChange(updated);
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
          isDragActive
            ? "border-gold-400 bg-gold-50"
            : "border-gray-300 hover:border-gray-400 bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">
          {uploading
            ? "Завантаження..."
            : isDragActive
            ? "Відпустіть файли тут"
            : "Перетягніть фото або клікніть для вибору"}
        </p>
        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP або MP4 (відео до 100MB)</p>
      </div>

      {/* Images grid */}
      {images.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((image) => (
                <SortableImage
                  key={image.id}
                  image={image}
                  onRemove={handleRemove}
                  onSetPrimary={handleSetPrimary}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

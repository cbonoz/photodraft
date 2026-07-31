"use client";

import { useEffect, useState } from "react";
import type { Photo } from "@/lib/api";

/**
 * A clickable photo thumbnail that opens a closeable lightbox modal.
 * Use it anywhere a photo appears in a grid.
 */
export function PhotoTile({
  photo,
  className = "",
  children,
}: {
  photo: Photo;
  className?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`block w-full h-full cursor-zoom-in ${className}`}
        aria-label={`View ${photo.filename}`}
      >
        {children}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Photo: ${photo.filename}`}
        >
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 text-white text-2xl leading-none hover:bg-black/80 transition-colors flex items-center justify-center z-10"
          >
            &times;
          </button>
          <div
            className="max-w-[92vw] max-h-[85vh] mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photo.url}
              alt={photo.filename}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            <p className="text-center text-sm text-[var(--text-muted)] mt-3 font-mono truncate">
              {photo.filename}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

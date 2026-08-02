import { useEffect, useState } from "react";

interface ImageViewerProps {
  src: string;
  onClose: () => void;
}

export function ImageViewer({ src, onClose }: ImageViewerProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "=" || e.key === "+") setScale((s) => Math.min(s + 0.25, 3));
      if (e.key === "-") setScale((s) => Math.max(s - 0.25, 0.25));
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl z-10"
      >
        ✕
      </button>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 text-white/70 text-sm">
        <button onClick={() => setScale((s) => Math.max(s - 0.25, 0.25))} className="px-2 py-1 hover:bg-white/10 rounded">−</button>
        <span>{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale((s) => Math.min(s + 0.25, 3))} className="px-2 py-1 hover:bg-white/10 rounded">+</button>
        <span className="mx-2">|</span>
        <button onClick={() => setScale(1)} className="px-2 py-1 hover:bg-white/10 rounded">重置</button>
      </div>
      <img
        src={src}
        alt="预览"
        className="max-w-[90vw] max-h-[90vh] object-contain transition-transform duration-200"
        style={{ transform: `scale(${scale})` }}
      />
    </div>
  );
}
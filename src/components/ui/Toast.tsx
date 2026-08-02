import { useEffect, useState } from "react";

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

let toastId = 0;
const listeners: ((t: ToastItem) => void)[] = [];

export function toast(message: string, type: ToastItem["type"] = "info") {
  const item: ToastItem = { id: ++toastId, message, type };
  listeners.forEach((fn) => fn(item));
}

export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (item: ToastItem) => {
      setItems((prev) => [...prev, item]);
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== item.id));
      }, 3000);
    };
    listeners.push(handler);
    return () => {
      const idx = listeners.indexOf(handler);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className={`px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium text-white transition-all ${
            item.type === "success" ? "bg-green-500" :
            item.type === "error" ? "bg-red-500" : "bg-gray-700"
          }`}
        >
          {item.message}
        </div>
      ))}
    </div>
  );
}
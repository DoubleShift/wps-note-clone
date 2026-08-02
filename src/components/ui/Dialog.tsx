import { useEffect, useRef, type ReactNode } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function Dialog({ open, onClose, title, children, actions }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-surface dark:bg-surface-dark rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-text dark:text-text-dark mb-4">{title}</h2>
        <div className="text-text dark:text-text-dark mb-6">{children}</div>
        {actions && <div className="flex justify-end gap-2">{actions}</div>}
      </div>
    </div>
  );
}
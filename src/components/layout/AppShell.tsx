import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { TitleBar } from "./TitleBar";
import { ToastContainer } from "../ui/Toast";
import { useUiStore } from "../../stores/uiStore";
import { useNoteStore } from "../../stores/noteStore";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  onSearch?: () => void;
  onBack?: () => void;
  rightActions?: React.ReactNode;
}

export function AppShell({ children, title = "WPS 便签", onSearch, onBack, rightActions }: AppShellProps) {
  const { isDark, setSearchOpen } = useUiStore();
  const { loadNotes, loadDeletedNotes } = useNoteStore();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => {
    loadNotes();
    loadDeletedNotes();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-surface dark:bg-surface-dark text-text dark:text-text-dark">
      <TitleBar title={title} onSearch={onSearch ?? (() => setSearchOpen(true))} onBack={onBack} rightActions={rightActions} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
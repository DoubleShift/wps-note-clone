import { useState, useEffect, useRef } from "react";
import { useUiStore } from "../../stores/uiStore";
import * as api from "../../lib/tauri";

export function SearchDialog() {
  const { searchOpen, setSearchOpen, setEditingNoteId } = useUiStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // Use Rust FTS5 backend for search
        const notes = await api.listNotes({
          search: query.trim(),
          sort_field: "updated_at",
          sort_order: "desc",
          limit: 20,
        });
        setResults(notes);
      } catch (e) {
        console.error("Search failed:", e);
      } finally {
        setLoading(false);
      }
    }, 200); // debounce
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (id: string) => {
    setSearchOpen(false);
    setEditingNoteId(id);
  };

  if (!searchOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/30"
      onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}
    >
      <div className="bg-surface dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-fade-in">
        <div className="flex items-center px-4 border-b border-border dark:border-border-dark">
          <svg className="w-5 h-5 text-text-secondary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setSearchOpen(false); }}
            placeholder="搜索笔记..."
            className="flex-1 px-3 py-3 bg-transparent border-none outline-none text-text dark:text-text-dark text-sm"
          />
          <kbd className="text-xs text-text-secondary bg-card dark:bg-card-dark px-1.5 py-0.5 rounded">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}
          {!loading && query && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-text-secondary">没有找到匹配的笔记</div>
          )}
          {results.map((note) => (
            <div
              key={note.id}
              onClick={() => handleSelect(note.id)}
              className="px-4 py-3 hover:bg-card dark:hover:bg-card-dark cursor-pointer border-b border-border/50"
            >
              <div className="text-sm font-medium text-text dark:text-text-dark truncate">
                {highlightText(note.title || "无标题", query)}
              </div>
              <div className="text-xs text-text-secondary mt-0.5 line-clamp-1">
                {highlightText(note.content_preview || "暂无内容", query)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="bg-yellow-200 dark:bg-yellow-700 rounded">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}
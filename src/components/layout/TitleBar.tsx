import { Button } from "../ui/Button";
import { useUiStore } from "../../stores/uiStore";

interface TitleBarProps {
  title: string;
  onSearch?: () => void;
  onBack?: () => void;
  rightActions?: React.ReactNode;
}

export function TitleBar({ title, onSearch, onBack, rightActions }: TitleBarProps) {
  const { toggleDark, isDark } = useUiStore();

  return (
    <header className="flex items-center h-12 px-4 border-b border-border dark:border-border-dark bg-surface dark:bg-surface-dark">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {onBack && (
          <button onClick={onBack} className="text-text-secondary hover:text-text p-1 -ml-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        <h1 className="text-base font-semibold text-text dark:text-text-dark truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-1">
        {onSearch && (
          <Button variant="ghost" size="sm" onClick={onSearch} title="搜索 (Ctrl+K)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={toggleDark} title={isDark ? "切换亮色" : "切换暗色"}>
          {isDark ? "☀️" : "🌙"}
        </Button>
        {rightActions}
      </div>
    </header>
  );
}
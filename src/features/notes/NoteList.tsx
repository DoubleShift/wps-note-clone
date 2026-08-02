import { useEffect, useRef } from "react";
import { useNoteStore } from "../../stores/noteStore";
import { useUiStore } from "../../stores/uiStore";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { format } from "../../lib/date";

export function NoteList() {
  const { notes, loading, loadNotes, sortField, sortOrder, setSortField, setSortOrder } = useNoteStore();
  const { setEditingNoteId, setCurrentNoteId } = useUiStore();
  const loaderRef = useRef<HTMLDivElement>(null);

  const grouped = groupNotesByTime(notes);

  const handleNewNote = () => setEditingNoteId("new");
  const handleNewVoice = () => setEditingNoteId("new");

  const handleNoteClick = (id: string) => {
    setCurrentNoteId(id);
    setEditingNoteId(id);
  };

  if (!loading && notes.length === 0) {
    return (
      <div className="h-full flex flex-col relative">
        <div className="flex-1 flex items-center justify-center">
          <EmptyState icon="✏️" title="还没有笔记" description="点击下方按钮创建你的第一条笔记" />
        </div>
        <BottomBar onNewNote={handleNewNote} onNewVoice={handleNewVoice} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* Sort controls */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border dark:border-border-dark">
        <span className="text-xs text-text-secondary font-medium">排序</span>
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as any)}
          className="text-xs border border-border dark:border-border-dark rounded px-2 py-1 bg-transparent text-text dark:text-text-dark"
        >
          <option value="updated_at">更新时间</option>
          <option value="created_at">创建时间</option>
          <option value="title">标题</option>
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          className="text-text-secondary hover:text-text dark:hover:text-text-dark p-1 text-xs"
        >
          {sortOrder === "desc" ? "↓ 最新优先" : "↑ 最早优先"}
        </button>
      </div>

      {/* Note list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          Object.entries(grouped).map(([groupLabel, groupNotes]) => (
            <div key={groupLabel} className="animate-fade-in">
              <h3 className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-2.5 px-1">
                {groupLabel}
              </h3>
              <div className="space-y-2.5">
                {groupNotes.map((note: any) => (
                  <div
                    key={note.id}
                    onClick={() => handleNoteClick(note.id)}
                    className="note-card"
                  >
                    <h4 className="text-base font-medium text-text dark:text-text-dark mb-1 truncate">
                      {note.title || "无标题"}
                    </h4>
                    <p className="text-sm text-text-secondary dark:text-text-secondary-dark line-clamp-2 mb-2 leading-relaxed">
                      {note.content_preview || "暂无内容"}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-text-hint dark:text-text-hint-dark">
                      <span>{format(note.updated_at)}</span>
                      {note.word_count > 0 && <span>{note.word_count} 字</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        <div ref={loaderRef} />
      </div>

      {/* Bottom bar */}
      <BottomBar onNewNote={handleNewNote} onNewVoice={handleNewVoice} />
    </div>
  );
}

function BottomBar({ onNewNote, onNewVoice }: { onNewNote: () => void; onNewVoice: () => void }) {
  return (
    <div className="bottom-bar">
      <button className="bottom-btn" onClick={() => {}}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v8M8 12h8" />
        </svg>
        <span>WPS AI</span>
      </button>
      <button className="bottom-btn bottom-btn-primary" onClick={onNewNote}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
        <span>写笔记</span>
      </button>
      <button className="bottom-btn" onClick={onNewVoice}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
        <span>录音</span>
      </button>
    </div>
  );
}

function groupNotesByTime(notes: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  for (const note of notes) {
    const d = new Date(note.updated_at);
    let label: string;
    if (d >= today) label = "今天";
    else if (d >= yesterday) label = "昨天";
    else if (d >= weekAgo) label = "过去 7 天";
    else label = "更早";
    if (!groups[label]) groups[label] = [];
    groups[label].push(note);
  }
  return groups;
}
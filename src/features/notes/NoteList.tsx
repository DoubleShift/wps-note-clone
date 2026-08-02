import { useEffect, useRef, useCallback } from "react";
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

  const handleNewNote = async () => {
    setEditingNoteId("new");
  };

  const handleNoteClick = (id: string) => {
    setCurrentNoteId(id);
    setEditingNoteId(id);
  };

  if (!loading && notes.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border dark:border-border-dark">
          <h2 className="text-sm font-medium text-text-secondary">全部笔记</h2>
          <div className="flex items-center gap-2">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="text-xs border border-border dark:border-border-dark rounded px-2 py-1 bg-transparent"
            >
              <option value="updated_at">更新时间</option>
              <option value="created_at">创建时间</option>
              <option value="title">标题</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="text-text-secondary hover:text-text p-1"
              title={sortOrder === "desc" ? "降序" : "升序"}
            >
              {sortOrder === "desc" ? "↓" : "↑"}
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon="✏️"
            title="还没有笔记"
            description="点击下方按钮创建你的第一条笔记"
            action={<Button onClick={handleNewNote}>新建笔记</Button>}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border dark:border-border-dark">
        <h2 className="text-sm font-medium text-text-secondary">全部笔记</h2>
        <div className="flex items-center gap-2">
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as any)}
            className="text-xs border border-border dark:border-border-dark rounded px-2 py-1 bg-transparent"
          >
            <option value="updated_at">更新时间</option>
            <option value="created_at">创建时间</option>
            <option value="title">标题</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="text-text-secondary hover:text-text p-1"
          >
            {sortOrder === "desc" ? "↓" : "↑"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          Object.entries(grouped).map(([groupLabel, groupNotes]) => (
            <div key={groupLabel}>
              <h3 className="text-xs font-medium text-text-secondary mb-2 px-1">{groupLabel}</h3>
              <div className="space-y-2">
                {groupNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => handleNoteClick(note.id)}
                    className="p-3 rounded-xl bg-card dark:bg-card-dark hover:shadow-sm transition-shadow cursor-pointer border border-transparent hover:border-border"
                  >
                    <h4 className="text-sm font-medium text-text dark:text-text-dark mb-1 truncate">
                      {note.title || "无标题"}
                    </h4>
                    <p className="text-xs text-text-secondary line-clamp-2 mb-1.5">
                      {note.content_preview || "暂无内容"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
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

      {/* Floating new note button */}
      <div className="absolute bottom-6 right-6">
        <button
          onClick={handleNewNote}
          className="w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:bg-primary-dark transition-colors flex items-center justify-center text-2xl"
        >
          +
        </button>
      </div>
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
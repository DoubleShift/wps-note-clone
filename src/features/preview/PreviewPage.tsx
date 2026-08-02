import { useState, useEffect } from "react";
import { ReadOnlyEditor } from "../../components/editor/Editor";
import { AppShell } from "../../components/layout/AppShell";
import { useNoteStore } from "../../stores/noteStore";
import { useUiStore } from "../../stores/uiStore";
import { Button } from "../../components/ui/Button";
import { toast } from "../../components/ui/Toast";
import * as api from "../../lib/tauri";

export function PreviewPage() {
  const { currentNoteId, setEditingNoteId, setCurrentNoteId } = useUiStore();
  const { notes, deleteNote, loadNotes } = useNoteStore();
  const [note, setNote] = useState<any>(null);

  useEffect(() => {
    if (currentNoteId) {
      const found = notes.find((n) => n.id === currentNoteId);
      if (found) setNote(found);
    }
  }, [currentNoteId, notes]);

  const handleDelete = async () => {
    if (!note) return;
    await deleteNote(note.id);
    toast("笔记已移至回收站", "success");
    setCurrentNoteId(null);
  };

  if (!note) return null;

  return (
    <AppShell
      title={note.title || "无标题"}
      onBack={() => setCurrentNoteId(null)}
      rightActions={
        <>
          <Button variant="ghost" size="sm" onClick={() => setEditingNoteId(note.id)}>
            ✏️ 编辑
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete}>
            🗑️ 删除
          </Button>
        </>
      }
    >
      <div className="max-w-3xl mx-auto">
        <div className="px-4 pt-4 pb-2 border-b border-border dark:border-border-dark">
          <h1 className="text-xl font-bold text-text dark:text-text-dark">{note.title || "无标题"}</h1>
          <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
            <span>创建于 {new Date(note.created_at).toLocaleString()}</span>
            <span>更新于 {new Date(note.updated_at).toLocaleString()}</span>
            {note.word_count > 0 && <span>{note.word_count} 字</span>}
          </div>
        </div>
        <ReadOnlyEditor json={note.content_json} />
      </div>
    </AppShell>
  );
}
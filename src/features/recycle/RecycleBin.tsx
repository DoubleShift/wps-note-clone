import { useEffect, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Dialog } from "../../components/ui/Dialog";
import { toast } from "../../components/ui/Toast";
import { useNoteStore } from "../../stores/noteStore";
import { useUiStore } from "../../stores/uiStore";
import { format } from "../../lib/date";

export function RecycleBin() {
  const { deletedNotes, loadDeletedNotes, restoreNote, permanentDelete } = useNoteStore();
  const { setCurrentPage } = useUiStore();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    loadDeletedNotes();
  }, []);

  const handleRestore = async (id: string) => {
    await restoreNote(id);
    toast("笔记已恢复", "success");
  };

  const handlePermanentDelete = async (id: string) => {
    await permanentDelete(id);
    setConfirmDelete(null);
    toast("笔记已永久删除", "success");
  };

  return (
    <AppShell title="回收站" onBack={() => setCurrentPage("notes")}>
      <div className="p-4">
        {deletedNotes.length === 0 ? (
          <EmptyState icon="🗑️" title="回收站为空" description="删除的笔记会出现在这里" />
        ) : (
          <div className="space-y-2">
            {deletedNotes.map((note) => (
              <div
                key={note.id}
                className="p-3 rounded-xl bg-card dark:bg-card-dark border border-border"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 mr-3">
                    <h4 className="text-sm font-medium truncate text-text dark:text-text-dark">
                      {note.title || "无标题"}
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      删除于 {note.deleted_at ? format(note.deleted_at) : "未知"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="secondary" size="sm" onClick={() => handleRestore(note.id)}>
                      恢复
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(note.id)}>
                      <span className="text-red-500">永久删除</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="确认永久删除"
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>取消</Button>
            <Button variant="danger" onClick={() => confirmDelete && handlePermanentDelete(confirmDelete)}>
              确认删除
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">此操作不可撤销，笔记将被永久删除。</p>
      </Dialog>
    </AppShell>
  );
}
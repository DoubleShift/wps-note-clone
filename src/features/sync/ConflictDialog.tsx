import { Dialog } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";

interface ConflictInfo {
  noteId: string;
  title: string;
  localUpdatedAt: string;
  remoteUpdatedAt: string;
}

interface ConflictDialogProps {
  conflict: ConflictInfo | null;
  onResolve: (action: "local" | "remote" | "merge") => void;
  onClose: () => void;
}

export function ConflictDialog({ conflict, onResolve, onClose }: ConflictDialogProps) {
  if (!conflict) return null;

  return (
    <Dialog
      open={!!conflict}
      onClose={onClose}
      title="同步冲突"
      actions={
        <>
          <Button variant="secondary" onClick={() => onResolve("local")}>
            保留本地版本
          </Button>
          <Button variant="primary" onClick={() => onResolve("remote")}>
            使用云端版本
          </Button>
          <Button variant="ghost" onClick={() => onResolve("merge")}>
            合并
          </Button>
        </>
      }
    >
      <div className="text-sm space-y-3">
        <p className="text-text dark:text-text-dark">
          笔记 <strong>"{conflict.title}"</strong> 在本地和云端同时被修改：
        </p>
        <div className="bg-card dark:bg-card-dark rounded-lg p-3 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-text-secondary">本地更新</span>
            <span className="text-text">{new Date(conflict.localUpdatedAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">云端更新</span>
            <span className="text-text">{new Date(conflict.remoteUpdatedAt).toLocaleString()}</span>
          </div>
        </div>
        <p className="text-text-secondary text-xs">请选择要保留的版本：</p>
      </div>
    </Dialog>
  );
}
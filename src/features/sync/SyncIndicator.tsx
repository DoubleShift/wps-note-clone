import { useState, useEffect } from "react";
import * as api from "../../lib/tauri";

type SyncStatus = "idle" | "syncing" | "error" | "configured";

export function SyncIndicator() {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [syncedCount, setSyncedCount] = useState(0);

  useEffect(() => {
    api.getSetting("notion_token").then((token) => {
      if (token) {
        setStatus("configured");
        api.listNotes({ limit: 9999 }).then((notes) => {
          setSyncedCount(notes.filter((n) => n.is_synced).length);
        }).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const handleSync = async () => {
    setStatus("syncing");
    try {
      const count = await api.notionSyncNotes();
      setSyncedCount((prev) => prev + count);
      setStatus("configured");
    } catch {
      setStatus("error");
    }
  };

  if (status === "idle") return null;

  return (
    <button
      onClick={handleSync}
      disabled={status === "syncing"}
      className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg hover:bg-card dark:hover:bg-card-dark transition-colors disabled:opacity-50"
      title={status === "configured" ? `已同步 ${syncedCount} 条` : status === "syncing" ? "同步中..." : "同步失败，点击重试"}
    >
      <span className={
        status === "syncing" ? "animate-spin" :
        status === "error" ? "text-red-500" :
        "text-green-500"
      }>
        {status === "syncing" ? "⟳" : status === "error" ? "⚠" : "☁"}
      </span>
      <span className="text-text-secondary">
        {status === "syncing" ? "同步中" : status === "error" ? "失败" : `${syncedCount}`}
      </span>
    </button>
  );
}
import { useState, useEffect } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { Button } from "../../components/ui/Button";
import { toast } from "../../components/ui/Toast";
import { useUiStore } from "../../stores/uiStore";
import * as api from "../../lib/tauri";

export function ProfilePage() {
  const { setCurrentPage } = useUiStore();
  const [notionName, setNotionName] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [noteCount, setNoteCount] = useState(0);
  const [syncedCount, setSyncedCount] = useState(0);

  useEffect(() => {
    api.getSetting("notion_token").then((v) => {
      setHasToken(!!v);
      if (v) {
        api.notionVerify().then(setNotionName).catch(() => setNotionName(null));
      }
    });
    api.listNotes({ limit: 9999 }).then((notes) => {
      setNoteCount(notes.length);
      setSyncedCount(notes.filter((n) => n.is_synced).length);
    }).catch(() => {});
  }, []);

  const handleSync = async () => {
    try {
      const count = await api.notionSyncNotes();
      toast(`同步完成！${count} 条笔记已同步`, "success");
    } catch (e: any) {
      toast(e.message, "error");
    }
  };

  const handleLogout = () => {
    api.setSetting("notion_token", "");
    api.setSetting("notion_database_id", "");
    setHasToken(false);
    setNotionName(null);
    toast("已退出登录", "success");
  };

  return (
    <AppShell title="个人中心" onBack={() => setCurrentPage("notes")}>
      <div className="max-w-lg mx-auto p-4 space-y-6 pt-8">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-bold">
            {notionName ? notionName[0].toUpperCase() : "?"}
          </div>
          <h2 className="text-lg font-semibold text-text dark:text-text-dark mt-3">
            {notionName || "未登录"}
          </h2>
          <p className="text-sm text-text-secondary">
            {hasToken ? "Notion 已连接" : "仅本地模式"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card dark:bg-card-dark rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-text dark:text-text-dark">{noteCount}</div>
            <div className="text-xs text-text-secondary mt-1">笔记总数</div>
          </div>
          <div className="bg-card dark:bg-card-dark rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary">{syncedCount}</div>
            <div className="text-xs text-text-secondary mt-1">已同步</div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-card dark:bg-card-dark rounded-xl p-4 space-y-3">
          {hasToken ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text dark:text-text-dark">Notion 连接</span>
                <span className="text-green-500">● 已连接</span>
              </div>
              <Button onClick={handleSync} className="w-full">
                ☁️ 手动同步到 Notion
              </Button>
              <Button onClick={handleLogout} variant="ghost" className="w-full text-red-500">
                断开 Notion 连接
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-text-secondary text-center py-2">
                连接 Notion 后可实现多设备同步
              </p>
              <Button onClick={() => setCurrentPage("login")} className="w-full">
                🔗 去连接 Notion
              </Button>
            </>
          )}
        </div>

        {/* Info */}
        <div className="bg-card dark:bg-card-dark rounded-xl p-4 space-y-2 text-sm text-text dark:text-text-dark">
          <div className="flex justify-between">
            <span className="text-text-secondary">版本</span>
            <span>0.1.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">数据存储</span>
            <span>本地 SQLite</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">同步方式</span>
            <span>Notion API</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
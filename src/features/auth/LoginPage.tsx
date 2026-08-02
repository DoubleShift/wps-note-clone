import { useState, useEffect } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { Button } from "../../components/ui/Button";
import { toast } from "../../components/ui/Toast";
import { useUiStore } from "../../stores/uiStore";
import * as api from "../../lib/tauri";

export function LoginPage() {
  const { setCurrentPage } = useUiStore();
  const [token, setToken] = useState("");
  const [dbId, setDbId] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [userName, setUserName] = useState("");

  // Load existing config
  useEffect(() => {
    api.getSetting("notion_token").then((v) => { if (v) setToken(v); });
    api.getSetting("notion_database_id").then((v) => { if (v) setDbId(v); });
  }, []);

  const handleVerify = async () => {
    if (!token.trim()) {
      toast("请输入 Notion Integration Token", "error");
      return;
    }
    setLoading(true);
    try {
      await api.notionConfigure(token.trim(), dbId.trim() || null);
      const name = await api.notionVerify();
      setUserName(name);
      setVerified(true);
      toast(`验证成功！欢迎 ${name}`, "success");
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.notionConfigure(token.trim(), dbId.trim() || null);
      toast("配置已保存", "success");
      setCurrentPage("notes");
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="登录" onBack={() => setCurrentPage("notes")}>
      <div className="max-w-md mx-auto p-4 space-y-6 pt-8">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-text dark:text-text-dark">连接 Notion</h2>
          <p className="text-sm text-text-secondary mt-1">输入 Notion Integration Token 来同步笔记</p>
        </div>

        <div className="bg-card dark:bg-card-dark rounded-xl p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text dark:text-text-dark mb-1">
              Integration Token
            </label>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="secret_xxxxxxxxxxxxxx"
              type="password"
              className="w-full px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-transparent text-sm"
            />
            <p className="text-xs text-text-secondary mt-1">
              在 <a href="https://www.notion.so/my-integrations" target="_blank" className="text-primary">Notion Integrations</a> 创建
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text dark:text-text-dark mb-1">
              Database ID <span className="text-text-secondary">(可选)</span>
            </label>
            <input
              value={dbId}
              onChange={(e) => setDbId(e.target.value)}
              placeholder="留空则自动创建"
              className="w-full px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-transparent text-sm"
            />
          </div>

          <Button onClick={handleVerify} disabled={loading} className="w-full">
            {loading ? "验证中..." : verified ? "✅ 已验证" : "验证 Token"}
          </Button>

          {verified && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-sm text-green-700 dark:text-green-300">
              已连接为 <strong>{userName}</strong>
            </div>
          )}
        </div>

        {verified && (
          <Button onClick={handleSave} variant="primary" className="w-full" disabled={loading}>
            {loading ? "保存中..." : "💾 保存并开始同步"}
          </Button>
        )}

        <div className="text-xs text-text-secondary text-center">
          不会配置？<a href="https://www.notion.so/help/create-integrations-with-the-notion-api" target="_blank" className="text-primary">查看教程</a>
        </div>
      </div>
    </AppShell>
  );
}
import { useState, useEffect } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { Button } from "../../components/ui/Button";
import { useUiStore } from "../../stores/uiStore";
import { toast } from "../../components/ui/Toast";
import * as api from "../../lib/tauri";

export function SettingsPage() {
  const { isDark, toggleDark, setCurrentPage } = useUiStore();
  const [fontSizeBody, setFontSizeBody] = useState(16);
  const [fontSizeTitle, setFontSizeTitle] = useState(18);
  const [sortField, setSortField] = useState("updated_at");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    api.getAllSettings().then((settings) => {
      for (const s of settings) {
        if (s.key === "font_size_body") setFontSizeBody(parseInt(s.value) || 16);
        if (s.key === "font_size_title") setFontSizeTitle(parseInt(s.value) || 18);
        if (s.key === "default_sort_field") setSortField(s.value);
        if (s.key === "default_sort_order") setSortOrder(s.value);
      }
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    await Promise.all([
      api.setSetting("font_size_body", fontSizeBody.toString()),
      api.setSetting("font_size_title", fontSizeTitle.toString()),
      api.setSetting("default_sort_field", sortField),
      api.setSetting("default_sort_order", sortOrder),
    ]);
    toast("设置已保存", "success");
  };

  return (
    <AppShell title="设置" onBack={() => setCurrentPage("notes")}>
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* 外观 */}
        <section>
          <h3 className="text-sm font-medium text-text-secondary mb-3">外观</h3>
          <div className="bg-card dark:bg-card-dark rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text dark:text-text-dark">深色模式</span>
              <button
                onClick={toggleDark}
                className={`relative w-10 h-5 rounded-full transition-colors ${isDark ? "bg-primary" : "bg-gray-300"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isDark ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>
        </section>

        {/* 字体 */}
        <section>
          <h3 className="text-sm font-medium text-text-secondary mb-3">字体</h3>
          <div className="bg-card dark:bg-card-dark rounded-xl p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text dark:text-text-dark">正文字号</span>
                <span className="text-xs text-text-secondary">{fontSizeBody}px</span>
              </div>
              <input
                type="range"
                min="12"
                max="24"
                value={fontSizeBody}
                onChange={(e) => setFontSizeBody(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text dark:text-text-dark">标题字号</span>
                <span className="text-xs text-text-secondary">{fontSizeTitle}px</span>
              </div>
              <input
                type="range"
                min="14"
                max="28"
                value={fontSizeTitle}
                onChange={(e) => setFontSizeTitle(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>
        </section>

        {/* 排序 */}
        <section>
          <h3 className="text-sm font-medium text-text-secondary mb-3">笔记排序</h3>
          <div className="bg-card dark:bg-card-dark rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text dark:text-text-dark">排序方式</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="text-sm border border-border dark:border-border-dark rounded px-2 py-1 bg-transparent"
              >
                <option value="updated_at">更新时间</option>
                <option value="created_at">创建时间</option>
                <option value="title">标题</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text dark:text-text-dark">排序方向</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="text-sm border border-border dark:border-border-dark rounded px-2 py-1 bg-transparent"
              >
                <option value="desc">降序（最新优先）</option>
                <option value="asc">升序（最早优先）</option>
              </select>
            </div>
          </div>
        </section>

        {/* 关于 */}
        <section>
          <h3 className="text-sm font-medium text-text-secondary mb-3">关于</h3>
          <div className="bg-card dark:bg-card-dark rounded-xl p-4 space-y-2 text-sm text-text dark:text-text-dark">
            <div className="flex justify-between"><span>版本</span><span className="text-text-secondary">0.1.0</span></div>
            <div className="flex justify-between"><span>技术栈</span><span className="text-text-secondary">Tauri + React + Rust</span></div>
            <div className="pt-2">
              <a href="#" className="text-primary hover:underline text-sm">隐私政策</a>
              <span className="mx-2 text-text-secondary">·</span>
              <a href="#" className="text-primary hover:underline text-sm">反馈建议</a>
            </div>
          </div>
        </section>

        <Button onClick={handleSave} className="w-full">保存设置</Button>
      </div>
    </AppShell>
  );
}
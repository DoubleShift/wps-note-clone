import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { useNoteStore } from "../../stores/noteStore";
import { useUiStore } from "../../stores/uiStore";
import * as api from "../../lib/tauri";
import type { Group } from "../../types";

export function Sidebar() {
  const { selectedGroupId, setSelectedGroupId } = useNoteStore();
  const { sidebarOpen, toggleSidebar, viewMode, setViewMode } = useUiStore();
  const [groups, setGroups] = useState<Group[]>([]);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  useEffect(() => {
    api.listGroups().then(setGroups).catch(() => {});
  }, []);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    await api.createGroup(newGroupName.trim());
    setNewGroupName("");
    setShowNewGroup(false);
    const updated = await api.listGroups();
    setGroups(updated);
  };

  const handleSelectGroup = (id: string | null) => {
    setSelectedGroupId(id);
  };

  if (!sidebarOpen) return null;

  return (
    <aside className="w-56 border-r border-border dark:border-border-dark bg-surface dark:bg-surface-dark flex flex-col shrink-0">
      <div className="p-3 border-b border-border dark:border-border-dark">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleSidebar}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </Button>
          <span className="text-sm font-medium text-text dark:text-text-dark">WPS 便签</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <button
          onClick={() => handleSelectGroup(null)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
            selectedGroupId === null
              ? "bg-primary/10 text-primary font-medium"
              : "text-text dark:text-text-dark hover:bg-card dark:hover:bg-card-dark"
          }`}
        >
          📋 全部笔记
        </button>
        <button
          onClick={() => setViewMode(viewMode === "list" ? "calendar" : "list")}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
            viewMode === "calendar"
              ? "bg-primary/10 text-primary font-medium"
              : "text-text dark:text-text-dark hover:bg-card dark:hover:bg-card-dark"
          }`}
        >
          📅 日历视图
        </button>

        <div className="mt-4 mb-1 px-3 flex items-center justify-between">
          <span className="text-xs font-medium text-text-secondary uppercase">分组</span>
          <button
            onClick={() => setShowNewGroup(true)}
            className="text-text-secondary hover:text-text p-0.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>

        {showNewGroup && (
          <div className="px-2 py-1">
            <input
              autoFocus
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateGroup(); if (e.key === "Escape") setShowNewGroup(false); }}
              placeholder="分组名称"
              className="w-full px-2 py-1.5 text-sm border border-border dark:border-border-dark rounded bg-transparent"
            />
          </div>
        )}

        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => handleSelectGroup(group.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedGroupId === group.id
                ? "bg-primary/10 text-primary font-medium"
                : "text-text dark:text-text-dark hover:bg-card dark:hover:bg-card-dark"
            }`}
          >
            📁 {group.name}
          </button>
        ))}
      </nav>

      <div className="p-2 border-t border-border dark:border-border-dark">
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => useUiStore.getState().setCurrentPage("settings")}>
          ⚙️ 设置
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => useUiStore.getState().setCurrentPage("recycle")}>
          🗑️ 回收站
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => useUiStore.getState().setCurrentPage("login")}>
          🔗 连接 Notion
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => useUiStore.getState().setCurrentPage("profile")}>
          👤 个人中心
        </Button>
      </div>
    </aside>
  );
}
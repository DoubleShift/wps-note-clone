import { useEffect, useState } from "react";
import { Editor } from "../../components/editor/Editor";
import { AppShell } from "../../components/layout/AppShell";
import { useNoteStore } from "../../stores/noteStore";
import { useUiStore } from "../../stores/uiStore";
import { Button } from "../../components/ui/Button";
import { toast } from "../../components/ui/Toast";
import * as api from "../../lib/tauri";

export function EditorPage() {
  const { editingNoteId, setEditingNoteId } = useUiStore();
  const { notes, createNote, updateNote } = useNoteStore();
  const [title, setTitle] = useState("");
  const [contentJson, setContentJson] = useState("");
  const [saving, setSaving] = useState(false);

  const isNew = editingNoteId === "new";
  const existingNote = isNew ? null : notes.find((n) => n.id === editingNoteId);

  useEffect(() => {
    if (existingNote) {
      setTitle(existingNote.title);
      setContentJson(existingNote.content_json);
    } else if (isNew) {
      setTitle("");
      setContentJson(JSON.stringify({ root: { children: [{ type: "paragraph", children: [] }], direction: "ltr" } }));
    }
  }, [editingNoteId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isNew) {
        const note = await createNote(title || "无标题", contentJson, extractPreview(contentJson));
        setEditingNoteId(note.id);
        toast("笔记已创建", "success");
      } else if (editingNoteId) {
        await updateNote(editingNoteId, { title, contentJson, contentPreview: extractPreview(contentJson) });
        toast("笔记已保存", "success");
      }
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (json: string, preview: string) => {
    setContentJson(json);
  };

  return (
    <AppShell
      title={title || "新笔记"}
      onBack={() => setEditingNoteId(null)}
      rightActions={
        <>
          <Button variant="ghost" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "保存中..." : "💾 保存"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col h-full">
        <div className="px-4 pt-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="笔记标题"
            className="w-full text-xl font-semibold bg-transparent border-none outline-none text-text dark:text-text-dark placeholder-text-secondary"
          />
        </div>
        <div className="flex-1">
          <Editor initialJson={contentJson} onChange={handleChange} />
        </div>
      </div>
    </AppShell>
  );
}

function extractPreview(json: string): string {
  try {
    const parsed = JSON.parse(json);
    const texts: string[] = [];
    function walk(node: any) {
      if (node.text) texts.push(node.text);
      if (node.children) node.children.forEach(walk);
    }
    if (parsed.root?.children) parsed.root.children.forEach(walk);
    return texts.join(" ").slice(0, 200);
  } catch { return ""; }
}
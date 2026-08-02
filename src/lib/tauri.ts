import { invoke } from "@tauri-apps/api/core";
import type { Note, Group, Setting, NoteListParams, CreateNoteRequest, UpdateNoteRequest } from "../types";

// === Notes ===

export async function createNote(req: CreateNoteRequest): Promise<Note> {
  const res: any = await invoke("create_note", { req });
  if (!res.success) throw new Error(res.error);
  return res.data;
}

export async function updateNote(req: UpdateNoteRequest): Promise<Note | null> {
  const res: any = await invoke("update_note", { req });
  if (!res.success) throw new Error(res.error);
  return res.data ?? null;
}

export async function getNote(id: string): Promise<Note | null> {
  const res: any = await invoke("get_note", { id });
  if (!res.success) throw new Error(res.error);
  return res.data ?? null;
}

export async function listNotes(params: Partial<NoteListParams> = {}): Promise<Note[]> {
  const res: any = await invoke("list_notes", {
    params: { sort_field: "updated_at", sort_order: "desc", ...params },
  });
  if (!res.success) throw new Error(res.error);
  return res.data ?? [];
}

export async function softDeleteNote(id: string): Promise<boolean> {
  const res: any = await invoke("soft_delete_note", { id });
  if (!res.success) throw new Error(res.error);
  return res.data;
}

export async function restoreNote(id: string): Promise<boolean> {
  const res: any = await invoke("restore_note", { id });
  if (!res.success) throw new Error(res.error);
  return res.data;
}

export async function permanentDeleteNote(id: string): Promise<boolean> {
  const res: any = await invoke("permanent_delete_note", { id });
  if (!res.success) throw new Error(res.error);
  return res.data;
}

export async function listDeletedNotes(): Promise<Note[]> {
  const res: any = await invoke("list_deleted_notes");
  if (!res.success) throw new Error(res.error);
  return res.data ?? [];
}

// === Groups ===

export async function createGroup(name: string): Promise<Group> {
  const res: any = await invoke("create_group", { name });
  if (!res.success) throw new Error(res.error);
  return res.data;
}

export async function listGroups(): Promise<Group[]> {
  const res: any = await invoke("list_groups");
  if (!res.success) throw new Error(res.error);
  return res.data ?? [];
}

export async function updateGroup(id: string, name: string): Promise<boolean> {
  const res: any = await invoke("update_group", { id, name });
  if (!res.success) throw new Error(res.error);
  return res.data;
}

export async function deleteGroup(id: string): Promise<boolean> {
  const res: any = await invoke("delete_group", { id });
  if (!res.success) throw new Error(res.error);
  return res.data;
}

// === Settings ===

export async function getSetting(key: string): Promise<string | null> {
  const res: any = await invoke("get_setting", { key });
  if (!res.success) throw new Error(res.error);
  return res.data ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const res: any = await invoke("set_setting", { key, value });
  if (!res.success) throw new Error(res.error);
}

export async function getAllSettings(): Promise<Setting[]> {
  const res: any = await invoke("get_all_settings");
  if (!res.success) throw new Error(res.error);
  return res.data ?? [];
}

// === Images ===

export async function saveImage(noteId: string, imageData: number[]): Promise<string> {
  const res: any = await invoke("save_image", { noteId, imageData });
  if (!res.success) throw new Error(res.error);
  return res.data;
}

export async function getImagePath(relativePath: string): Promise<string> {
  const res: any = await invoke("get_image_path", { relativePath });
  if (!res.success) throw new Error(res.error);
  return res.data;
}

// === Notion Sync ===

export async function notionConfigure(token: string, databaseId: string | null): Promise<void> {
  const res: any = await invoke("notion_configure", { token, databaseId });
  if (!res.success) throw new Error(res.error);
}

export async function notionGetConfig(): Promise<{ token: string; database_id: string | null }> {
  const res: any = await invoke("notion_get_config");
  if (!res.success) throw new Error(res.error);
  return res.data;
}

export async function notionVerify(): Promise<string> {
  const res: any = await invoke("notion_verify");
  if (!res.success) throw new Error(res.error);
  return res.data;
}

export async function notionSyncNotes(): Promise<number> {
  const res: any = await invoke("notion_sync_notes");
  if (!res.success) throw new Error(res.error);
  return res.data;
}
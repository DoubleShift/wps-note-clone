import { create } from "zustand";
import type { Note, NoteListParams, SortField, SortOrder } from "../types";
import * as api from "../lib/tauri";

interface NoteState {
  notes: Note[];
  deletedNotes: Note[];
  loading: boolean;
  error: string | null;
  sortField: SortField;
  sortOrder: SortOrder;
  searchQuery: string;
  selectedGroupId: string | null;

  // Actions
  loadNotes: (params?: Partial<NoteListParams>) => Promise<void>;
  loadDeletedNotes: () => Promise<void>;
  createNote: (title: string, contentJson: string, contentPreview: string, groupId?: string) => Promise<Note>;
  updateNote: (id: string, updates: { title?: string; contentJson?: string; contentPreview?: string }) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  permanentDelete: (id: string) => Promise<void>;
  setSortField: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  setSearchQuery: (query: string) => void;
  setSelectedGroupId: (id: string | null) => void;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  deletedNotes: [],
  loading: false,
  error: null,
  sortField: "updated_at",
  sortOrder: "desc",
  searchQuery: "",
  selectedGroupId: null,

  loadNotes: async (params) => {
    set({ loading: true, error: null });
    try {
      const { sortField, sortOrder, searchQuery, selectedGroupId } = get();
      const notes = await api.listNotes({
        sort_field: sortField,
        sort_order: sortOrder,
        search: searchQuery || undefined,
        group_id: selectedGroupId || undefined,
        ...params,
      });
      set({ notes, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  loadDeletedNotes: async () => {
    try {
      const deletedNotes = await api.listDeletedNotes();
      set({ deletedNotes });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  createNote: async (title, contentJson, contentPreview, groupId) => {
    const note = await api.createNote({
      title,
      content_json: contentJson,
      content_preview: contentPreview,
      group_id: groupId || null,
    });
    await get().loadNotes();
    return note;
  },

  updateNote: async (id, updates) => {
    await api.updateNote({ id, ...updates });
    await get().loadNotes();
  },

  deleteNote: async (id) => {
    await api.softDeleteNote(id);
    await get().loadNotes();
  },

  restoreNote: async (id) => {
    await api.restoreNote(id);
    await get().loadDeletedNotes();
    await get().loadNotes();
  },

  permanentDelete: async (id) => {
    await api.permanentDeleteNote(id);
    await get().loadDeletedNotes();
  },

  setSortField: (field) => {
    set({ sortField: field });
    get().loadNotes();
  },

  setSortOrder: (order) => {
    set({ sortOrder: order });
    get().loadNotes();
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().loadNotes();
  },

  setSelectedGroupId: (id) => {
    set({ selectedGroupId: id });
    get().loadNotes();
  },
}));
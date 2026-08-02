import { create } from "zustand";
import type { ViewMode } from "../types";

type Page = "notes" | "settings" | "recycle" | "login" | "profile";

interface UiState {
  viewMode: ViewMode;
  isDark: boolean;
  sidebarOpen: boolean;
  searchOpen: boolean;
  currentNoteId: string | null;
  editingNoteId: string | null;
  currentPage: Page;

  setViewMode: (mode: ViewMode) => void;
  toggleDark: () => void;
  setDark: (dark: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setCurrentNoteId: (id: string | null) => void;
  setEditingNoteId: (id: string | null) => void;
  setCurrentPage: (page: Page) => void;
}

export const useUiStore = create<UiState>((set) => ({
  viewMode: "list",
  isDark: window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false,
  sidebarOpen: true,
  searchOpen: false,
  currentNoteId: null,
  editingNoteId: null,
  currentPage: "notes",

  setViewMode: (mode) => set({ viewMode: mode }),
  toggleDark: () => set((s) => {
    const newDark = !s.isDark;
    document.documentElement.classList.toggle("dark", newDark);
    return { isDark: newDark };
  }),
  setDark: (dark) => {
    document.documentElement.classList.toggle("dark", dark);
    set({ isDark: dark });
  },
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setCurrentNoteId: (id) => set({ currentNoteId: id, currentPage: "notes" }),
  setEditingNoteId: (id) => set({ editingNoteId: id, currentPage: "notes" }),
  setCurrentPage: (page) => set({ currentPage: page, currentNoteId: null, editingNoteId: null }),
}));
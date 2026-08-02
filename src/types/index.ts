// === Data Models ===

export interface Note {
  id: string;
  title: string;
  content_json: string;  // Lexical EditorState JSON
  content_preview: string;
  type: 'text' | 'voice';
  group_id: string | null;
  is_deleted: boolean;
  is_synced: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  synced_at: string | null;
  word_count: number;
}

export interface Group {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Setting {
  key: string;
  value: string;
}

export interface Account {
  id: string;
  provider: 'notion' | 'local';
  token: string;
  nickname: string;
  avatar: string;
  is_active: boolean;
}

// === Sort & Filter ===

export type SortField = 'updated_at' | 'created_at' | 'title';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'list' | 'calendar';

export interface NoteListParams {
  group_id?: string | null;
  is_deleted?: boolean;
  search?: string;
  sort_field: SortField;
  sort_order: SortOrder;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

// === IPC Request Types ===

export interface CreateNoteRequest {
  title: string;
  content_json: string;
  content_preview: string;
  group_id?: string | null;
  note_type?: string;
}

export interface UpdateNoteRequest {
  id: string;
  title?: string;
  content_json?: string;
  content_preview?: string;
  group_id?: string | null;
}

// === Settings Keys ===

export const SETTINGS = {
  DEFAULT_SORT_FIELD: 'default_sort_field',
  DEFAULT_SORT_ORDER: 'default_sort_order',
  DEFAULT_VIEW: 'default_view',
  THEME: 'theme',
  FONT_SIZE_TITLE: 'font_size_title',
  FONT_SIZE_BODY: 'font_size_body',
  SYNC_INTERVAL: 'sync_interval',
} as const;

// === IPC Response ===

export interface IpcResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
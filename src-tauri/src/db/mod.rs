use rusqlite::{Connection, Result, params};
use std::sync::Mutex;
use crate::models::{Note, Group, Setting, NoteListParams};

pub struct Database {
    pub conn: Mutex<Connection>,
}


impl Database {
    pub fn new(db_path: &str) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        let db = Self { conn: Mutex::new(conn) };
        db.migrate()?;
        Ok(db)
    }

    fn migrate(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch("
            CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL DEFAULT '',
                content_json TEXT NOT NULL DEFAULT '{}',
                content_preview TEXT NOT NULL DEFAULT '',
                type TEXT NOT NULL DEFAULT 'text',
                group_id TEXT,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                is_synced INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                deleted_at TEXT,
                synced_at TEXT,
                word_count INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS groups (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS accounts (
                id TEXT PRIMARY KEY,
                provider TEXT NOT NULL,
                token TEXT NOT NULL DEFAULT '',
                nickname TEXT NOT NULL DEFAULT '',
                avatar TEXT NOT NULL DEFAULT '',
                is_active INTEGER NOT NULL DEFAULT 0
            );

            CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
                title, content_preview, content='notes', content_rowid='rowid'
            );

            CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
                INSERT INTO notes_fts(rowid, title, content_preview)
                VALUES (new.rowid, new.title, new.content_preview);
            END;

            CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
                INSERT INTO notes_fts(notes_fts, rowid, title, content_preview)
                VALUES ('delete', old.rowid, old.title, old.content_preview);
            END;

            CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
                INSERT INTO notes_fts(notes_fts, rowid, title, content_preview)
                VALUES ('delete', old.rowid, old.title, old.content_preview);
                INSERT INTO notes_fts(rowid, title, content_preview)
                VALUES (new.rowid, new.title, new.content_preview);
            END;

            INSERT OR IGNORE INTO settings (key, value) VALUES
                ('default_sort_field', 'updated_at'),
                ('default_sort_order', 'desc'),
                ('default_view', 'list'),
                ('theme', 'light'),
                ('font_size_title', '18'),
                ('font_size_body', '16');
        ")?;
        Ok(())
    }

    // === Notes CRUD ===

    pub fn create_note(&self, note: &Note) -> Result<Note> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO notes (id, title, content_json, content_preview, type, group_id, is_deleted, is_synced, created_at, updated_at, word_count)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                note.id, note.title, note.content_json, note.content_preview,
                note.note_type, note.group_id, note.is_deleted as i64,
                note.is_synced as i64, note.created_at, note.updated_at, note.word_count
            ],
        )?;
        Ok(note.clone())
    }

    pub fn update_note(&self, id: &str, title: Option<&str>, content_json: Option<&str>,
                        content_preview: Option<&str>, group_id: Option<&str>) -> Result<Option<Note>> {
        let conn = self.conn.lock().unwrap();
        if let Some(t) = title {
            conn.execute("UPDATE notes SET title=?1, updated_at=?2 WHERE id=?3",
                params![t, chrono::Utc::now().to_rfc3339(), id])?;
        }
        if let Some(c) = content_json {
            conn.execute("UPDATE notes SET content_json=?1, updated_at=?2 WHERE id=?3",
                params![c, chrono::Utc::now().to_rfc3339(), id])?;
        }
        if let Some(p) = content_preview {
            conn.execute("UPDATE notes SET content_preview=?1, updated_at=?2 WHERE id=?3",
                params![p, chrono::Utc::now().to_rfc3339(), id])?;
        }
        if let Some(g) = group_id {
            conn.execute("UPDATE notes SET group_id=?1, updated_at=?2 WHERE id=?3",
                params![g, chrono::Utc::now().to_rfc3339(), id])?;
        }
        self.get_note(id)
    }

    pub fn get_note(&self, id: &str) -> Result<Option<Note>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title, content_json, content_preview, type, group_id,
                    is_deleted, is_synced, created_at, updated_at, deleted_at, synced_at, word_count
             FROM notes WHERE id=?1"
        )?;
        let mut rows = stmt.query_map(params![id], |row| {
            Ok(Note {
                id: row.get(0)?, title: row.get(1)?, content_json: row.get(2)?,
                content_preview: row.get(3)?, note_type: row.get(4)?, group_id: row.get(5)?,
                is_deleted: row.get::<_, i64>(6)? != 0, is_synced: row.get::<_, i64>(7)? != 0,
                created_at: row.get(8)?, updated_at: row.get(9)?, deleted_at: row.get(10)?,
                synced_at: row.get(11)?, word_count: row.get(12)?,
            })
        })?;
        Ok(rows.next().map(|r| r.unwrap()))
    }

    pub fn list_notes(&self, params: &NoteListParams) -> Result<Vec<Note>> {
        let conn = self.conn.lock().unwrap();
        let mut sql = String::from(
            "SELECT id, title, content_json, content_preview, type, group_id,
                    is_deleted, is_synced, created_at, updated_at, deleted_at, synced_at, word_count
             FROM notes WHERE 1=1"
        );
        let mut param_values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

        if let Some(ref g) = params.group_id {
            sql.push_str(" AND group_id=?");
            param_values.push(Box::new(g.clone()));
        }
        if let Some(d) = params.is_deleted {
            sql.push_str(&format!(" AND is_deleted={}", d as i64));
        } else {
            sql.push_str(" AND is_deleted=0");
        }
        if let Some(ref s) = params.search {
            if !s.is_empty() {
                sql.push_str(" AND id IN (SELECT rowid FROM notes_fts WHERE notes_fts MATCH ?)");
                param_values.push(Box::new(format!("\"{}\"", s)));
            }
        }
        if let Some(ref df) = params.date_from {
            sql.push_str(" AND created_at>=?");
            param_values.push(Box::new(df.clone()));
        }
        if let Some(ref dt) = params.date_to {
            sql.push_str(" AND created_at<=?");
            param_values.push(Box::new(dt.clone()));
        }

        let sort_field = params.sort_field.as_deref().unwrap_or("updated_at");
        let sort_order = params.sort_order.as_deref().unwrap_or("desc");
        let order = if sort_order == "asc" { "ASC" } else { "DESC" };
        let safe_field = match sort_field { "created_at" => "created_at", "title" => "title", _ => "updated_at" };
        sql.push_str(&format!(" ORDER BY {} {}", safe_field, order));

        if let Some(l) = params.limit {
            sql.push_str(&format!(" LIMIT {}", l));
        }
        if let Some(o) = params.offset {
            sql.push_str(&format!(" OFFSET {}", o));
        }

        let mut stmt = conn.prepare(&sql)?;
        let param_refs: Vec<&dyn rusqlite::types::ToSql> = param_values.iter().map(|p| p.as_ref()).collect();
        let rows = stmt.query_map(param_refs.as_slice(), |row| {
            Ok(Note {
                id: row.get(0)?, title: row.get(1)?, content_json: row.get(2)?,
                content_preview: row.get(3)?, note_type: row.get(4)?, group_id: row.get(5)?,
                is_deleted: row.get::<_, i64>(6)? != 0, is_synced: row.get::<_, i64>(7)? != 0,
                created_at: row.get(8)?, updated_at: row.get(9)?, deleted_at: row.get(10)?,
                synced_at: row.get(11)?, word_count: row.get(12)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn soft_delete_note(&self, id: &str) -> Result<bool> {
        let conn = self.conn.lock().unwrap();
        let now = chrono::Utc::now().to_rfc3339();
        let affected = conn.execute(
            "UPDATE notes SET is_deleted=1, deleted_at=?1, updated_at=?1 WHERE id=?2 AND is_deleted=0",
            params![now, id],
        )?;
        Ok(affected > 0)
    }

    pub fn restore_note(&self, id: &str) -> Result<bool> {
        let conn = self.conn.lock().unwrap();
        let now = chrono::Utc::now().to_rfc3339();
        let affected = conn.execute(
            "UPDATE notes SET is_deleted=0, deleted_at=NULL, updated_at=?1 WHERE id=?2",
            params![now, id],
        )?;
        Ok(affected > 0)
    }

    pub fn permanent_delete_note(&self, id: &str) -> Result<bool> {
        let conn = self.conn.lock().unwrap();
        let affected = conn.execute("DELETE FROM notes WHERE id=?1", params![id])?;
        Ok(affected > 0)
    }

    pub fn list_deleted_notes(&self) -> Result<Vec<Note>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title, content_json, content_preview, type, group_id,
                    is_deleted, is_synced, created_at, updated_at, deleted_at, synced_at, word_count
             FROM notes WHERE is_deleted=1 ORDER BY deleted_at DESC"
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(Note {
                id: row.get(0)?, title: row.get(1)?, content_json: row.get(2)?,
                content_preview: row.get(3)?, note_type: row.get(4)?, group_id: row.get(5)?,
                is_deleted: row.get::<_, i64>(6)? != 0, is_synced: row.get::<_, i64>(7)? != 0,
                created_at: row.get(8)?, updated_at: row.get(9)?, deleted_at: row.get(10)?,
                synced_at: row.get(11)?, word_count: row.get(12)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    // === Groups ===

    pub fn create_group(&self, name: &str) -> Result<Group> {
        let conn = self.conn.lock().unwrap();
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        let max_order: i64 = conn.query_row(
            "SELECT COALESCE(MAX(sort_order), -1) + 1 FROM groups", [], |r| r.get(0)
        )?;
        conn.execute(
            "INSERT INTO groups (id, name, sort_order, created_at) VALUES (?1, ?2, ?3, ?4)",
            params![id, name, max_order, now],
        )?;
        Ok(Group { id, name: name.to_string(), sort_order: max_order, created_at: now })
    }

    pub fn list_groups(&self) -> Result<Vec<Group>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, sort_order, created_at FROM groups ORDER BY sort_order ASC"
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(Group { id: row.get(0)?, name: row.get(1)?, sort_order: row.get(2)?, created_at: row.get(3)? })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn update_group(&self, id: &str, name: &str) -> Result<bool> {
        let conn = self.conn.lock().unwrap();
        Ok(conn.execute("UPDATE groups SET name=?1 WHERE id=?2", params![name, id])? > 0)
    }

    pub fn delete_group(&self, id: &str) -> Result<bool> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE notes SET group_id=NULL WHERE group_id=?1", params![id])?;
        Ok(conn.execute("DELETE FROM groups WHERE id=?1", params![id])? > 0)
    }

    // === Settings ===

    pub fn get_setting(&self, key: &str) -> Result<Option<String>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT value FROM settings WHERE key=?1")?;
        let mut rows = stmt.query_map(params![key], |r| r.get::<_, String>(0))?;
        Ok(rows.next().map(|r| r.unwrap()))
    }

    pub fn set_setting(&self, key: &str, value: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value=?2",
            params![key, value],
        )?;
        Ok(())
    }

    pub fn get_all_settings(&self) -> Result<Vec<Setting>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT key, value FROM settings")?;
        let rows = stmt.query_map([], |r| Ok(Setting { key: r.get(0)?, value: r.get(1)? }))?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }
}
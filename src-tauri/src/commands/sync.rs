use crate::db::Database;
use crate::models::*;
use crate::notion::{NotionClient, NotionConfig};
use tauri::State;
use std::sync::Mutex;

pub struct SyncEngine {
    pub client: Mutex<Option<NotionClient>>,
}

impl SyncEngine {
    pub fn new() -> Self {
        Self { client: Mutex::new(None) }
    }

    pub fn configure(&self, config: NotionConfig) {
        *self.client.lock().unwrap() = Some(NotionClient::new(config));
    }

    pub fn is_ready(&self) -> bool {
        self.client.lock().unwrap().is_some()
    }
}

#[tauri::command]
pub fn notion_configure(db: State<Database>, sync: State<SyncEngine>, token: String, database_id: Option<String>) -> IpcResponse<()> {
    let config = NotionConfig {
        token: token.clone(),
        database_id: database_id.clone(),
    };
    sync.configure(config);
    // Save token to settings
    db.set_setting("notion_token", &token).ok();
    if let Some(db_id) = &database_id {
        db.set_setting("notion_database_id", db_id).ok();
    }
    IpcResponse::ok(())
}

#[tauri::command]
pub fn notion_get_config(db: State<Database>) -> IpcResponse<NotionConfig> {
    let token = db.get_setting("notion_token").ok().flatten().unwrap_or_default();
    let database_id = db.get_setting("notion_database_id").ok().flatten();
    IpcResponse::ok(NotionConfig { token, database_id })
}

#[tauri::command]
pub async fn notion_verify(sync: State<'_, SyncEngine>) -> IpcResponse<String> {
    let client_guard = sync.client.lock().unwrap();
    let client = match client_guard.as_ref() {
        Some(c) => c,
        None => return IpcResponse::err("Notion not configured"),
    };
    match client.verify_token().await {
        Ok(name) => IpcResponse::ok(name),
        Err(e) => IpcResponse::err(&e),
    }
}

#[tauri::command]
pub async fn notion_sync_notes(db: State<'_, Database>, sync: State<'_, SyncEngine>) -> IpcResponse<i64> {
    let client_guard = sync.client.lock().unwrap();
    let client = match client_guard.as_ref() {
        Some(c) => c,
        None => return IpcResponse::err("Notion not configured"),
    };

    // Get unsynced notes
    let params = NoteListParams {
        group_id: None,
        is_deleted: Some(false),
        search: None,
        sort_field: Some("updated_at".to_string()),
        sort_order: Some("desc".to_string()),
        date_from: None,
        date_to: None,
        limit: None,
        offset: None,
    };
    let notes = match db.list_notes(&params) {
        Ok(n) => n,
        Err(e) => return IpcResponse::err(&format!("Failed to get notes: {}", e)),
    };

    let mut synced = 0i64;
    for note in &notes {
        if note.is_synced {
            // Update existing page
            if let Some(ref notion_id) = get_notion_page_id(db, &note.id) {
                match client.update_page(notion_id, &note.title, &note.content_preview).await {
                    Ok(()) => {
                        db.set_setting(&format!("notion_page_{}", note.id), notion_id).ok();
                        // Mark as synced
                        let now = chrono::Utc::now().to_rfc3339();
                        // We need a direct SQL update for synced_at
                        let conn = db.get_conn();
                        conn.execute("UPDATE notes SET is_synced=1, synced_at=?1 WHERE id=?2",
                            rusqlite::params![now, note.id]).ok();
                        synced += 1;
                    }
                    Err(_) => continue,
                }
            }
        } else {
            // Create new page
            match client.create_page(&note.title, &note.content_preview).await {
                Ok(page) => {
                    db.set_setting(&format!("notion_page_{}", note.id), &page.id).ok();
                    let conn = db.get_conn();
                    let now = chrono::Utc::now().to_rfc3339();
                    conn.execute("UPDATE notes SET is_synced=1, synced_at=?1 WHERE id=?2",
                        rusqlite::params![now, note.id]).ok();
                    synced += 1;
                }
                Err(_) => continue,
            }
        }
    }
    IpcResponse::ok(synced)
}

fn get_notion_page_id(db: &Database, note_id: &str) -> Option<String> {
    db.get_setting(&format!("notion_page_{}", note_id)).ok().flatten()
}

// Expose db connection for sync module
impl Database {
    pub fn get_conn(&self) -> std::sync::MutexGuard<rusqlite::Connection> {
        self.conn.lock().unwrap()
    }
}
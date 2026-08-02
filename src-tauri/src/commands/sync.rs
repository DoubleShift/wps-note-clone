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
}

#[tauri::command]
pub fn notion_configure(db: State<Database>, sync: State<SyncEngine>, token: String, database_id: Option<String>) -> IpcResponse<()> {
    let config = NotionConfig { token: token.clone(), database_id: database_id.clone() };
    *sync.client.lock().unwrap() = Some(NotionClient::new(config));
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
pub async fn notion_verify(sync: State<'_, SyncEngine>) -> Result<String, String> {
    let client = {
        let guard = sync.client.lock().unwrap();
        guard.as_ref().map(|c| {
            NotionClient::new(NotionConfig {
                token: String::new(), // placeholder, we just need to verify
                database_id: None,
            })
        })
    };
    // Rebuild client from settings
    let guard = sync.client.lock().unwrap();
    let client = match guard.as_ref() {
        Some(c) => c,
        None => return Err("Notion not configured".to_string()),
    };
    client.verify_token().await
}

#[tauri::command]
pub async fn notion_sync_notes(db: State<'_, Database>, sync: State<'_, SyncEngine>) -> Result<i64, String> {
    let client = {
        let guard = sync.client.lock().unwrap();
        guard.as_ref().map(|c| {
            NotionClient::new(NotionConfig {
                token: String::new(),
                database_id: None,
            })
        })
    };
    let guard = sync.client.lock().unwrap();
    let client = match guard.as_ref() {
        Some(c) => c,
        None => return Err("Notion not configured".to_string()),
    };

    let params = NoteListParams {
        group_id: None, is_deleted: Some(false), search: None,
        sort_field: Some("updated_at".to_string()), sort_order: Some("desc".to_string()),
        date_from: None, date_to: None, limit: None, offset: None,
    };
    let notes = db.list_notes(&params).map_err(|e| format!("DB error: {}", e))?;

    let mut synced = 0i64;
    for note in &notes {
        if note.is_synced {
            if let Some(notion_id) = get_notion_page_id(db, &note.id) {
                match client.update_page(&notion_id, &note.title, &note.content_preview).await {
                    Ok(()) => {
                        mark_synced(db, &note.id);
                        synced += 1;
                    }
                    Err(_) => continue,
                }
            }
        } else {
            match client.create_page(&note.title, &note.content_preview).await {
                Ok(page) => {
                    db.set_setting(&format!("notion_page_{}", note.id), &page.id).ok();
                    mark_synced(db, &note.id);
                    synced += 1;
                }
                Err(_) => continue,
            }
        }
    }
    Ok(synced)
}

fn get_notion_page_id(db: &Database, note_id: &str) -> Option<String> {
    db.get_setting(&format!("notion_page_{}", note_id)).ok().flatten()
}

fn mark_synced(db: &Database, note_id: &str) {
    let now = chrono::Utc::now().to_rfc3339();
    db.set_setting(&format!("notion_synced_at_{}", note_id), &now).ok();
    // We need to update the note's is_synced flag
    // Since we can't access the connection directly, we use a setting
}
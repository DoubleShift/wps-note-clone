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
        guard.as_ref().cloned()
    };
    let client = match client {
        Some(c) => c,
        None => return Err("Notion not configured".to_string()),
    };
    client.verify_token().await
}

#[tauri::command]
pub async fn notion_sync_notes(db: State<'_, Database>, sync: State<'_, SyncEngine>) -> Result<i64, String> {
    // Get the Notion config from DB first (no lock needed)
    let token = db.get_setting("notion_token").ok().flatten().unwrap_or_default();
    let database_id = db.get_setting("notion_database_id").ok().flatten();
    let config = NotionConfig { token, database_id };

    if config.token.is_empty() {
        return Err("Notion not configured".to_string());
    }

    // Build a temporary client (no lock needed)
    let client = NotionClient::new(config);

    let params = NoteListParams {
        group_id: None, is_deleted: Some(false), search: None,
        sort_field: Some("updated_at".to_string()), sort_order: Some("desc".to_string()),
        date_from: None, date_to: None, limit: None, offset: None,
    };
    let notes = db.list_notes(&params).map_err(|e| format!("DB error: {}", e))?;

    let mut synced = 0i64;
    for note in &notes {
        let result = if note.is_synced {
            let notion_id = db.get_setting(&format!("notion_page_{}", note.id))
                .ok().flatten();
            match notion_id {
                Some(id) => client.update_page(&id, &note.title, &note.content_preview).await,
                None => continue,
            }
        } else {
            match client.create_page(&note.title, &note.content_preview).await {
                Ok(page) => {
                    db.set_setting(&format!("notion_page_{}", note.id), &page.id).ok();
                    Ok(())
                }
                Err(e) => Err(e),
            }
        };
        if result.is_ok() {
            db.set_setting(&format!("notion_synced_{}", note.id), "true").ok();
            synced += 1;
        }
    }
    Ok(synced)
}
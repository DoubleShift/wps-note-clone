mod image;
mod sync;

pub use image::*;
pub use sync::*;

use crate::db::Database;
use crate::models::*;
use tauri::State;

// === Notes ===

#[tauri::command]
pub fn create_note(db: State<Database>, req: CreateNoteRequest) -> IpcResponse<Note> {
    let note = Note {
        id: uuid::Uuid::new_v4().to_string(),
        title: req.title,
        content_json: req.content_json,
        content_preview: req.content_preview,
        note_type: req.note_type.unwrap_or("text".to_string()),
        group_id: req.group_id,
        is_deleted: false,
        is_synced: false,
        created_at: chrono::Utc::now().to_rfc3339(),
        updated_at: chrono::Utc::now().to_rfc3339(),
        deleted_at: None,
        synced_at: None,
        word_count: 0,
    };
    match db.create_note(&note) {
        Ok(n) => IpcResponse::ok(n),
        Err(e) => IpcResponse::err(&format!("Failed to create note: {}", e)),
    }
}

#[tauri::command]
pub fn update_note(db: State<Database>, req: UpdateNoteRequest) -> IpcResponse<Option<Note>> {
    match db.update_note(&req.id, req.title.as_deref(), req.content_json.as_deref(),
                         req.content_preview.as_deref(), req.group_id.as_deref()) {
        Ok(n) => IpcResponse::ok(n),
        Err(e) => IpcResponse::err(&format!("Failed to update note: {}", e)),
    }
}

#[tauri::command]
pub fn get_note(db: State<Database>, id: String) -> IpcResponse<Option<Note>> {
    match db.get_note(&id) {
        Ok(n) => IpcResponse::ok(n),
        Err(e) => IpcResponse::err(&format!("Failed to get note: {}", e)),
    }
}

#[tauri::command]
pub fn list_notes(db: State<Database>, params: NoteListParams) -> IpcResponse<Vec<Note>> {
    match db.list_notes(&params) {
        Ok(notes) => IpcResponse::ok(notes),
        Err(e) => IpcResponse::err(&format!("Failed to list notes: {}", e)),
    }
}

#[tauri::command]
pub fn soft_delete_note(db: State<Database>, id: String) -> IpcResponse<bool> {
    match db.soft_delete_note(&id) {
        Ok(r) => IpcResponse::ok(r),
        Err(e) => IpcResponse::err(&format!("Failed to delete note: {}", e)),
    }
}

#[tauri::command]
pub fn restore_note(db: State<Database>, id: String) -> IpcResponse<bool> {
    match db.restore_note(&id) {
        Ok(r) => IpcResponse::ok(r),
        Err(e) => IpcResponse::err(&format!("Failed to restore note: {}", e)),
    }
}

#[tauri::command]
pub fn permanent_delete_note(db: State<Database>, id: String) -> IpcResponse<bool> {
    match db.permanent_delete_note(&id) {
        Ok(r) => IpcResponse::ok(r),
        Err(e) => IpcResponse::err(&format!("Failed to permanently delete note: {}", e)),
    }
}

#[tauri::command]
pub fn list_deleted_notes(db: State<Database>) -> IpcResponse<Vec<Note>> {
    match db.list_deleted_notes() {
        Ok(notes) => IpcResponse::ok(notes),
        Err(e) => IpcResponse::err(&format!("Failed to list deleted notes: {}", e)),
    }
}

// === Groups ===

#[tauri::command]
pub fn create_group(db: State<Database>, name: String) -> IpcResponse<Group> {
    match db.create_group(&name) {
        Ok(g) => IpcResponse::ok(g),
        Err(e) => IpcResponse::err(&format!("Failed to create group: {}", e)),
    }
}

#[tauri::command]
pub fn list_groups(db: State<Database>) -> IpcResponse<Vec<Group>> {
    match db.list_groups() {
        Ok(groups) => IpcResponse::ok(groups),
        Err(e) => IpcResponse::err(&format!("Failed to list groups: {}", e)),
    }
}

#[tauri::command]
pub fn update_group(db: State<Database>, id: String, name: String) -> IpcResponse<bool> {
    match db.update_group(&id, &name) {
        Ok(r) => IpcResponse::ok(r),
        Err(e) => IpcResponse::err(&format!("Failed to update group: {}", e)),
    }
}

#[tauri::command]
pub fn delete_group(db: State<Database>, id: String) -> IpcResponse<bool> {
    match db.delete_group(&id) {
        Ok(r) => IpcResponse::ok(r),
        Err(e) => IpcResponse::err(&format!("Failed to delete group: {}", e)),
    }
}

// === Settings ===

#[tauri::command]
pub fn get_setting(db: State<Database>, key: String) -> IpcResponse<Option<String>> {
    match db.get_setting(&key) {
        Ok(v) => IpcResponse::ok(v),
        Err(e) => IpcResponse::err(&format!("Failed to get setting: {}", e)),
    }
}

#[tauri::command]
pub fn set_setting(db: State<Database>, key: String, value: String) -> IpcResponse<()> {
    match db.set_setting(&key, &value) {
        Ok(()) => IpcResponse::ok(()),
        Err(e) => IpcResponse::err(&format!("Failed to set setting: {}", e)),
    }
}

#[tauri::command]
pub fn get_all_settings(db: State<Database>) -> IpcResponse<Vec<Setting>> {
    match db.get_all_settings() {
        Ok(s) => IpcResponse::ok(s),
        Err(e) => IpcResponse::err(&format!("Failed to get settings: {}", e)),
    }
}
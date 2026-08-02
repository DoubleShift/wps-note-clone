use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub content_json: String,
    pub content_preview: String,
    #[serde(rename = "type")]
    pub note_type: String,
    pub group_id: Option<String>,
    pub is_deleted: bool,
    pub is_synced: bool,
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
    pub synced_at: Option<String>,
    pub word_count: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Group {
    pub id: String,
    pub name: String,
    pub sort_order: i64,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Setting {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NoteListParams {
    pub group_id: Option<String>,
    pub is_deleted: Option<bool>,
    pub search: Option<String>,
    pub sort_field: Option<String>,
    pub sort_order: Option<String>,
    pub date_from: Option<String>,
    pub date_to: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateNoteRequest {
    pub title: String,
    pub content_json: String,
    pub content_preview: String,
    pub group_id: Option<String>,
    pub note_type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateNoteRequest {
    pub id: String,
    pub title: Option<String>,
    pub content_json: Option<String>,
    pub content_preview: Option<String>,
    pub group_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IpcResponse<T: Serialize> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T: Serialize> IpcResponse<T> {
    pub fn ok(data: T) -> Self {
        Self { success: true, data: Some(data), error: None }
    }
    pub fn err(msg: &str) -> Self {
        Self { success: false, data: None, error: Some(msg.to_string()) }
    }
}
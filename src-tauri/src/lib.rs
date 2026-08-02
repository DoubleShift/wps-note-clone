mod commands;
mod db;
mod models;
mod notion;

use db::Database;
use commands::sync::SyncEngine;
use std::path::PathBuf;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let app_dir: PathBuf = app.path().app_data_dir().expect("failed to get app data dir");
            std::fs::create_dir_all(&app_dir).ok();
            let db_path = app_dir.join("wps_note.db");
            let database = Database::new(db_path.to_str().unwrap())
                .expect("failed to initialize database");
            app.manage(database);

            // Init sync engine
            let sync_engine = SyncEngine::new();
            // Load existing config
            // (config will be loaded when needed)
            app.manage(sync_engine);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Notes
            commands::create_note,
            commands::update_note,
            commands::get_note,
            commands::list_notes,
            commands::soft_delete_note,
            commands::restore_note,
            commands::permanent_delete_note,
            commands::list_deleted_notes,
            // Groups
            commands::create_group,
            commands::list_groups,
            commands::update_group,
            commands::delete_group,
            // Settings
            commands::get_setting,
            commands::set_setting,
            commands::get_all_settings,
            // Images
            commands::save_image,
            commands::get_image_path,
            commands::delete_note_images,
            // Notion Sync
            commands::notion_configure,
            commands::notion_get_config,
            commands::notion_verify,
            commands::notion_sync_notes,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
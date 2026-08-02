use crate::models::IpcResponse;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

#[tauri::command]
pub fn save_image(app: AppHandle, note_id: String, image_data: Vec<u8>) -> IpcResponse<String> {
    let app_dir: PathBuf = app.path().app_data_dir().expect("failed to get app data dir");
    let images_dir = app_dir.join("images").join(&note_id);
    std::fs::create_dir_all(&images_dir).ok();

    let filename = format!("{}.png", uuid::Uuid::new_v4());
    let path = images_dir.join(&filename);

    // Compress image
    match compress_image(&image_data, &path) {
        Ok(_) => {
            let relative_path = format!("images/{}/{}", note_id, filename);
            IpcResponse::ok(relative_path)
        }
        Err(e) => IpcResponse::err(&format!("Failed to save image: {}", e)),
    }
}

#[tauri::command]
pub fn get_image_path(app: AppHandle, relative_path: String) -> IpcResponse<String> {
    let app_dir: PathBuf = app.path().app_data_dir().expect("failed to get app data dir");
    let full_path = app_dir.join(&relative_path);
    let path_str = full_path.to_str().unwrap_or("").to_string();
    if full_path.exists() {
        IpcResponse::ok(path_str)
    } else {
        IpcResponse::err("Image not found")
    }
}

#[tauri::command]
pub fn delete_note_images(app: AppHandle, note_id: String) -> IpcResponse<bool> {
    let app_dir: PathBuf = app.path().app_data_dir().expect("failed to get app data dir");
    let images_dir = app_dir.join("images").join(&note_id);
    if images_dir.exists() {
        std::fs::remove_dir_all(&images_dir).ok();
    }
    IpcResponse::ok(true)
}

fn compress_image(data: &[u8], output_path: &PathBuf) -> Result<(), String> {
    let img = image::load_from_memory(data).map_err(|e| format!("Failed to load image: {}", e))?;
    // Resize if too large (max 1920px)
    let (w, h) = img.dimensions();
    let max_dim = 1920u32;
    let img = if w > max_dim || h > max_dim {
        let ratio = max_dim as f64 / w.max(h) as f64;
        let new_w = (w as f64 * ratio) as u32;
        let new_h = (h as f64 * ratio) as u32;
        img.resize(new_w, new_h, image::imageops::FilterType::Lanczos3)
    } else {
        img
    };
    // Save as JPEG with quality 85
    img.save(output_path).map_err(|e| format!("Failed to save: {}", e))?;
    Ok(())
}
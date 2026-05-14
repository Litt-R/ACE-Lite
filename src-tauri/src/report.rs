use base64::Engine;
use std::path::PathBuf;

pub fn save_report_to_desktop(image_base64: String, filename: String) -> Result<String, String> {
    let desktop = desktop_path()?;
    let data = base64::engine::general_purpose::STANDARD
        .decode(&image_base64)
        .map_err(|error| format!("解码图片失败: {}", error))?;

    let file_path = desktop.join(&filename);
    std::fs::write(&file_path, data).map_err(|error| format!("保存文件失败: {}", error))?;

    Ok(file_path.to_string_lossy().to_string())
}

fn desktop_path() -> Result<PathBuf, String> {
    let desktop = std::env::var("USERPROFILE")
        .map(PathBuf::from)
        .map(|user_profile| user_profile.join("Desktop"))
        .map_err(|_| "无法解析桌面路径".to_string())?;

    if desktop.exists() {
        Ok(desktop)
    } else {
        Err("桌面路径不存在".to_string())
    }
}

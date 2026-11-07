use crate::{
    capture,
    runtime::{self, Prefs, Runtime},
};
use serde_json::{json, Value};
use tauri::{AppHandle, Manager, Webview, WebviewUrl, WebviewWindowBuilder};
pub fn apply_prefs(app: &AppHandle) {
    let prefs = app.state::<Runtime>().0.lock().unwrap().prefs.clone();
    if let Some(view) = app.get_webview("zalo") {
        let _ = view.eval(format!(
            "window.__rustApplyPrefs?.({})",
            serde_json::to_string(&prefs).unwrap()
        ));
    }
    runtime::layout(app);
    runtime::emit(app);
}
pub fn settings(app: &AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("settings") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    } else {
        WebviewWindowBuilder::new(app, "settings", WebviewUrl::App("settings.html".into()))
            .title("Cài đặt Zalo Native Rust")
            .inner_size(600., 520.)
            .min_inner_size(480., 460.)
            .build()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}
pub fn selector(command: &str) -> Option<&'static str> {
    match command {
        "chat" => Some("#main-tab [data-id=\"div_Main_TabMsg\"]"),
        "contacts" => Some("#main-tab .leftbar-tab[title=\"Danh bạ\"]"),
        "saved" => Some("#main-tab .leftbar-tab[title=\"My Documents\"]"),
        "cloud" => Some("#main-tab [data-id=\"div_Main_Tab_zCloud\"]"),
        "account" => Some("#main-tab .nav__tabs__zalo .zavatar-container"),
        _ => None,
    }
}
#[tauri::command]
pub async fn desktop(
    app: AppHandle,
    webview: Webview,
    action: String,
    payload: Value,
) -> Result<Value, String> {
    if !runtime::local(&webview) {
        return Err("Untrusted local sender".into());
    }
    let label = webview.label().to_string();
    if action == "init" {
        return Ok(runtime::state(&app));
    }
    if label.starts_with("capture-") {
        return match action.as_str() {
            "capture:source" => {
                let runtime = app.state::<Runtime>();
                let inner = runtime.0.lock().unwrap();
                let frame = inner.frames.get(&label).ok_or("Capture session expired")?;
                Ok(json!(capture::data_url(&frame.image)?))
            }
            "capture:cancel" => {
                capture::restore(&app);
                Ok(Value::Null)
            }
            "capture:crop" => {
                capture::crop(&app, &label, &payload)?;
                Ok(Value::Null)
            }
            _ => Err("Unknown capture action".into()),
        };
    }
    if label == "preview" {
        return match action.as_str() {
            "preview:image" => Ok(json!(capture::data_url(&capture::image(&app)?)?)),
            "preview:copy" => {
                capture::copy(&app)?;
                Ok(json!(true))
            }
            "preview:save" => capture::save(&app).await,
            "preview:paste" => {
                let main = app.get_window("zalo").ok_or("Zalo chưa mở")?;
                main.show().map_err(|e| e.to_string())?;
                main.set_focus().map_err(|e| e.to_string())?;
                let remote = app.get_webview("zalo").ok_or("Zalo chưa mở")?;
                if remote
                    .url()
                    .ok()
                    .and_then(|u| u.host_str().map(str::to_string))
                    .as_deref()
                    != Some("chat.zalo.me")
                {
                    return Err("Hãy đăng nhập và mở cuộc trò chuyện trước khi đính kèm.".into());
                }
                let token = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_millis() as u64;
                let (sender, receiver) = std::sync::mpsc::channel();
                {
                    let runtime = app.state::<Runtime>();
                    let mut inner = runtime.0.lock().unwrap();
                    if inner.attachment.is_some() {
                        return Err("Ảnh đang được đính kèm, hãy chờ.".into());
                    }
                    inner.attachment = Some((token, sender));
                }
                let focus = include_str!("../../paste-focus.js")
                    .trim()
                    .trim_end_matches(';');
                remote.eval(format!("window.__TAURI__.core.invoke('observe',{{payload:{{kind:'attachment-focus',token:{token},ready:{focus}}}}})")).map_err(|e|e.to_string())?;
                let focused = tauri::async_runtime::spawn_blocking(move || {
                    receiver
                        .recv_timeout(std::time::Duration::from_secs(3))
                        .unwrap_or(false)
                })
                .await
                .map_err(|e| e.to_string())?;
                {
                    let runtime = app.state::<Runtime>();
                    runtime.0.lock().unwrap().attachment = None;
                }
                if !focused {
                    if let Some(preview) = app.get_webview_window("preview") {
                        let _ = preview.show();
                        let _ = preview.set_focus();
                    }
                    return Err(
                        "Hãy mở một cuộc trò chuyện rồi thử lại. Ảnh vẫn còn ở cửa sổ xem trước."
                            .into(),
                    );
                }
                capture::copy(&app)?;
                remote.set_focus().map_err(|e| e.to_string())?;
                capture::native_paste(&remote)?;
                if let Some(preview) = app.get_webview_window("preview") {
                    let _ = preview.close();
                }
                Ok(json!(true))
            }
            _ => Err("Unknown preview action".into()),
        };
    }
    if !matches!(label.as_str(), "chrome-header" | "navigation" | "settings") {
        return Err("Untrusted controls".into());
    }
    match action.as_str() {
        "navigation" => {
            let command = payload.as_str().ok_or("Invalid navigation")?;
            match command {
                "capture" => capture::start(&app).await?,
                "settings" => settings(&app)?,
                _ => {
                    let selector = selector(command).ok_or("Invalid navigation")?;
                    let ready = app.state::<Runtime>().0.lock().unwrap().ready;
                    if !ready {
                        return Err("Hãy đăng nhập Zalo trước khi dùng menu.".into());
                    }
                    let script = format!(
                        "document.querySelector({})?.click()",
                        serde_json::to_string(selector).unwrap()
                    );
                    app.get_webview("zalo")
                        .ok_or("Zalo chưa mở")?
                        .eval(script)
                        .map_err(|e| e.to_string())?;
                }
            }
            Ok(Value::Null)
        }
        "capture" => {
            capture::start(&app).await?;
            Ok(Value::Null)
        }
        "settings" if label == "settings" => {
            let prefs: Prefs = serde_json::from_value(payload).map_err(|e| e.to_string())?;
            let path = app.path().app_data_dir().map_err(|e| e.to_string())?;
            std::fs::create_dir_all(&path).map_err(|e| e.to_string())?;
            std::fs::write(
                path.join("preferences.json"),
                serde_json::to_vec(&prefs).unwrap(),
            )
            .map_err(|e| e.to_string())?;
            app.state::<Runtime>().0.lock().unwrap().prefs = prefs;
            apply_prefs(&app);
            Ok(json!(true))
        }
        "notification:test" if label == "settings" => {
            runtime::notify(&app, true)?;
            Ok(json!(true))
        }
        _ => Err("Unknown desktop action".into()),
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn nav_is_allowlisted() {
        assert!(selector("saved").is_some());
        for bad in ["__proto__", "#richInput", "document.cookie"] {
            assert!(selector(bad).is_none())
        }
    }
}

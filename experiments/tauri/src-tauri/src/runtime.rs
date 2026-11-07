use image::RgbaImage;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{collections::HashMap, sync::Mutex, time::Instant};
use tauri::{
    webview::WebviewBuilder, AppHandle, Emitter, LogicalPosition, LogicalSize, Manager, Rect,
    Webview, WebviewUrl,
};
use tauri_plugin_notification::NotificationExt;
#[derive(Clone, Serialize, Deserialize)]
pub struct Prefs {
    pub compact: bool,
    pub hide_banners: bool,
    pub notifications: bool,
}
impl Default for Prefs {
    fn default() -> Self {
        Self {
            compact: true,
            hide_banners: true,
            notifications: true,
        }
    }
}
pub struct Frame {
    pub image: RgbaImage,
    pub width: f64,
    pub height: f64,
}
pub struct Inner {
    pub prefs: Prefs,
    pub ready: bool,
    pub settings: bool,
    pub navigation: String,
    pub unread: bool,
    pub count: Option<u64>,
    pub last_notification: Option<Instant>,
    pub frames: HashMap<String, Frame>,
    pub captured: Option<RgbaImage>,
    pub busy: bool,
    pub attachment: Option<(u64, std::sync::mpsc::Sender<bool>)>,
}
impl Default for Inner {
    fn default() -> Self {
        Self {
            prefs: Prefs::default(),
            ready: false,
            settings: false,
            navigation: "chat".into(),
            unread: false,
            count: None,
            last_notification: None,
            frames: HashMap::new(),
            captured: None,
            busy: false,
            attachment: None,
        }
    }
}
#[derive(Default)]
pub struct Runtime(pub Mutex<Inner>);
pub fn state(app: &AppHandle) -> Value {
    let runtime = app.state::<Runtime>();
    let inner = runtime.0.lock().unwrap();
    json!({"ready":inner.ready,"navigation":inner.navigation,"unread":inner.unread,"prefs":inner.prefs,"platform":if cfg!(target_os="macos"){"darwin"}else{"win32"},"version":app.package_info().version.to_string()})
}
pub fn emit(app: &AppHandle) {
    let value = state(app);
    for label in ["chrome-header", "navigation", "settings"] {
        if let Some(view) = app.get_webview(label) {
            let _ = view.emit("state", &value);
        }
    }
}
pub fn layout(app: &AppHandle) {
    let Some(main) = app.get_window("zalo") else {
        return;
    };
    let Ok(size) = main.inner_size() else { return };
    let scale = main.scale_factor().unwrap_or(1.);
    let size: LogicalSize<f64> = size.to_logical(scale);
    let runtime = app.state::<Runtime>();
    let inner = runtime.0.lock().unwrap();
    let width = if size.width < 1000. {
        292.
    } else if inner.prefs.compact {
        316.
    } else {
        356.
    };
    let rail = if size.width < 1100. { 188. } else { 220. };
    for (label, x, y, width, height) in [
        ("navigation", 0., 0., rail, size.height),
        ("chrome-header", rail, 0., width, 56.),
    ] {
        if let Some(view) = app.get_webview(label) {
            let _ = view.set_bounds(Rect {
                position: LogicalPosition::new(x, y).into(),
                size: LogicalSize::new(width, height).into(),
            });
            if inner.ready && !inner.settings {
                let _ = view.show();
            } else {
                let _ = view.hide();
            }
        }
    }
}
pub fn add_chrome(app: &AppHandle) -> tauri::Result<()> {
    let main = app.get_window("zalo").unwrap();
    let window = main.clone();
    for (label, file, x, width, height) in [
        ("navigation", "navigation.html", 0., 220., 820.),
        ("chrome-header", "header.html", 220., 316., 56.),
    ] {
        let child = window.add_child(
            WebviewBuilder::new(label, WebviewUrl::App(file.into())),
            LogicalPosition::new(x, 0.),
            LogicalSize::new(width, height),
        )?;
        child.hide()?;
    }
    let handle = app.clone();
    main.on_window_event(move |event| {
        if matches!(
            event,
            tauri::WindowEvent::Resized(_) | tauri::WindowEvent::ScaleFactorChanged { .. }
        ) {
            layout(&handle)
        }
    });
    Ok(())
}
pub fn notify(app: &AppHandle, force: bool) -> Result<(), String> {
    let runtime = app.state::<Runtime>();
    {
        let mut inner = runtime.0.lock().unwrap();
        if !force
            && (!inner.prefs.notifications
                || inner
                    .last_notification
                    .is_some_and(|last| last.elapsed().as_secs() < 4))
        {
            return Ok(());
        }
        inner.last_notification = Some(Instant::now());
    }
    app.notification()
        .builder()
        .title("Zalo Native Rust")
        .body(if force {
            "Thông báo tin nhắn đã sẵn sàng."
        } else {
            "Bạn có tin nhắn mới trên Zalo."
        })
        .show()
        .map_err(|e| e.to_string())
}
#[tauri::command]
pub async fn observe(app: AppHandle, webview: Webview, payload: Value) -> Result<(), String> {
    if webview.label() != "zalo"
        || webview
            .url()
            .ok()
            .and_then(|u| u.host_str().map(str::to_string))
            .as_deref()
            != Some("chat.zalo.me")
    {
        return Err("Untrusted observer".into());
    }
    let kind = payload["kind"].as_str().unwrap_or("");
    if kind == "attachment-focus" {
        let runtime = app.state::<Runtime>();
        let mut inner = runtime.0.lock().unwrap();
        if inner
            .attachment
            .as_ref()
            .is_some_and(|(token, _)| Some(*token) == payload["token"].as_u64())
        {
            if let Some((_, sender)) = inner.attachment.take() {
                let _ = sender.send(payload["ready"].as_bool().unwrap_or(false));
            }
        }
        return Ok(());
    }

    if kind == "notification" {
        return notify(&app, false);
    }
    if kind != "status" {
        return Err("Unknown report".into());
    }
    let should_notify;
    {
        let runtime = app.state::<Runtime>();
        let mut inner = runtime.0.lock().unwrap();
        inner.ready = payload["ready"].as_bool().unwrap_or(false);
        inner.unread = payload["unread"].as_bool().unwrap_or(false);
        let nav = payload["navigation"].as_str().unwrap_or("chat");
        inner.navigation = if ["chat", "contacts", "saved"].contains(&nav) {
            nav.into()
        } else {
            "chat".into()
        };
        let count = payload["count"].as_u64().unwrap_or(0).min(100000);
        should_notify = inner.count.is_some_and(|old| count > old);
        inner.count = Some(count);
    }
    layout(&app);
    emit(&app);
    if should_notify {
        notify(&app, false)?;
    }
    Ok(())
}
pub fn local(view: &Webview) -> bool {
    let label = view.label();
    (matches!(
        label,
        "chrome-header" | "navigation" | "settings" | "preview"
    ) || label.starts_with("capture-"))
        && view.url().is_ok_and(|u| {
            matches!(u.scheme(), "tauri" | "http" | "https")
                && (u.scheme() == "tauri"
                    || matches!(u.host_str(), Some("tauri.localhost" | "localhost")))
        })
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn remote_cannot_capture_or_read_clipboard() {
        let capability: Value =
            serde_json::from_str(include_str!("../capabilities/observer.json")).unwrap();
        assert_eq!(capability["local"], false);
        assert_eq!(capability["webviews"], json!(["zalo"]));
        assert_eq!(capability["permissions"], json!(["allow-observe"]));
        assert_eq!(
            capability["remote"]["urls"],
            json!(["https://chat.zalo.me/*"])
        );
        let local: Value =
            serde_json::from_str(include_str!("../capabilities/local.json")).unwrap();
        assert!(local.get("remote").is_none());
        assert!(!local["webviews"]
            .as_array()
            .unwrap()
            .contains(&json!("zalo")));
    }
}

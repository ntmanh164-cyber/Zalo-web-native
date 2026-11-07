#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod capture;
mod commands;
mod runtime;
use std::sync::atomic::{AtomicU64, Ordering};
use tauri::{
    menu::{MenuBuilder, MenuItem, SubmenuBuilder},
    webview::{NewWindowResponse, PageLoadEvent},
    Manager, WebviewUrl, WebviewWindowBuilder,
};
use url::Url;
static POPUP: AtomicU64 = AtomicU64::new(0);
fn trusted(url: &Url) -> bool {
    url.scheme() == "https"
        && match url.host_str() {
            Some("chat.zalo.me" | "id.zalo.me" | "id.zalo.vn") => true,
            Some("jr.zaloapp.com") => url.path() == "/jr/syncsession",
            Some("jr.chat.zalo.me") => url.path() == "/jr/pushsession",
            _ => false,
        }
}
fn external(url: &Url) -> bool {
    matches!(url.scheme(), "https" | "http" | "mailto")
}
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .manage(runtime::Runtime::default())
        .invoke_handler(tauri::generate_handler![
            commands::desktop,
            runtime::observe
        ])
        .setup(|app| {
            if let Ok(path) = app.path().app_data_dir() {
                if let Ok(bytes) = std::fs::read(path.join("preferences.json")) {
                    if let Ok(prefs) = serde_json::from_slice::<runtime::Prefs>(&bytes) {
                        app.state::<runtime::Runtime>().0.lock().unwrap().prefs = prefs;
                    }
                }
            }
            let handle = app.handle();
            {
                use tauri_plugin_notification::NotificationExt;
                let click_handle = handle.clone();
                app.notification().on_action(move |_| {
                    if let Some(window) = click_handle.get_window("zalo") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                })?;
            }

            let app_menu = SubmenuBuilder::new(handle, "Zalo Rust Lab")
                .about(None)
                .separator()
                .hide()
                .hide_others()
                .show_all()
                .separator()
                .quit()
                .build()?;
            let edit = SubmenuBuilder::new(handle, "Chỉnh sửa")
                .undo()
                .redo()
                .separator()
                .cut()
                .copy()
                .paste()
                .select_all()
                .build()?;
            let capture_item = MenuItem::with_id(
                handle,
                "capture",
                "Chụp vùng màn hình",
                true,
                Some("CmdOrCtrl+Shift+5"),
            )?;
            let trial = SubmenuBuilder::new(handle, "Thử nghiệm")
                .text("zalo", "Mở Zalo")
                .text("reload", "Tải lại Zalo")
                .text("lab", "Kiểm tra ảnh / tệp")
                .separator()
                .item(&capture_item)
                .text("settings", "Cài đặt")
                .text("notification-test", "Thử thông báo")
                .build()?;
            let menu = MenuBuilder::new(handle)
                .items(&[&app_menu, &edit, &trial])
                .build()?;
            app.set_menu(menu)?;
            app.on_menu_event(|app, event| match event.id().as_ref() {
                "zalo" => {
                    if let Some(window) = app.get_window("zalo") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "reload" => {
                    if let Some(window) = app.get_webview("zalo") {
                        let _ = window.reload();
                    }
                }
                "lab" => {
                    if let Some(window) = app.get_webview_window("lab") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    } else {
                        let _ = WebviewWindowBuilder::new(
                            app,
                            "lab",
                            WebviewUrl::App("index.html".into()),
                        )
                        .title("Kiểm tra Rust Lab")
                        .inner_size(850., 780.)
                        .build();
                    }
                }
                "capture" => {
                    let handle = app.clone();
                    tauri::async_runtime::spawn(async move {
                        if let Err(error) = capture::start(&handle).await {
                            let _ = rfd::AsyncMessageDialog::new()
                                .set_title("Chụp màn hình")
                                .set_description(&error)
                                .show()
                                .await;
                        }
                    });
                }
                "settings" => {
                    let _ = commands::settings(app);
                }
                "notification-test" => {
                    let _ = runtime::notify(app, true);
                }
                _ => {}
            });
            let popup_app = handle.clone();
            let builder = WebviewWindowBuilder::new(
                handle,
                "zalo",
                WebviewUrl::External("https://chat.zalo.me/".parse()?),
            )
            .title("Zalo Native Rust")
            .inner_size(1280., 820.)
            .min_inner_size(860., 600.)
            .disable_drag_drop_handler()
            .initialization_script(include_str!("../../ui/zalo.js"))
            .on_navigation(|url| {
                if trusted(url) {
                    true
                } else {
                    if external(url) {
                        let _ = open::that(url.as_str());
                    }
                    false
                }
            })
            .on_page_load(|window, payload| {
                let app = window.app_handle();
                match payload.event() {
                    PageLoadEvent::Started => {
                        app.state::<runtime::Runtime>().0.lock().unwrap().ready = false;
                        runtime::layout(app);
                    }
                    PageLoadEvent::Finished => {
                        commands::apply_prefs(app);
                    }
                }
            })
            .on_new_window(move |url, features| {
                if url.as_str() != "about:blank" && !external(&url) {
                    return NewWindowResponse::Deny;
                }
                let id = format!("popup-{}", POPUP.fetch_add(1, Ordering::Relaxed));
                let close_app = popup_app.clone();
                let close_id = id.clone();
                let result = WebviewWindowBuilder::new(
                    &popup_app,
                    &id,
                    WebviewUrl::External("about:blank".parse().unwrap()),
                )
                .window_features(features)
                .visible(false)
                .on_navigation(move |next| {
                    if next.as_str() == "about:blank" {
                        return true;
                    }
                    if external(next) {
                        let _ = open::that(next.as_str());
                    }
                    if let Some(window) = close_app.get_webview_window(&close_id) {
                        let _ = window.close();
                    }
                    false
                })
                .build();
                match result {
                    Ok(window) => NewWindowResponse::Create { window },
                    Err(_) => NewWindowResponse::Deny,
                }
            });
            #[cfg(target_os = "macos")]
            let builder = builder
                .title_bar_style(tauri::TitleBarStyle::Overlay)
                .hidden_title(true)
                .traffic_light_position(tauri::LogicalPosition::new(13., 17.));
            let main = builder.build()?;
            runtime::add_chrome(handle)?;
            runtime::layout(handle);
            let _ = main.set_focus();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Không khởi động được Rust Lab");
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn auth_routes_are_exact() {
        for good in [
            "https://chat.zalo.me/",
            "https://id.zalo.me/account/checksession",
            "https://jr.zaloapp.com/jr/syncsession",
            "https://jr.chat.zalo.me/jr/pushsession",
        ] {
            assert!(trusted(&Url::parse(good).unwrap()));
        }
        for bad in [
            "http://chat.zalo.me/",
            "https://chat.zalo.me.evil.test/",
            "https://jr.zaloapp.com/other",
        ] {
            assert!(!trusted(&Url::parse(bad).unwrap()));
        }
    }
}

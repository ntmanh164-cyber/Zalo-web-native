use crate::runtime::{Frame, Runtime};
use base64::{engine::general_purpose::STANDARD, Engine};
use image::{ImageFormat, RgbaImage};
use serde_json::{json, Value};
use std::{borrow::Cow, io::Cursor, time::Duration};
use tauri::{AppHandle, Manager, Webview, WebviewUrl, WebviewWindowBuilder};
pub fn data_url(image: &RgbaImage) -> Result<String, String> {
    let mut png = Cursor::new(Vec::new());
    image
        .write_to(&mut png, ImageFormat::Png)
        .map_err(|e| e.to_string())?;
    Ok(format!(
        "data:image/png;base64,{}",
        STANDARD.encode(png.into_inner())
    ))
}
pub fn restore(app: &AppHandle) {
    let labels = {
        let runtime = app.state::<Runtime>();
        let mut inner = runtime.0.lock().unwrap();
        inner.busy = false;
        let labels = inner.frames.keys().cloned().collect::<Vec<_>>();
        inner.frames.clear();
        labels
    };
    for label in labels {
        if let Some(window) = app.get_webview_window(&label) {
            let _ = window.close();
        }
    }
    if let Some(window) = app.get_window("zalo") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}
#[cfg(target_os = "macos")]
#[link(name = "CoreGraphics", kind = "framework")]
unsafe extern "C" {
    fn CGPreflightScreenCaptureAccess() -> bool;
    fn CGRequestScreenCaptureAccess() -> bool;
}
pub async fn start(app: &AppHandle) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    unsafe {
        if !CGPreflightScreenCaptureAccess() {
            CGRequestScreenCaptureAccess();
            return Err("Hãy bật Ghi màn hình cho Zalo Native Rust Lab trong Cài đặt hệ thống → Quyền riêng tư & Bảo mật, rồi mở lại ứng dụng.".into());
        }
    }

    {
        let runtime = app.state::<Runtime>();
        let mut inner = runtime.0.lock().unwrap();
        if inner.busy {
            return Ok(());
        }
        inner.busy = true;
    }
    let result = collect(app).await;
    if result.is_err() {
        restore(app)
    }
    result
}
async fn collect(app: &AppHandle) -> Result<(), String> {
    for window in app.windows().values() {
        window.hide().map_err(|e| e.to_string())?;
    }
    tauri::async_runtime::spawn_blocking(|| std::thread::sleep(Duration::from_millis(750)))
        .await
        .map_err(|e| e.to_string())?;
    if app
        .webview_windows()
        .values()
        .any(|window| window.is_visible().unwrap_or(false))
    {
        return Err("Không thể ẩn cửa sổ Zalo trước khi chụp.".into());
    }
    let snapshots=tauri::async_runtime::spawn_blocking(||->Result<Vec<_>,String>{let mut result=Vec::new();for monitor in xcap::Monitor::all().map_err(|e|e.to_string())?{let x=monitor.x().map_err(|e|e.to_string())?;let y=monitor.y().map_err(|e|e.to_string())?;let w=monitor.width().map_err(|e|e.to_string())?;let h=monitor.height().map_err(|e|e.to_string())?;let scale=monitor.scale_factor().map_err(|e|e.to_string())? as f64;let image=monitor.capture_image().map_err(|e|format!("Không chụp được màn hình: {e}. Trên Mac, hãy bật Ghi màn hình cho Zalo Native Rust Lab trong Cài đặt hệ thống rồi mở lại ứng dụng."))?;result.push((x,y,w,h,scale,image));}Ok(result)}).await.map_err(|e|e.to_string())??;
    if snapshots.is_empty() {
        return Err("Không tìm thấy màn hình để chụp.".into());
    }
    for (i, (x, y, w, h, scale, image)) in snapshots.into_iter().enumerate() {
        let label = format!("capture-{i}");
        let (width, height) = if cfg!(target_os = "macos") {
            (w as f64, h as f64)
        } else {
            (w as f64 / scale, h as f64 / scale)
        };
        {
            let runtime = app.state::<Runtime>();
            runtime.0.lock().unwrap().frames.insert(
                label.clone(),
                Frame {
                    image,
                    width,
                    height,
                },
            );
        }
        let window = WebviewWindowBuilder::new(app, &label, WebviewUrl::App("capture.html".into()))
            .title("Chọn vùng chụp")
            .visible(false)
            .decorations(false)
            .resizable(false)
            .skip_taskbar(true)
            .always_on_top(true)
            .inner_size(width, height)
            .build()
            .map_err(|e| e.to_string())?;
        #[cfg(target_os = "macos")]
        window
            .set_position(tauri::LogicalPosition::new(x as f64, y as f64))
            .map_err(|e| e.to_string())?;
        #[cfg(not(target_os = "macos"))]
        window
            .set_position(tauri::PhysicalPosition::new(x, y))
            .map_err(|e| e.to_string())?;
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}
pub fn crop_rect(
    value: &Value,
    width: f64,
    height: f64,
    pixels: (u32, u32),
) -> Result<(u32, u32, u32, u32), String> {
    let read = |key: &str| {
        value[key]
            .as_f64()
            .filter(|v| v.is_finite())
            .ok_or("Vùng chụp không hợp lệ".to_string())
    };
    let x = read("x")?;
    let y = read("y")?;
    let w = read("width")?;
    let h = read("height")?;
    if width <= 0. || height <= 0. || w <= 0. || h <= 0. {
        return Err("Vùng chụp không hợp lệ".into());
    }
    let px = (x * pixels.0 as f64 / width)
        .round()
        .clamp(0., pixels.0.saturating_sub(1) as f64) as u32;
    let py = (y * pixels.1 as f64 / height)
        .round()
        .clamp(0., pixels.1.saturating_sub(1) as f64) as u32;
    let pw = ((w * pixels.0 as f64 / width).round().max(0.) as u32).min(pixels.0 - px);
    let ph = ((h * pixels.1 as f64 / height).round().max(0.) as u32).min(pixels.1 - py);
    if pw < 2 || ph < 2 {
        return Err("Vùng chụp quá nhỏ".into());
    }
    Ok((px, py, pw, ph))
}
pub fn crop(app: &AppHandle, label: &str, value: &Value) -> Result<(), String> {
    let image = {
        let runtime = app.state::<Runtime>();
        let inner = runtime.0.lock().unwrap();
        let frame = inner.frames.get(label).ok_or("Không tìm thấy vùng chụp")?;
        let (x, y, w, h) = crop_rect(value, frame.width, frame.height, frame.image.dimensions())?;
        image::imageops::crop_imm(&frame.image, x, y, w, h).to_image()
    };
    restore(app);
    preview(app, image)
}
pub fn preview(app: &AppHandle, image: RgbaImage) -> Result<(), String> {
    {
        let runtime = app.state::<Runtime>();
        runtime.0.lock().unwrap().captured = Some(image);
    }
    if let Some(previous) = app.get_webview_window("preview") {
        let _ = previous.close();
    }
    WebviewWindowBuilder::new(app, "preview", WebviewUrl::App("preview.html".into()))
        .title("Ảnh chụp màn hình")
        .inner_size(760., 590.)
        .min_inner_size(480., 400.)
        .build()
        .map_err(|e| e.to_string())?;
    Ok(())
}
pub fn image(app: &AppHandle) -> Result<RgbaImage, String> {
    app.state::<Runtime>()
        .0
        .lock()
        .unwrap()
        .captured
        .clone()
        .ok_or("Chưa có ảnh chụp".into())
}
pub fn copy(app: &AppHandle) -> Result<(), String> {
    let image = image(app)?;
    write_image(&image)
}
pub fn write_image(image: &RgbaImage) -> Result<(), String> {
    let mut clipboard = arboard::Clipboard::new().map_err(|e| e.to_string())?;
    clipboard
        .set_image(arboard::ImageData {
            width: image.width() as usize,
            height: image.height() as usize,
            bytes: Cow::Borrowed(image.as_raw()),
        })
        .map_err(|e| e.to_string())
}
pub async fn save(app: &AppHandle) -> Result<Value, String> {
    let image = image(app)?;
    let result = rfd::AsyncFileDialog::new()
        .set_file_name("Zalo-Screenshot.png")
        .add_filter("PNG", &["png"])
        .save_file()
        .await;
    let Some(file) = result else {
        return Ok(json!(false));
    };
    image
        .save_with_format(file.path(), ImageFormat::Png)
        .map_err(|e| e.to_string())?;
    Ok(json!(true))
}
pub fn native_paste(view: &Webview) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        view.with_webview(|webview| unsafe {
            let object = webview.inner() as *mut objc2::runtime::AnyObject;
            let _: () =
                objc2::msg_send![object,paste:std::ptr::null::<objc2::runtime::AnyObject>()];
        })
        .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        if !view.window().is_focused().map_err(|e| e.to_string())? {
            return Err("Hãy đưa cửa sổ Zalo ra trước rồi thử đính kèm lại.".into());
        }
        use windows::Win32::UI::Input::KeyboardAndMouse::*;
        let key = |code, up| INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: code,
                    dwFlags: if up {
                        KEYEVENTF_KEYUP
                    } else {
                        KEYBD_EVENT_FLAGS(0)
                    },
                    ..Default::default()
                },
            },
        };
        let inputs = [
            key(VK_CONTROL, false),
            key(VIRTUAL_KEY(0x56), false),
            key(VIRTUAL_KEY(0x56), true),
            key(VK_CONTROL, true),
        ];
        let sent = unsafe { SendInput(&inputs, std::mem::size_of::<INPUT>() as i32) };
        if sent != 4 {
            return Err("Không dán được ảnh. Ảnh đã ở clipboard, hãy nhấn Ctrl+V.".into());
        }
    }
    Ok(())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn retina_and_bounds() {
        assert_eq!(
            crop_rect(
                &json!({"x":10,"y":20,"width":100,"height":60}),
                1000.,
                800.,
                (2000, 1600)
            )
            .unwrap(),
            (20, 40, 200, 120)
        );
        assert_eq!(
            crop_rect(
                &json!({"x":-10,"y":-1,"width":100,"height":60}),
                1000.,
                800.,
                (2000, 1600)
            )
            .unwrap(),
            (0, 0, 200, 120)
        );
        assert!(crop_rect(
            &json!({"x":0,"y":0,"width":0,"height":1}),
            1000.,
            800.,
            (2000, 1600)
        )
        .is_err());
    }
}

pub async fn open_png(app: &AppHandle) -> Result<(), String> {
    let Some(file) = rfd::AsyncFileDialog::new()
        .add_filter("PNG", &["png"])
        .pick_file()
        .await
    else {
        return Ok(());
    };
    let path = file.path().to_path_buf();
    let image = tauri::async_runtime::spawn_blocking(move || -> Result<RgbaImage, String> {
        let reader = image::ImageReader::open(path).map_err(|e| e.to_string())?;
        let image = reader.decode().map_err(|e| e.to_string())?;
        if image.width() as u64 * image.height() as u64 > 50000000 {
            return Err("Ảnh quá lớn để xem trước.".into());
        }
        Ok(image.into_rgba8())
    })
    .await
    .map_err(|e| e.to_string())??;
    preview(app, image)
}

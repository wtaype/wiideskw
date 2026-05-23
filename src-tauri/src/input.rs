use enigo::{Axis, Button, Direction, Enigo, Keyboard, Mouse, Settings};
use screenshots::Screen;
use windows::Win32::UI::HiDpi::{
    SetProcessDpiAwarenessContext, DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2,
};
use windows::Win32::UI::WindowsAndMessaging::{
    GetSystemMetrics, SetCursorPos, SM_CXSCREEN, SM_CYSCREEN,
};

/// Procesa un evento JSON de entrada recibido desde Android
pub fn handle_event(json_str: &str) {
    let Ok(event) = serde_json::from_str::<serde_json::Value>(json_str) else {
        return;
    };

    let Ok(mut enigo) = Enigo::new(&Settings::default()) else {
        return;
    };

    match event["type"].as_str() {
        Some("mousemove") => {
            move_cursor(&event);
        }
        Some("click") => {
            let btn = match event["button"].as_str() {
                Some("right") => Button::Right,
                Some("middle") => Button::Middle,
                _ => Button::Left,
            };
            move_cursor(&event);
            let _ = enigo.button(btn, Direction::Click);
        }
        Some("mousedown") => {
            move_cursor(&event);
            let _ = enigo.button(Button::Left, Direction::Press);
        }
        Some("mouseup") => {
            let _ = enigo.button(Button::Left, Direction::Release);
        }
        Some("scroll") => {
            let delta = event["deltaY"].as_f64().unwrap_or(0.0) as i32;
            let _ = enigo.scroll(delta, Axis::Vertical);
        }
        Some("key") => {
            if let Some(key_str) = event["key"].as_str() {
                let _ = enigo.text(key_str);
            }
        }
        _ => {}
    }
}

fn move_cursor(event: &serde_json::Value) {
    let x_norm = event["x"].as_f64().unwrap_or(0.0).clamp(0.0, 1.0);
    let y_norm = event["y"].as_f64().unwrap_or(0.0).clamp(0.0, 1.0);
    let (left, top, width, height) = physical_screen_bounds();
    let x = left + (x_norm * (width - 1) as f64).round() as i32;
    let y = top + (y_norm * (height - 1) as f64).round() as i32;

    unsafe {
        let _ = SetCursorPos(x, y);
    }
}

fn physical_screen_bounds() -> (i32, i32, i32, i32) {
    let _ = unsafe { SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2) };

    if let Ok(screens) = Screen::all() {
        if let Some(screen) = screens
            .iter()
            .find(|screen| screen.display_info.is_primary)
            .or_else(|| screens.first())
        {
            let info = screen.display_info;
            return (info.x, info.y, info.width.max(1) as i32, info.height.max(1) as i32);
        }
    }

    unsafe {
        let width = GetSystemMetrics(SM_CXSCREEN).max(1);
        let height = GetSystemMetrics(SM_CYSCREEN).max(1);
        (0, 0, width, height)
    }
}

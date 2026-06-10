// lib.rs — Orquestador central: registra todos los comandos Tauri expuestos al frontend
pub mod control;
pub mod capturas;
pub mod input;
pub mod webrtc;
pub mod config;
pub mod lab1;

#[tauri::command]
fn abrir_navegador(url: String) -> Result<(), String> {
    println!("--- [TAURI BACKEND] abrir_navegador invocado con URL: {} ---", url);
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::ffi::OsStrExt;
        let url_wide: Vec<u16> = std::ffi::OsStr::new(&url)
            .encode_wide()
            .chain(std::iter::once(0))
            .collect();
        let operation_wide: Vec<u16> = std::ffi::OsStr::new("open")
            .encode_wide()
            .chain(std::iter::once(0))
            .collect();
            
        unsafe {
            #[link(name = "shell32")]
            extern "system" {
                fn ShellExecuteW(
                    hwnd: isize,
                    lp_operation: *const u16,
                    lp_file: *const u16,
                    lp_parameters: *const u16,
                    lp_directory: *const u16,
                    n_show_cmd: i32,
                ) -> isize;
            }
            let result = ShellExecuteW(
                0,
                operation_wide.as_ptr(),
                url_wide.as_ptr(),
                std::ptr::null(),
                std::ptr::null(),
                1, // SW_SHOWNORMAL = 1
            );
            if result > 32 {
                Ok(())
            } else {
                Err(format!("Error al ejecutar ShellExecuteW: {}", result))
            }
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        std::process::Command::new("open")
            .arg(url)
            .spawn()
            .map(|_| ())
            .map_err(|e| e.to_string())
    }
}

fn parse_hex_to_bgr(hex: &str) -> Option<u32> {
    let hex = hex.trim().trim_start_matches('#');
    if hex.len() != 6 {
        return None;
    }
    let r = u32::from_str_radix(&hex[0..2], 16).ok()?;
    let g = u32::from_str_radix(&hex[2..4], 16).ok()?;
    let b = u32::from_str_radix(&hex[4..6], 16).ok()?;
    Some(r | (g << 8) | (b << 16))
}

#[tauri::command]
fn cambiar_color_titulo(window: tauri::Window, bg_hex: String, tx_hex: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let hwnd = window.hwnd().map_err(|e| e.to_string())?;
        let hwnd_isize = hwnd.0 as isize;
        
        let bg_color = parse_hex_to_bgr(&bg_hex).unwrap_or(0x00000000);
        let tx_color = parse_hex_to_bgr(&tx_hex).unwrap_or(0x00FFFFFF);

        unsafe {
            #[link(name = "dwmapi")]
            extern "system" {
                fn DwmSetWindowAttribute(
                    hwnd: isize,
                    dw_attribute: u32,
                    pv_attribute: *const std::ffi::c_void,
                    cb_attribute: u32,
                ) -> i32;
            }

            // DWMWA_CAPTION_COLOR = 35
            DwmSetWindowAttribute(
                hwnd_isize,
                35,
                &bg_color as *const _ as *const std::ffi::c_void,
                std::mem::size_of::<u32>() as u32,
            );

            // DWMWA_TEXT_COLOR = 36
            DwmSetWindowAttribute(
                hwnd_isize,
                36,
                &tx_color as *const _ as *const std::ffi::c_void,
                std::mem::size_of::<u32>() as u32,
            );
        }
    }
    Ok(())
}

#[tauri::command]
fn obtener_config() -> Result<config::json::WiiConfig, String> {
    config::json::cargar_configuracion().map_err(|e| e.to_string())
}

#[tauri::command]
fn guardar_config(config: config::json::WiiConfig) -> Result<(), String> {
    config::json::guardar_configuracion(&config).map_err(|e| e.to_string())
}

#[tauri::command]
fn verificar_wol() -> Result<bool, String> {
    control::encender::wol_activo().map_err(|e| e.to_string())
}

#[tauri::command]
fn activar_wol() -> Result<(), String> {
    control::encender::activar_wol().map_err(|e| e.to_string())
}

#[tauri::command]
fn configurar_pin(pin: String) -> Result<(), String> {
    let (salt_hex, hash_hex) = config::hash::hashear_pin(&pin)
        .map_err(|e| e.to_string())?;
    let mut cfg = config::json::cargar_configuracion()
        .map_err(|e| e.to_string())?;
    cfg.seguridad.pin_hash = hash_hex;
    cfg.seguridad.pin_salt = salt_hex;
    config::json::guardar_configuracion(&cfg)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn verificar_pin_cmd(pin: String) -> Result<bool, String> {
    let cfg = config::json::cargar_configuracion()
        .map_err(|e| e.to_string())?;
    Ok(config::hash::verificar_pin(
        &pin,
        &cfg.seguridad.pin_salt,
        &cfg.seguridad.pin_hash,
    ))
}

#[tauri::command]
fn suspender_equipo() -> Result<(), String> {
    control::suspender::suspender().map_err(|e| e.to_string())
}

#[tauri::command]
fn apagar_equipo() -> Result<(), String> {
    control::apagar::apagar().map_err(|e| e.to_string())
}

#[tauri::command]
fn inyectar_teclado(texto: String) -> Result<(), String> {
    input::win32::escribir_texto(&texto).map_err(|e| e.to_string())
}

#[tauri::command]
fn inyectar_click(x: f32, y: f32, boton: String) -> Result<(), String> {
    input::win32::clic_en(x, y, &boton).map_err(|e| e.to_string())
}

#[tauri::command]
fn lib_genial(cmd: String) -> Result<(), String> {
    // Aquí llamamos a la función "ejecutar" de control::lab
    control::lab::genial(&cmd); 
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init());

    #[cfg(any(target_os = "macos", windows, target_os = "linux"))]
    {
        builder = builder
            .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
                use tauri::{Emitter, Manager};
                let _ = app.emit("deep-link://new-url", argv);
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.set_focus();
                }
            }))
            .plugin(tauri_plugin_deep_link::init())
            .setup(|app| {
                use tauri_plugin_deep_link::DeepLinkExt;
                let _ = app.deep_link().register_all();
                Ok(())
            });
    }

    builder
        .invoke_handler(tauri::generate_handler![
            obtener_config,
            guardar_config,
            verificar_wol,
            activar_wol,
            configurar_pin,
            verificar_pin_cmd,
            suspender_equipo,
            apagar_equipo,
            inyectar_teclado,
            inyectar_click,
            abrir_navegador,
            cambiar_color_titulo,
            lib_genial,
            lab1::lib_genial_lab1
        ])
        .run(tauri::generate_context!())
        .expect("error al iniciar wiidesk");
}


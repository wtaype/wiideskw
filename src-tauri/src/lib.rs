// lib.rs — Orquestador central: registra todos los comandos Tauri expuestos al frontend
pub mod tools;

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
        
        let bg_color = parse_hex_to_bgr(&bg_hex).unwrap_or(0x00000000); // Negro por defecto
        let tx_color = parse_hex_to_bgr(&tx_hex).unwrap_or(0x00FFFFFF); // Blanco por defecto

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

/// Lee la configuración del archivo wii.config.json
#[tauri::command]
fn obtener_config() -> Result<tools::config::json::WiiConfig, String> {
    tools::config::json::cargar_configuracion().map_err(|e| e.to_string())
}

/// Guarda la configuración actualizada en wii.config.json
#[tauri::command]
fn guardar_config(config: tools::config::json::WiiConfig) -> Result<(), String> {
    tools::config::json::guardar_configuracion(&config).map_err(|e| e.to_string())
}

/// Verifica si WoL está habilitado en el adaptador de red activo
#[tauri::command]
fn verificar_wol() -> Result<bool, String> {
    tools::control::encender::verificar::esta_habilitado_wol().map_err(|e| e.to_string())
}

/// Activa WoL en el adaptador de red activo vía PowerShell
#[tauri::command]
fn activar_wol() -> Result<(), String> {
    tools::control::encender::verificar::activar_wol().map_err(|e| e.to_string())
}

/// Hashea y guarda el PIN en wii.config.json (PBKDF2-SHA256 + salt)
#[tauri::command]
fn configurar_pin(pin: String) -> Result<(), String> {
    let (salt_hex, hash_hex) = tools::config::hash::hashear_pin(&pin)
        .map_err(|e| e.to_string())?;
    let mut config = tools::config::json::cargar_configuracion()
        .map_err(|e| e.to_string())?;
    config.seguridad.pin_hash = hash_hex;
    config.seguridad.pin_salt = salt_hex;
    tools::config::json::guardar_configuracion(&config)
        .map_err(|e| e.to_string())
}

/// Verifica el PIN ingresado contra el hash guardado
#[tauri::command]
fn verificar_pin_cmd(pin: String) -> Result<bool, String> {
    let config = tools::config::json::cargar_configuracion()
        .map_err(|e| e.to_string())?;
    Ok(tools::config::hash::verificar_pin(
        &pin,
        &config.seguridad.pin_salt,
        &config.seguridad.pin_hash,
    ))
}

/// Suspende el equipo Windows
#[tauri::command]
fn suspender_equipo() -> Result<(), String> {
    tools::control::apagar::win32::suspender_pc().map_err(|e| e.to_string())
}

/// Apaga el equipo Windows
#[tauri::command]
fn apagar_equipo() -> Result<(), String> {
    tools::control::apagar::win32::apagar_pc().map_err(|e| e.to_string())
}

/// Inyecta texto en el sistema vía Win32 SendInput
#[tauri::command]
fn inyectar_teclado(texto: String) -> Result<(), String> {
    tools::input::win32::escribir_texto(&texto).map_err(|e| e.to_string())
}

/// Inyecta un clic del mouse en coordenadas relativas (0.0 a 1.0)
#[tauri::command]
fn inyectar_click(x: f32, y: f32, boton: String) -> Result<(), String> {
    tools::input::win32::clic_en(x, y, &boton).map_err(|e| e.to_string())
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
            cambiar_color_titulo
        ])
        .run(tauri::generate_context!())
        .expect("error al iniciar wiidesk");
}

// lib.rs — Orquestador central: registra todos los comandos Tauri expuestos al frontend
pub mod tools;

#[tauri::command]
fn abrir_navegador(url: String) -> Result<(), String> {
    println!("--- [TAURI BACKEND] abrir_navegador invocado con URL: {} ---", url);
    std::process::Command::new("cmd")
        .args(&["/c", "start", "", &url])
        .spawn()
        .map(|_| ())
        .map_err(|e| {
            println!("--- [TAURI BACKEND] Error al abrir navegador: {} ---", e);
            e.to_string()
        })
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
        builder = builder.plugin(tauri_plugin_single_instance::init(|_app, argv, _cwd| {
            println!("Nueva instancia intentó abrirse con argumentos: {:?}", argv);
        }));
        builder = builder.plugin(tauri_plugin_deep_link::init());

        use tauri_plugin_deep_link::DeepLinkExt;
        builder = builder.setup(|app| {
            app.deep_link().register_all()?;
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
            abrir_navegador
        ])
        .run(tauri::generate_context!())
        .expect("error al iniciar wiidesk");
}

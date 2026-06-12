// lib.rs — Orquestador central: registra todos los comandos Tauri expuestos al frontend
pub mod general;
pub mod smile;
pub mod lab;

#[tauri::command]
fn abrir_navegador(url: String) -> Result<(), String> {
    general::navegador::abrir(url)
}// Abre la URL especificada en el navegador nativo del sistema.

#[tauri::command]
fn cambiar_color_titulo(window: tauri::Window, bg_hex: String, tx_hex: String) -> Result<(), String> {
    general::ventana::cambiar_color(window, bg_hex, tx_hex)
}// Aplica colores personalizados a la barra de título de la ventana en Windows.

#[tauri::command]
fn obtener_config(force: Option<bool>) -> Result<general::json::WiiConfig, String> {
    if force.unwrap_or(false) {
        smile::actualizar_red::limpiar_cache_config();
    }
    smile::actualizar_red::escanear_red_actual()
}// Obtiene la configuración de red y equipo local (escaneada en caliente si force es true).

#[tauri::command]
fn guardar_config(config: general::json::WiiConfig) -> Result<(), String> {
    smile::actualizar_red::actualizar_cache_config(config);
    Ok(())
}// Guarda los cambios de configuración del equipo local en la caché.

#[tauri::command]
fn verificar_wol() -> Result<bool, String> {
    smile::encender::wol_activo().map_err(|e| e.to_string())
}// Consulta mediante PowerShell si la recepción de Wake-on-LAN está activa.

#[tauri::command]
fn activar_wol() -> Result<(), String> {
    smile::encender::activar_wol().map_err(|e| e.to_string())
}// Habilita la recepción de Wake-on-LAN en el adaptador de red local principal.

#[tauri::command]
fn enviar_wol(mac: String, ip_broadcast: String) -> Result<(), String> {
    smile::encender::enviar_magic_packet(&mac, &ip_broadcast).map_err(|e| e.to_string())
}// Envía el paquete mágico Wake-on-LAN a la dirección MAC remota especificada.

#[tauri::command]
fn configurar_pin(pin: String) -> Result<(), String> {
    general::pin::configurar(pin)
}// Registra la configuración de PIN de seguridad local (placeholder).

#[tauri::command]
fn registrar_pin(pin: String) -> Result<(String, String), String> {
    general::hash::hashear_pin(&pin).map_err(|e| e.to_string())
}

#[tauri::command]
fn verificar_pin_cmd(pin: String) -> Result<bool, String> {
    general::pin::verificar(pin)
}// Valida la verificación de PIN local (placeholder).

#[tauri::command]
fn suspender_equipo() -> Result<(), String> {
    smile::suspender::suspender().map_err(|e| e.to_string())
}// Coloca la computadora Windows en estado de suspensión (Sleep) de bajo consumo.

#[tauri::command]
fn apagar_equipo() -> Result<(), String> {
    smile::apagar::apagar().map_err(|e| e.to_string())
}// Envía la orden inmediata de apagado del sistema operativo (shutdown).

#[tauri::command]
fn lib_genial(cmd: String) -> Result<(), String> {
    lab::lab::genial(&cmd);
    Ok(())
}// Envía el código de sonido del laboratorio (MessageBeep de Win32) al módulo de audio

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
            enviar_wol,
            configurar_pin,
            registrar_pin,
            verificar_pin_cmd,
            suspender_equipo,
            apagar_equipo,
            smile::actualizar_red::escanear_red_actual,
            abrir_navegador,
            cambiar_color_titulo,
            lib_genial
        ])
        .run(tauri::generate_context!())
        .expect("error al iniciar wiidesk");
} // Inicializa y ejecuta el ciclo de vida de la aplicación Tauri con sus plugins y comandos registrados.

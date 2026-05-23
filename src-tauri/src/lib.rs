mod capture;
mod input;
mod server;

use std::net::IpAddr;
use std::io::Write;

fn debug_log(msg: &str) {
    if let Ok(mut file) = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open("C:\\tmp\\wiidesk.log")
    {
        let _ = writeln!(file, "{}", msg);
    }
}

// ── Obtener TODAS las IPs LAN disponibles ─────────────────────────────────
fn get_all_lan_ips() -> Vec<String> {
    let mut ips = Vec::new();

    // local_ip_address::local_ip() devuelve solo la "principal"
    // Usamos list_afinet_netifas para tener TODAS las interfaces
    if let Ok(interfaces) = local_ip_address::list_afinet_netifas() {
        for (_name, ip) in &interfaces {
            if let IpAddr::V4(v4) = ip {
                let s = v4.to_string();
                // Filtrar loopback y APIPA
                if !v4.is_loopback() && !v4.is_link_local() && !s.starts_with("169.") {
                    ips.push(s);
                }
            }
        }
    }

    // Fallback si no hay nada
    if ips.is_empty() {
        if let Ok(ip) = local_ip_address::local_ip() {
            ips.push(ip.to_string());
        }
    }

    ips
}

// ── Tauri Commands ────────────────────────────────────────────────────────

/// Devuelve la IP principal (primera no-loopback IPv4)
#[tauri::command]
fn get_lan_ip() -> String {
    get_all_lan_ips()
        .into_iter()
        .next()
        .unwrap_or_else(|| "192.168.1.x".to_string())
}

/// Devuelve TODAS las IPs disponibles para que el usuario elija
#[tauri::command]
fn get_all_ips() -> Vec<String> {
    get_all_lan_ips()
}

#[tauri::command]
fn get_network_info() -> serde_json::Value {
    let all_ips = get_all_lan_ips();
    let primary = all_ips
        .first()
        .cloned()
        .unwrap_or_else(|| "192.168.1.x".to_string());
    serde_json::json!({
        "ip": primary,
        "all_ips": all_ips,
        "port": 8765
    })
}

#[tauri::command]
async fn start_ws_server(port: u16, app: tauri::AppHandle) -> Result<String, String> {
    match server::start(port, app).await {
        Ok(msg) => Ok(msg),
        Err(e) => Err(format!("Error al iniciar servidor: {}", e)),
    }
}

#[tauri::command]
async fn stop_ws_server() -> Result<(), String> {
    server::stop();
    Ok(())
}

#[tauri::command]
fn get_server_status() -> bool {
    server::is_running()
}

/// Agrega regla de Firewall de Windows para el puerto WebSocket
/// Intenta sin elevar; si falla, devuelve el comando para ejecutar manualmente
#[tauri::command]
fn setup_firewall(port: u16) -> String {
    #[cfg(windows)]
    {
        // Primero verificar si la regla ya existe
        let check = std::process::Command::new("netsh")
            .args([
                "advfirewall",
                "firewall",
                "show",
                "rule",
                "name=WiiDesk-WebSocket",
            ])
            .output();

        if let Ok(o) = &check {
            if o.status.success() && !o.stdout.is_empty() {
                let out = String::from_utf8_lossy(&o.stdout);
                if out.contains(&port.to_string()) {
                    return format!("Regla de firewall ya existe para puerto {}", port);
                }
            }
        }

        // Intentar agregar la regla
        let result = std::process::Command::new("netsh")
            .args([
                "advfirewall",
                "firewall",
                "add",
                "rule",
                "name=WiiDesk-WebSocket",
                "dir=in",
                "action=allow",
                "protocol=TCP",
                &format!("localport={}", port),
                "enable=yes",
                "profile=any",
            ])
            .output();

        match result {
            Ok(o) if o.status.success() => {
                format!("Firewall configurado: puerto {} permitido", port)
            }
            _ => {
                // Devolver comando para ejecucion manual como admin
                format!(
                    "MANUAL:netsh advfirewall firewall add rule name=\"WiiDesk-WebSocket\" dir=in action=allow protocol=TCP localport={} enable=yes",
                    port
                )
            }
        }
    }
    #[cfg(not(windows))]
    {
        format!("Puerto {} habilitado (no Windows)", port)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            debug_log("[WiiDesk] setup iniciado");
            let app_handle = app.handle().clone();
            std::thread::spawn(move || {
                debug_log("[WiiDesk] hilo servidor iniciado");
                let Ok(rt) = tokio::runtime::Builder::new_multi_thread()
                    .enable_all()
                    .build()
                else {
                    debug_log("[WiiDesk] fallo creando runtime");
                    eprintln!("[WiiDesk] No se pudo crear runtime del servidor");
                    return;
                };

                rt.block_on(async move {
                    debug_log("[WiiDesk] intentando start server 8765");
                    if let Err(e) = server::start(8765, app_handle).await {
                        debug_log(&format!("[WiiDesk] error start server: {}", e));
                        eprintln!("[WiiDesk] No se pudo iniciar el servidor automatico: {}", e);
                        return;
                    }
                    debug_log("[WiiDesk] server start ok");
                    std::future::pending::<()>().await;
                });
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_lan_ip,
            get_all_ips,
            get_network_info,
            start_ws_server,
            stop_ws_server,
            get_server_status,
            setup_firewall,
        ])
        .run(tauri::generate_context!())
        .expect("error while running WiiDesk");
}

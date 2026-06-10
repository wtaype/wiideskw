// actualizar_red.rs — Escaneo dinámico y actualización de interfaces de red

use std::process::Command;
use crate::config;

/// Detecta silenciosamente los datos de red (IP, MAC y Broadcast) usando llamadas nativas .NET en PowerShell
pub fn detectar_red_activa() -> Result<(String, String, String), Box<dyn std::error::Error>> {
    let mut cmd = Command::new("powershell");
    cmd.args(["-Command",
        "$interfaces = [System.Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces() | Where-Object { $_.OperationalStatus -eq 'Up' -and $_.NetworkInterfaceType -ne 'Loopback' }; \
         $encontrado = $false; \
         foreach ($i in $interfaces) { \
             $props = $i.GetIPProperties(); \
             $ipv4 = $props.UnicastAddresses | Where-Object { $_.Address.AddressFamily -eq 'InterNetwork' } | Select-Object -First 1; \
             if ($ipv4) { \
                 $gateways = $props.GatewayAddresses; \
                 if ($gateways.Count -gt 0) { \
                     $ip = $ipv4.Address.IPAddressToString; \
                     $broadcast = ($ip -replace '\\.\\d+$', '.255'); \
                     $mac = $i.GetPhysicalAddress().ToString(); \
                     $macDashed = ($mac -replace '..(?!$)', '$0-'); \
                     Write-Output \"$ip|$macDashed|$broadcast\"; \
                     $encontrado = $true; \
                     break; \
                 } \
             } \
         }; \
         if (-not $encontrado) { throw 'No se encontró ninguna interfaz de red activa con salida a internet' }"
    ]);
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }
    let output = cmd.output()?;
    let stdout = String::from_utf8_lossy(&output.stdout);
    let partes: Vec<&str> = stdout.trim().split('|').collect();
    if partes.len() < 3 {
        return Err(format!("No se pudo obtener información de red activa: {}", stdout.trim()).into());
    }
    Ok((partes[0].to_string(), partes[1].to_string(), partes[2].to_string()))
}

/// Comando Tauri para escanear y actualizar la configuración local con los datos de red reales
#[tauri::command]
pub fn escanear_red_actual() -> Result<config::json::WiiConfig, String> {
    let (ip, mac, broadcast) = detectar_red_activa().map_err(|e| e.to_string())?;
    let mut cfg = config::json::cargar_configuracion().map_err(|e| e.to_string())?;
    cfg.ip_local = ip;
    cfg.mac_address = mac;
    cfg.ip_broadcast = broadcast;
    config::json::guardar_configuracion(&cfg).map_err(|e| e.to_string())?;
    Ok(cfg)
}

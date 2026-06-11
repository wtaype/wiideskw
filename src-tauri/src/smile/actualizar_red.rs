// actualizar_red.rs — Escaneo dinámico y generación de configuraciones de red en caliente
use std::process::Command;
use std::sync::Mutex;
use crate::general::json;

static CONFIG_CACHE: Mutex<Option<json::WiiConfig>> = Mutex::new(None);

pub fn actualizar_cache_config(nueva_config: json::WiiConfig) {
    if let Ok(mut cache) = CONFIG_CACHE.lock() {
        *cache = Some(nueva_config);
    }
}

pub fn limpiar_cache_config() {
    if let Ok(mut cache) = CONFIG_CACHE.lock() {
        *cache = None;
    }
}

/// Genera un código de conexión determinista de 9 dígitos que comienza por '10' a partir de la dirección MAC.
pub fn generar_id_pc_reproducible(mac: &str) -> String {
    let limpia: String = mac.chars().filter(|c| c.is_alphanumeric()).collect();
    if limpia.is_empty() {
        return "100000000".to_string();
    }
    
    // Algoritmo de hash determinista reproducible
    let mut hash: u32 = 0;
    for c in limpia.chars() {
        hash = hash.wrapping_mul(31).wrapping_add(c as u32);
    }
    
    // Tomamos modulo 10,000,000 para obtener exactamente 7 dígitos
    let modulo = hash % 10_000_000;
    format!("10{:07}", modulo)
}

/// Obtiene el UUID de la placa base (BIOS) de Windows de forma silenciosa.
pub fn obtener_uuid_bios() -> Result<String, Box<dyn std::error::Error>> {
    let mut cmd = Command::new("powershell");
    cmd.args(["-Command", "(Get-CimInstance Win32_ComputerSystemProduct).Uuid"]);
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }
    let output = cmd.output()?;
    let uuid = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if uuid.is_empty() {
        return Err("El UUID obtenido está vacío".into());
    }
    Ok(uuid)
}

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

/// Comando Tauri para escanear y generar la configuración de red en caliente de forma dinámica
#[tauri::command]
pub fn escanear_red_actual() -> Result<json::WiiConfig, String> {
    // Intentar leer de la caché primero para optimizar RAM/CPU
    {
        if let Ok(cache) = CONFIG_CACHE.lock() {
            if let Some(ref config) = *cache {
                return Ok(config.clone());
            }
        }
    }

    let (ip, mac, broadcast) = detectar_red_activa().map_err(|e| e.to_string())?;
    
    // Obtener el nombre del Host nativo de Windows (COMPUTERNAME)
    let nombre_pc = std::env::var("COMPUTERNAME")
        .unwrap_or_else(|_| "Host-Wiidesk".to_string());
        
    let uuid_or_mac = obtener_uuid_bios().unwrap_or_else(|_| mac.clone());
    let id_pc = generar_id_pc_reproducible(&uuid_or_mac);

    let config = json::WiiConfig {
        dispositivo_nombre: nombre_pc,
        ip_local: ip,
        mac_address: mac,
        ip_broadcast: broadcast,
        dominio_remoto: "https://wiidesk.web.app".to_string(),
        id_pc,
        seguridad: json::SeguridadConfig {
            requerir_pin: true,
            pin_hash: "".to_string(),
            pin_salt: "".to_string(),
        },
    };

    // Almacenar en la caché
    {
        if let Ok(mut cache) = CONFIG_CACHE.lock() {
            *cache = Some(config.clone());
        }
    }

    Ok(config)
}

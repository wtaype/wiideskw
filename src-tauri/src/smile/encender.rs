// encender.rs — Wake-on-LAN: verificar, activar y enviar paquetes mágicos

use std::process::Command;
use std::net::UdpSocket;

pub fn wol_activo() -> Result<bool, Box<dyn std::error::Error>> {
    let mut cmd = Command::new("powershell");
    cmd.args(["-Command",
        "(Get-NetAdapterPowerManagement | Where-Object { $_.WakeOnMagicPacket -eq 'Enabled' }).Count -gt 0"
    ]);
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }
    let output = cmd.output()?;
    let resultado = String::from_utf8_lossy(&output.stdout).trim().to_lowercase();
    Ok(resultado == "true")
}// Consulta mediante PowerShell si la recepción de Wake-on-LAN está activa.

pub fn activar_wol() -> Result<(), Box<dyn std::error::Error>> {
    let mut cmd = Command::new("powershell");
    cmd.args(["-Command",
        "Get-NetAdapter | Where-Object { $_.Status -eq 'Up' } | Enable-NetAdapterPowerManagement -WakeOnMagicPacket Enabled -Confirm:$false"
    ]);
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }
    cmd.output()?;
    Ok(())
}// Habilita la recepción de Wake-on-LAN en el adaptador de red local principal.

pub fn enviar_magic_packet(mac: &str, ip_broadcast: &str) -> Result<(), Box<dyn std::error::Error>> {
    let limpia: String = mac.chars().filter(|c| c.is_alphanumeric()).collect();
    if limpia.len() != 12 {
        return Err("La dirección MAC debe tener exactamente 12 caracteres hexadecimales".into());
    }

    let mut mac_bytes = [0u8; 6];
    for idx in 0..6 {
        let start = idx * 2;
        let hex_pair = &limpia[start..start + 2];
        mac_bytes[idx] = u8::from_str_radix(hex_pair, 16)?;
    }

    let mut packet = [0u8; 102];
    for i in 0..6 {
        packet[i] = 0xFF;
    }
    for i in 0..16 {
        let start = 6 + i * 6;
        packet[start..start + 6].copy_from_slice(&mac_bytes);
    }

    let socket = UdpSocket::bind("0.0.0.0:0")?;
    socket.set_broadcast(true)?;
    let dest = format!("{}:9", ip_broadcast);
    socket.send_to(&packet, &dest)?;

    Ok(())
}// Envía un paquete mágico estándar de Wake-on-LAN (WoL) por UDP broadcast al puerto 9.

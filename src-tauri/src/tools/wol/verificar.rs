// verificar.rs — Verifica y activa Wake-on-LAN en el adaptador de red

use std::process::Command;

pub fn esta_habilitado_wol() -> Result<bool, Box<dyn std::error::Error>> {
    let output = Command::new("powershell")
        .args(["-Command",
            "(Get-NetAdapterPowerManagement | Where-Object { $_.WakeOnMagicPacket -eq 'Enabled' }).Count -gt 0"
        ])
        .output()?;
    let resultado = String::from_utf8_lossy(&output.stdout).trim().to_lowercase();
    Ok(resultado == "true")
}

pub fn activar_wol() -> Result<(), Box<dyn std::error::Error>> {
    Command::new("powershell")
        .args(["-Command",
            "Get-NetAdapter | Where-Object { $_.Status -eq 'Up' } | Enable-NetAdapterPowerManagement -WakeOnMagicPacket Enabled -Confirm:$false"
        ])
        .output()?;
    Ok(())
}

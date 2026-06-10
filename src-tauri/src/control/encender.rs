// encender.rs — Wake-on-LAN: verificar y activar

use std::process::Command;

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
}

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
}

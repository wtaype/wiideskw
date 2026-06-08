// win32.rs — Control de energía del equipo (suspensión y apagado)

use std::process::Command;

pub fn suspender_pc() -> Result<(), Box<dyn std::error::Error>> {
    Command::new("powershell")
        .args(["-Command", "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState('Suspend', $false, $false)"])
        .output()?;
    Ok(())
}

pub fn apagar_pc() -> Result<(), Box<dyn std::error::Error>> {
    Command::new("shutdown")
        .args(["/s", "/t", "0"])
        .output()?;
    Ok(())
}

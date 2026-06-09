// win32.rs — Control de energía del equipo (suspensión y apagado)

use std::process::Command;

pub fn suspender_pc() -> Result<(), Box<dyn std::error::Error>> {
    let mut cmd = Command::new("powershell");
    cmd.args(["-Command", "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState('Suspend', $false, $false)"]);
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }
    cmd.output()?;
    Ok(())
}

pub fn apagar_pc() -> Result<(), Box<dyn std::error::Error>> {
    let mut cmd = Command::new("shutdown");
    cmd.args(["/s", "/t", "0"]);
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }
    cmd.output()?;
    Ok(())
}

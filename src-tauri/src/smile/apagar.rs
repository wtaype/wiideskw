// apagar.rs — Apagado del equipo Windows

use std::process::Command;

pub fn apagar() -> Result<(), Box<dyn std::error::Error>> {
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

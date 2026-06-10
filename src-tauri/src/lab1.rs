// lab1.rs — Backend de aprendizaje: ejecuta MessageBeep de Windows para comandos recibidos de RTDB
use tauri::command;

#[command]
pub fn lib_genial_lab1(cmd: String) -> Result<(), String> {
    println!("--- [TAURI BACKEND] lib_genial_lab1 invocado con comando: {} ---", cmd);
    // El "match" evalúa el comando recibido y le asigna un sonido nativo de Windows
    match cmd.as_str() {
        "hello"  => beep(0x00000040), // Sonido estándar de notificación (Asterisk)
        "error"  => beep(0x00000010), // Sonido de detención crítica (Critical Stop)
        "alerta" => beep(0x00000030), // Sonido de exclamación/advertencia (Exclamation)
        _        => {}                // No hace nada
    }
    Ok(())
}

/// Llama a la API de Windows (Win32) con el código del sonido seleccionado
fn beep(sound_type: u32) {
    #[cfg(target_os = "windows")]
    unsafe {
        // Enlaza dinámicamente con la librería de usuario de Windows (user32.dll)
        #[link(name = "user32")]
        extern "system" {
            fn MessageBeep(utype: u32) -> i32;
        }
        MessageBeep(sound_type);
    }
}

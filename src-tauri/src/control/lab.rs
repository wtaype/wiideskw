// lab.rs — Backend: Ejecución de sonidos nativos del sistema

pub fn genial(cmd: &str) {
    // El "match" evalúa el comando recibido y le asigna un sonido nativo de Windows
    match cmd {
        "hola"   => beep(0x00000040), // Sonido estándar de notificación (Asterisk) para 'hola'
        "hello"  => beep(0x00000010), // Pitido simple por defecto (Simple Beep) para 'hello'
        "error"  => beep(0x00000010), // Sonido de detención crítica (Critical Stop)
        "alerta" => beep(0x00000030), // Sonido de exclamación/advertencia (Exclamation)
        _        => {}                // Para cualquier otro comando (o "ninguno"), no hace nada
    }
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
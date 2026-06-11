// navegador.rs — Abre URLs nativamente en el navegador predeterminado del sistema operativo

pub fn abrir(url: String) -> Result<(), String> {
    println!("--- [TAURI BACKEND] abrir_navegador invocado con URL: {} ---", url);
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::ffi::OsStrExt;
        let url_wide: Vec<u16> = std::ffi::OsStr::new(&url)
            .encode_wide()
            .chain(std::iter::once(0))
            .collect();
        let operation_wide: Vec<u16> = std::ffi::OsStr::new("open")
            .encode_wide()
            .chain(std::iter::once(0))
            .collect();
            
        unsafe {
            #[link(name = "shell32")]
            extern "system" {
                fn ShellExecuteW(
                    hwnd: isize,
                    lp_operation: *const u16,
                    lp_file: *const u16,
                    lp_parameters: *const u16,
                    lp_directory: *const u16,
                    n_show_cmd: i32,
                ) -> isize;
            }
            let result = ShellExecuteW(
                0,
                operation_wide.as_ptr(),
                url_wide.as_ptr(),
                std::ptr::null(),
                std::ptr::null(),
                1, // SW_SHOWNORMAL = 1
            );
            if result > 32 {
                Ok(())
            } else {
                Err(format!("Error al ejecutar ShellExecuteW: {}", result))
            }
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        std::process::Command::new("open")
            .arg(url)
            .spawn()
            .map(|_| ())
            .map_err(|e| e.to_string())
    }
} // Abre la URL provista en el navegador nativo del sistema operativo (Win32 o open).

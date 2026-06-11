// ventana.rs — Cambia el color de la barra de título de la ventana de Windows (DWM caption color)

pub fn cambiar_color(window: tauri::Window, bg_hex: String, tx_hex: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let hwnd = window.hwnd().map_err(|e| e.to_string())?;
        let hwnd_isize = hwnd.0 as isize;
        
        let bg_color = parse_hex_to_bgr(&bg_hex).unwrap_or(0x00000000);
        let tx_color = parse_hex_to_bgr(&tx_hex).unwrap_or(0x00FFFFFF);

        unsafe {
            #[link(name = "dwmapi")]
            extern "system" {
                fn DwmSetWindowAttribute(
                    hwnd: isize,
                    dw_attribute: u32,
                    pv_attribute: *const std::ffi::c_void,
                    cb_attribute: u32,
                ) -> i32;
            }

            // DWMWA_CAPTION_COLOR = 35
            DwmSetWindowAttribute(
                hwnd_isize,
                35,
                &bg_color as *const _ as *const std::ffi::c_void,
                std::mem::size_of::<u32>() as u32,
            );

            // DWMWA_TEXT_COLOR = 36
            DwmSetWindowAttribute(
                hwnd_isize,
                36,
                &tx_color as *const _ as *const std::ffi::c_void,
                std::mem::size_of::<u32>() as u32,
            );
        }
    }
    Ok(())
} // Cambia el color de fondo y texto de la barra de título de la ventana usando DWM de Windows.

fn parse_hex_to_bgr(hex: &str) -> Option<u32> {
    let hex = hex.trim().trim_start_matches('#');
    if hex.len() != 6 {
        return None;
    }
    let r = u32::from_str_radix(&hex[0..2], 16).ok()?;
    let g = u32::from_str_radix(&hex[2..4], 16).ok()?;
    let b = u32::from_str_radix(&hex[4..6], 16).ok()?;
    Some(r | (g << 8) | (b << 16))
} // Parsea un color en formato hexadecimal de CSS (#RRGGBB) a formato BGR de Win32.

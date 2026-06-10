// win32.rs — Inyección de inputs de teclado y mouse vía Win32 SendInput
// TODO: Implementar con winapi o windows-rs crate

pub fn escribir_texto(texto: &str) -> Result<(), Box<dyn std::error::Error>> {
    todo!("Implementar inyección de teclado Win32: {}", texto)
}

pub fn clic_en(x: f32, y: f32, boton: &str) -> Result<(), Box<dyn std::error::Error>> {
    todo!("Implementar clic en ({}, {}) botón {}", x, y, boton)
}

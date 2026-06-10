// json.rs — Leer y escribir wii.config.json con serde_json

use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::{Read, Write};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SeguridadConfig {
    pub requerir_pin: bool,
    pub pin_hash: String,
    pub pin_salt: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct WiiConfig {
    pub dispositivo_nombre: String,
    pub ip_local: String,
    pub mac_address: String,
    pub ip_broadcast: String,
    pub dominio_remoto: String,
    pub seguridad: SeguridadConfig,
}

pub fn cargar_configuracion() -> Result<WiiConfig, Box<dyn std::error::Error>> {
    let mut archivo = File::open(".env.json")?;
    let mut contenido = String::new();
    archivo.read_to_string(&mut contenido)?;
    Ok(serde_json::from_str(&contenido)?)
}

pub fn guardar_configuracion(config: &WiiConfig) -> Result<(), Box<dyn std::error::Error>> {
    let mut archivo = File::create(".env.json")?;
    let contenido = serde_json::to_string_pretty(config)?;
    archivo.write_all(contenido.as_bytes())?;
    Ok(())
}

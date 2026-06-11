// json.rs — Estructuras WiiConfig y SeguridadConfig en memoria para Tauri sin persistencia local en disco
use serde::{Deserialize, Serialize};

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
    pub id_pc: String,
    pub seguridad: SeguridadConfig,
}

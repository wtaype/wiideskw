// hash.rs — Hashing seguro de PIN con PBKDF2-SHA256 + salt aleatorio
// Nunca se guarda el PIN original en ningún archivo

use ring::pbkdf2;
use ring::rand::{SecureRandom, SystemRandom};
use std::num::NonZeroU32;

const CREDENTIAL_LEN: usize = 32;
const N_ITER: u32 = 100_000;

/// Genera (salt_hex, hash_hex) a partir del PIN en texto plano
pub fn hashear_pin(pin: &str) -> Result<(String, String), Box<dyn std::error::Error>> {
    let rng = SystemRandom::new();
    let mut salt = [0u8; 16];
    rng.fill(&mut salt).map_err(|_| "Error al generar salt aleatorio con ring".to_string())?;

    let mut hash = [0u8; CREDENTIAL_LEN];
    pbkdf2::derive(
        pbkdf2::PBKDF2_HMAC_SHA256,
        NonZeroU32::new(N_ITER).unwrap(),
        &salt,
        pin.as_bytes(),
        &mut hash,
    );

    Ok((hex::encode(salt), hex::encode(hash)))
}

/// Verifica el PIN contra el salt y hash guardados en wii.config.json
pub fn verificar_pin(pin: &str, salt_hex: &str, hash_hex: &str) -> bool {
    let Ok(salt) = hex::decode(salt_hex) else { return false };
    let Ok(hash_guardado) = hex::decode(hash_hex) else { return false };

    pbkdf2::verify(
        pbkdf2::PBKDF2_HMAC_SHA256,
        NonZeroU32::new(N_ITER).unwrap(),
        &salt,
        pin.as_bytes(),
        &hash_guardado,
    ).is_ok()
}

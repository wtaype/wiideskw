// signaling.rs — Intercambio de SDP/ICE con Firestore REST API
// TODO: Implementar con reqwest

pub fn enviar_oferta(host_id: &str, _sdp: &str) -> Result<(), Box<dyn std::error::Error>> {
    todo!("Implementar envío de oferta SDP para hostId: {}", host_id)
}

pub fn obtener_respuesta(host_id: &str) -> Result<Option<String>, Box<dyn std::error::Error>> {
    todo!("Implementar polling de respuesta SDP para hostId: {}", host_id)
}

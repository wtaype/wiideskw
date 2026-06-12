// src/usuarios/movil2pc/hero.js — Componente de visualización de cabecera y estado
import { getEstado } from '../estados/estados.js';

export const render = () => {
  const estadoConexion = getEstado('movil2pcEstado') || 'apagado';

  const statusTexts = {
    apagado: 'Desconectado',
    esperando: 'Esperando Móvil...',
    conectando: 'Conectando...',
    conectado: 'Transmitiendo'
  };

  const statusDotClass = `wd_status_${estadoConexion === 'apagado' ? 'inactivo' : estadoConexion === 'conectado' ? 'conectado' : 'esperando'}`;

  return `
    <div class="m2p_header">
      <div class="m2p_title_section">
        <h2><i class="fas fa-mobile-alt"></i> Transmisión: Móvil a PC</h2>
        <p>Mira y controla la pantalla de tu computadora desde tu celular a través de WebRTC de alta velocidad.</p>
      </div>
      <div class="m2p_status_indicator">
        <span class="m2p_dot ${statusDotClass}"></span>
        <span class="m2p_status_txt">${statusTexts[estadoConexion]}</span>
      </div>
    </div>
  `;
};

export const init = () => {};
export const cleanup = () => {};

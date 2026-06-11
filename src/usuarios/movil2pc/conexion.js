// src/usuarios/movil2pc/conexion.js — Componente de visualización del QR, ID y Cabecera de Estado
import { getEstado } from '../estados/estados.js';
import { auth } from '../../firebase.js';
import { wicopy } from '../../widev.js';
import QRCode from 'qrcode';

/**
 * Pinta el código QR de conexión en el canvas
 */
export const pintarCodigoQR = () => {
  const canvas = document.getElementById('m2p-qr');
  const user = auth.currentUser;
  const idPc = getEstado('movil2pcIdPc');
  if (!canvas || !idPc || !user) return;

  try {
    QRCode.toCanvas(
      canvas,
      JSON.stringify({
        tipo: 'movil2pc',
        idPc: idPc,
        userId: user.uid
      }),
      {
        width: 180,
        margin: 1,
        color: {
          dark: '#00f3ff',
          light: '#151b2e'
        }
      },
      (err) => {
        if (err) console.error('[Móvil2PC] Error al pintar código QR:', err);
      }
    );
  } catch (err) {
    console.error('[Móvil2PC] Fallo al generar código QR:', err);
  }
};

export const render = () => {
  const idPc = getEstado('movil2pcIdPc') || '';
  const estadoConexion = getEstado('movil2pcEstado') || 'apagado';

  const statusTexts = {
    apagado: 'Desconectado',
    esperando: 'Esperando Móvil...',
    conectando: 'Conectando...',
    conectado: 'Transmitiendo'
  };

  const statusDotClass = `wd_status_${estadoConexion === 'apagado' ? 'inactivo' : estadoConexion === 'conectado' ? 'conectado' : 'esperando'}`;
  
  // Formatear el idPc en grupos de 3: 102 345 678
  const formattedIdPc = idPc 
    ? `${idPc.substring(0, 3)} ${idPc.substring(3, 6)} ${idPc.substring(6, 9)}`
    : '------';

  return `
    <!-- COLUMNA CONEXIÓN Y QR -->
    <div class="m2p_card m2p_conexion">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3vh; border-bottom: 1px solid var(--brd); padding-bottom: 2vh; flex-wrap: wrap; gap: 1vh;">
        <div>
          <h2 style="font-size: var(--fz_l1); color: var(--tx1); margin: 0;"><i class="fas fa-mobile-alt"></i> Transmisión: Móvil a PC</h2>
          <p class="m2p_card_subtitle" style="margin: 0.5vh 0 0 0; font-size: var(--fz_s3);">Mira y controla la pantalla de tu computadora desde tu celular.</p>
        </div>
        <div class="m2p_status_indicator" style="margin: 0; background: var(--bg3); padding: 0.8vh 1.5vh; border-radius: 0.8vh; border: 1px solid var(--brd);">
          <span class="m2p_dot ${statusDotClass}"></span>
          <span class="m2p_status_txt" style="font-weight: 700; font-size: var(--fz_s3); color: var(--tx1);">${statusTexts[estadoConexion]}</span>
        </div>
      </div>

      <p class="m2p_card_subtitle" style="margin-bottom: 3vh;">Escanea el código QR o digita el ID de conexión en tu celular para ver tu pantalla.</p>
      
      <div class="m2p_qr_wrapper">
        <canvas id="m2p-qr" class="m2p_qr_canvas" width="180" height="180"></canvas>
        
        <div class="m2p_pin_box">
          <span class="m2p_pin_lbl">ID DE ESTA PC</span>
          <strong id="m2p-pc-id-label" class="m2p_pin_val" title="Click para copiar">${formattedIdPc}</strong>
        </div>
      </div>
    </div>
  `;
};

export const init = () => {
  // Copiar ID de la PC al portapapeles
  const idLabel = document.getElementById('m2p-pc-id-label');
  if (idLabel) {
    idLabel.onclick = function() {
      const idPc = getEstado('movil2pcIdPc');
      if (idPc) {
        wicopy(idPc, this, '¡ID Copiado!');
      }
    };
  }

  // Pintar el QR
  pintarCodigoQR();
};

export const cleanup = () => {};

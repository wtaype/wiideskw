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
  
  // Formatear el idPc en grupos de 3: 102 345 678
  const formattedIdPc = idPc 
    ? `${idPc.substring(0, 3)} ${idPc.substring(3, 6)} ${idPc.substring(6, 9)}`
    : '------';

  return `
    <!-- COLUMNA CONEXIÓN Y QR -->
    <div class="m2p_card m2p_conexion">
      <h3><i class="fa-solid fa-qrcode"></i> Código de Conexión</h3>
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

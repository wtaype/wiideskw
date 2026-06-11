// usuarios/smile/local.js — Componente del Host Local con Registro Manual y Seguridad de Auth
import { getls, Notificacion, wiSpin } from '../../widev.js';
import { db } from '../../firebase.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import QRCode from 'qrcode';
import { registrarCodigoConexion } from '../servicios/pcs.js';
import { invocarTauri, formatearCodigo9Digitos } from './utils.js';

let localConfig = null;
let cargandoLocal = true;
let estaRegistrado = false;

const handleHostnameChange = (e) => {
  const nuevoNombre = e.target.value.trim();
  if (!nuevoNombre) {
    Notificacion('El nombre no puede estar vacío', 'warning');
    if (localConfig) e.target.value = localConfig.dispositivo_nombre;
    return;
  }
  if (localConfig) {
    localConfig.dispositivo_nombre = nuevoNombre;
    estaRegistrado = false;
    actualizarVistaLocal();
  }
};

const handleRegistrarLocal = async (e) => {
  const btn = e.target.closest('#btn-registrar-local');
  if (!btn || !localConfig) return;

  wiSpin(btn, true);
  try {
    const user = getls('wiSmile') || {};
    if (!user || !user.email) {
      Notificacion('No se encontró sesión de usuario', 'error');
      return;
    }

    // Forzar escaneo fresco de la red del sistema en caliente
    const freshConfig = await invocarTauri('obtener_config', { force: true });
    if (freshConfig) {
      localConfig = freshConfig;
    }

    const uid = user.userId || user.uid || '';

    const usuarioSanitizado = (user.usuario || 'user').trim().toLowerCase().replace(/[@.]/g, '_');
    const idEquipo = `${usuarioSanitizado}_${localConfig.dispositivo_nombre.toLowerCase()}`;
    
    // 1. Registrar código único en '/pcs'
    const idPc = await registrarCodigoConexion(uid, idEquipo);
    if (!idPc) {
      throw new Error('No se pudo generar o validar el código único de conexión.');
    }
    localConfig.id_pc = idPc;

    // 2. Registrar en '/equipos'
    const docRef = doc(db, 'equipos', idEquipo);
    await setDoc(docRef, {
      idEquipo:    idEquipo,
      userId:      uid,
      email:       user.email,
      idPc:        idPc,
      equipo:      localConfig.dispositivo_nombre,
      localIp:     localConfig.ip_local || '',
      macAddress:  localConfig.mac_address || '',
      ipBroadcast: localConfig.ip_broadcast || '',
      actualizado: serverTimestamp(),
      comando:     'ninguno'
    }, { merge: true });

    estaRegistrado = true;
    actualizarVistaLocal();
    Notificacion('Equipo registrado con éxito en la nube', 'success');
  } catch (err) {
    console.error('[Local] Error al registrar equipo:', err);
    Notificacion('Error al registrar equipo en la nube', 'error');
  } finally {
    wiSpin(btn, false);
  }
};

const generarQRConexion = async () => {
  const canvas = document.getElementById('local-qr');
  if (!canvas || !localConfig?.id_pc) return;

  try {
    const user = getls('wiSmile') || {};
    const uid = user.userId || user.uid || '';
    const usuarioSanitizado = (user.usuario || 'user').trim().toLowerCase().replace(/[@.]/g, '_');
    const idEquipo = `${usuarioSanitizado}_${localConfig.dispositivo_nombre.toLowerCase()}`;
    
    const qrData = JSON.stringify({
      idPc: localConfig.id_pc,
      equipoId: idEquipo,
      userId: uid
    });

    await QRCode.toCanvas(canvas, qrData, {
      width: 160,
      margin: 1,
      color: {
        dark: '#00f3ff',
        light: '#151b2e'
      }
    });
  } catch (err) {
    console.error('[Local] Error al dibujar QR:', err);
  }
};

const actualizarVistaLocal = async () => {
  const container = document.getElementById('local-host-card');
  if (!container) return;

  if (cargandoLocal) {
    container.innerHTML = `<div class="wd_skeleton_card"></div>`;
    return;
  }

  if (!localConfig) {
    container.innerHTML = `
      <div class="ad_empty">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <p>No se pudo obtener la configuración local</p>
      </div>
    `;
    return;
  }

  const badgeClass = estaRegistrado ? 'wd_badge_online' : 'wd_badge_offline';
  const badgeTexto = estaRegistrado ? 'Sincronizado' : 'Sin Sincronizar';
  const badgeIco = estaRegistrado ? 'fa-cloud' : 'fa-cloud-slash';
  const btnTexto = estaRegistrado ? 'Sincronizar con la Nube' : 'Registrar en la Nube';

  container.innerHTML = `
    <div class="wd_host_details">
      <div class="wd_host_row">
        <span class="wd_host_label">Estado Nube</span>
        <span class="wd_badge ${badgeClass}"><i class="fa-solid ${badgeIco}"></i> ${badgeTexto}</span>
      </div>
      <div class="wd_host_row">
        <span class="wd_host_label">Nombre del Host</span>
        <input type="text" id="local-hostname-input" class="wd_host_input" value="${localConfig.dispositivo_nombre || ''}" />
      </div>
      <div class="wd_host_row">
        <span class="wd_host_label">Dirección IP</span>
        <span class="wd_host_val">${localConfig.ip_local || '—'}</span>
      </div>
      <div class="wd_host_row">
        <span class="wd_host_label">Dirección MAC</span>
        <span class="wd_host_val">${localConfig.mac_address || '—'}</span>
      </div>
      <div class="wd_host_row">
        <span class="wd_host_label">IP Broadcast</span>
        <span class="wd_host_val">${localConfig.ip_broadcast || '—'}</span>
      </div>
    </div>

    <div class="wd_pairing_box">
      <span class="wd_host_label">Código de Conexión</span>
      <div class="wd_pairing_code" id="local-pc-code">${formatearCodigo9Digitos(localConfig.id_pc)}</div>
      <canvas id="local-qr" class="wd_qr_canvas" width="160" height="160"></canvas>
      <span class="wd_empty_note" style="text-align: center; margin-top: 1vh;">
        Escanea este código QR desde la App móvil para vincular este equipo.
      </span>
    </div>

    <button id="btn-registrar-local" class="wd_btn wd_btn_primary" style="margin-top: 2.5vh;">
      <i class="fa-solid fa-cloud-arrow-up"></i> ${btnTexto}
    </button>
  `;

  // Registrar listeners para el input de hostname
  const inputEl = document.getElementById('local-hostname-input');
  if (inputEl) {
    inputEl.addEventListener('change', handleHostnameChange);
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        inputEl.blur();
      }
    });
  }

  // Registrar click para el botón de registro
  const btnReg = document.getElementById('btn-registrar-local');
  if (btnReg) {
    btnReg.addEventListener('click', handleRegistrarLocal);
  }

  // Generar el código QR
  await generarQRConexion();
};

export const render = () => {
  return `
    <div class="wd_col" id="local-host-container">
      <h2 class="wd_panel_title"><i class="fa-solid fa-desktop"></i> Este Equipo</h2>
      <div class="wd_card" id="local-host-card">
        <div class="wd_skeleton_card"></div>
      </div>
    </div>
  `;
};

export const init = async (uid, user) => {
  cargandoLocal = true;
  localConfig = null;
  estaRegistrado = false;
  actualizarVistaLocal();

  try {
    localConfig = await invocarTauri('obtener_config');
  } catch (err) {
    console.error('[Local] Error al invocar config en Tauri:', err);
  }

  if (localConfig && uid) {
    try {
      if (localConfig.id_pc) {
        const pcSnap = await getDoc(doc(db, 'pcs', localConfig.id_pc));
        estaRegistrado = pcSnap.exists();
      } else {
        estaRegistrado = false;
      }
    } catch (err) {
      console.error('[Local] Error al verificar registro local via pcs:', err);
      estaRegistrado = false;
    }
  }

  cargandoLocal = false;
  actualizarVistaLocal();
};

export const cleanup = () => {
  const inputEl = document.getElementById('local-hostname-input');
  if (inputEl) {
    inputEl.removeEventListener('change', handleHostnameChange);
  }
  const btnReg = document.getElementById('btn-registrar-local');
  if (btnReg) {
    btnReg.removeEventListener('click', handleRegistrarLocal);
  }
  localConfig = null;
};

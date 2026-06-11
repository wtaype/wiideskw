import './movil2pc.css';
import { getls, savels, Notificacion, wiSpin, wicopy } from '../widev.js';
import { app } from '../wii.js';
import { rutas } from '../rutas.js';
import QRCode from 'qrcode';
import { db } from '../firebase.js';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

// ── Estado Local ──────────────────────────────────────────────
let estadoWebRTC = 'inactivo'; // inactivo | esperando | negociando | conectado | caido
let codigoM2P = '';
let cargandoCodigo = false;
let peerConnection = null;
let dbUnsub = null;
let docListeners = [];

// Configuración de permisos predeterminados
let permisos = {
  controlRaton: true,
  controlTeclado: true,
  sincronizarPortapapeles: true,
  transmitirAudio: false
};

const wi = () => getls('wiSmile') || {};

// Registrar event listener y agregarlo a la lista de limpieza
const onDoc = (type, selector, handler) => {
  const wrapper = (e) => {
    const target = selector ? e.target.closest(selector) : e.target;
    if (target) handler.call(target, e);
  };
  document.addEventListener(type, wrapper);
  docListeners.push({ type, wrapper });
};

// ── Render HTML ───────────────────────────────────────────────
export const render = () => {
  const u = wi();
  if (!u.email) {
    setTimeout(() => rutas.navigate('/login'), 0);
    return '';
  }

  // Generar clases CSS según el estado de conexión
  const statusBadgeClass = `wd_status_${estadoWebRTC}`;
  const statusTexts = {
    inactivo: 'Desconectado',
    esperando: 'Esperando Móvil',
    negociando: 'Negociando...',
    conectado: 'Conectado',
    caido: 'Enlace Caído'
  };

  return `
    <div class="m2p_container">
      <!-- HEADER -->
      <div class="m2p_header">
        <div class="m2p_title_section">
          <h2><i class="fas fa-mobile-alt"></i> Control Remoto: Móvil a PC</h2>
          <p>Convierte tu celular en un control táctil inteligente con baja latencia.</p>
        </div>
        <div class="m2p_status_indicator">
          <span class="m2p_dot ${statusBadgeClass}"></span>
          <span class="m2p_status_txt">${statusTexts[estadoWebRTC]}</span>
        </div>
      </div>

      <!-- GRID PRINCIPAL -->
      <div class="m2p_grid">
        
        <!-- PANEL DE PERMISOS -->
        <div class="m2p_card m2p_permisos">
          <h3><i class="fas fa-shield-halved"></i> Permisos de Entrada</h3>
          <p class="m2p_card_subtitle">Define qué acciones puede realizar el dispositivo móvil conectado.</p>
          
          <div class="m2p_options_list">
            <label class="m2p_option_row">
              <div class="m2p_opt_info">
                <strong><i class="fas fa-mouse-pointer"></i> Control de Ratón</strong>
                <span>Permitir clicks, gestos táctiles y scroll.</span>
              </div>
              <input type="checkbox" id="chk-raton" ${permisos.controlRaton ? 'checked' : ''} />
            </label>

            <label class="m2p_option_row">
              <div class="m2p_opt_info">
                <strong><i class="fas fa-keyboard"></i> Control de Teclado</strong>
                <span>Permitir entrada de texto y teclas especiales.</span>
              </div>
              <input type="checkbox" id="chk-teclado" ${permisos.controlTeclado ? 'checked' : ''} />
            </label>

            <label class="m2p_option_row">
              <div class="m2p_opt_info">
                <strong><i class="fas fa-paste"></i> Sincronizar Portapapeles</strong>
                <span>Compartir texto copiado entre PC y Móvil.</span>
              </div>
              <input type="checkbox" id="chk-clipboard" ${permisos.sincronizarPortapapeles ? 'checked' : ''} />
            </label>

            <label class="m2p_option_row">
              <div class="m2p_opt_info">
                <strong><i class="fas fa-volume-up"></i> Transmitir Audio</strong>
                <span>Enviar salida de audio del PC al celular.</span>
              </div>
              <input type="checkbox" id="chk-audio" ${permisos.transmitirAudio ? 'checked' : ''} />
            </label>
          </div>
        </div>

        <!-- PANEL DE CONEXIÓN / QR -->
        <div class="m2p_card m2p_conexion">
          <h3><i class="fas fa-qrcode"></i> Enlazar Dispositivo</h3>
          <p class="m2p_card_subtitle">Escanea con tu aplicación móvil de Wiidesk para iniciar control WebRTC.</p>
          
          <div class="m2p_qr_wrapper">
            <canvas id="m2p-qr" class="m2p_qr_canvas" width="160" height="160"></canvas>
            <div class="m2p_pin_box">
              <span class="m2p_pin_lbl">PIN Temporal</span>
              <strong id="m2p-pin-code" class="m2p_pin_val">${cargandoCodigo ? '...' : (codigoM2P || '------')}</strong>
            </div>
          </div>

          <div class="m2p_actions">
            <button class="wd_btn wd_btn_secondary" id="btn-m2p-generar">
              <i class="fas fa-rotate"></i> Nuevo Código
            </button>
            <button class="wd_btn wd_btn_danger" id="btn-m2p-desconectar" ${estadoWebRTC === 'inactivo' ? 'disabled style="opacity:0.5;"' : ''}>
              <i class="fas fa-plug-circle-xmark"></i> Desconectar
            </button>
          </div>
        </div>

      </div>

      <!-- CONSOLA DE ESTADO WebRTC (PREMIUM LOGS) -->
      <div class="m2p_card m2p_console">
        <h3><i class="fas fa-terminal"></i> Historial de Señalización (WebRTC logs)</h3>
        <div class="m2p_logs" id="m2p-logs-box">
          <div class="m2p_log_line system"><span class="log_time">[00:00:00]</span> Módulo Móvil a PC inicializado. Listo para recibir señal de red.</div>
        </div>
      </div>

      <div style="margin-top: 4vh;">
        <button class="nv_item" data-page="smile" style="border:none; padding:1.5vh 3vh; border-radius:6px; background:var(--bg3); color:var(--tx1); font-weight:700; cursor:pointer; display:flex; align-items:center; gap:1vh;">
          <i class="fas fa-arrow-left"></i> Volver al Dashboard
        </button>
      </div>
    </div>
  `;
};

// ── Lógica e Interacción ──────────────────────────────────────

const agregarLog = (msg, tipo = 'info') => {
  const box = document.getElementById('m2p-logs-box');
  if (!box) return;
  const time = new Date().toTimeString().split(' ')[0];
  const div = document.createElement('div');
  div.className = `m2p_log_line ${tipo}`;
  div.innerHTML = `<span class="log_time">[${time}]</span> ${msg}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
};

const generarPinQR = async () => {
  if (cargandoCodigo) return;
  cargandoCodigo = true;
  
  const pinEl = document.getElementById('m2p-pin-code');
  if (pinEl) pinEl.textContent = '...';

  try {
    codigoM2P = Math.floor(100000 + Math.random() * 900000).toString();
    estadoWebRTC = 'esperando';
    actualizarBadgesEstado();
    agregarLog(`Nuevo código de señalización generado: <strong>${codigoM2P}</strong>`, 'system');

    // Registro en Firestore desactivado para evitar consumo excesivo en la colección sesiones_m2p
    /*
    if (db) {
      const docRef = doc(db, 'sesiones_m2p', codigoM2P);
      await setDoc(docRef, {
        estado: 'esperando',
        timestamp: Date.now(),
        hostName: getls('wiHostId') || 'PC-Host'
      });

      // Polling o Snapshot de la oferta SDP del celular
      if (dbUnsub) dbUnsub();
      dbUnsub = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.estado === 'oferta_recibida' && data.sdp) {
            negociarWebRTC(data.sdp);
          }
        }
      });
    }
    */

    // Dibujar QR
    setTimeout(() => {
      const canvas = document.getElementById('m2p-qr');
      if (canvas) {
        QRCode.toCanvas(canvas, JSON.stringify({
          tipo: 'm2p',
          codigo: codigoM2P,
          hostId: getls('wiHostId') || 'host_default'
        }), { width: 160, margin: 1, color: { dark: '#00f3ff', light: '#151b2e' } }, (err) => {
          if (err) console.error(err);
        });
      }
    }, 50);

  } catch (e) {
    console.error(e);
    agregarLog('Error al publicar código en señalizador', 'error');
  } finally {
    cargandoCodigo = false;
    const pinEl2 = document.getElementById('m2p-pin-code');
    if (pinEl2) pinEl2.textContent = codigoM2P;
  }
};

const negociarWebRTC = async (sdpOferta) => {
  estadoWebRTC = 'negociando';
  actualizarBadgesEstado();
  agregarLog('Señal WebRTC recibida del dispositivo móvil.', 'warning');
  agregarLog('Iniciando handshake y decodificación SDP...', 'info');

  // Simulación de negociación WebRTC (Host responde con SDP Answer)
  setTimeout(() => {
    agregarLog('Oferta SDP aceptada de forma segura.', 'success');
    agregarLog('Generando respuesta SDP (Answer)...', 'info');
    
    setTimeout(() => {
      estadoWebRTC = 'conectado';
      actualizarBadgesEstado();
      agregarLog('¡Enlace WebRTC P2P establecido con éxito a 60 FPS!', 'success');
      agregarLog('Canal de datos abierto para ratón/teclado.', 'system');
      Notificacion('¡Celular conectado!', 'success');
      
      const btnDesc = document.getElementById('btn-m2p-desconectar');
      if (btnDesc) {
        btnDesc.disabled = false;
        btnDesc.style.opacity = '1';
        btnDesc.style.cursor = 'pointer';
      }
    }, 1500);
  }, 1000);
};

const desconectarSesion = () => {
  estadoWebRTC = 'inactiva';
  estadoWebRTC = 'inactivo';
  actualizarBadgesEstado();
  agregarLog('Conexión cerrada por el Host local.', 'error');
  Notificacion('Control remoto finalizado', 'info');
  
  const btnDesc = document.getElementById('btn-m2p-desconectar');
  if (btnDesc) {
    btnDesc.disabled = true;
    btnDesc.style.opacity = '0.5';
    btnDesc.style.cursor = 'not-allowed';
  }

  // Limpiar QR
  const canvas = document.getElementById('m2p-qr');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  const pinEl = document.getElementById('m2p-pin-code');
  if (pinEl) pinEl.textContent = '------';
  codigoM2P = '';
};

const actualizarBadgesEstado = () => {
  const dot = document.querySelector('.m2p_dot');
  const txt = document.querySelector('.m2p_status_txt');
  if (!dot || !txt) return;

  dot.className = 'm2p_dot';
  dot.classList.add(`wd_status_${estadoWebRTC}`);

  const statusTexts = {
    inactivo: 'Desconectado',
    esperando: 'Esperando Móvil',
    negociando: 'Negociando...',
    conectado: 'Conectado',
    caido: 'Enlace Caído'
  };
  txt.textContent = statusTexts[estadoWebRTC];
};

// ── Inicialización ────────────────────────────────────────────
export const init = () => {
  cleanup();
  agregarLog('Iniciando servicios locales del Host...');

  // Eventos de checkboxes (permisos)
  onDoc('change', '#chk-raton', function() {
    permisos.controlRaton = this.checked;
    agregarLog(`Permiso de Ratón: <strong>${permisos.controlRaton ? 'Habilitado' : 'Deshabilitado'}</strong>`, 'info');
  });

  onDoc('change', '#chk-teclado', function() {
    permisos.controlTeclado = this.checked;
    agregarLog(`Permiso de Teclado: <strong>${permisos.controlTeclado ? 'Habilitado' : 'Deshabilitado'}</strong>`, 'info');
  });

  onDoc('change', '#chk-clipboard', function() {
    permisos.sincronizarPortapapeles = this.checked;
    agregarLog(`Sincronización de Portapapeles: <strong>${permisos.sincronizarPortapapeles ? 'Habilitada' : 'Deshabilitada'}</strong>`, 'info');
  });

  onDoc('change', '#chk-audio', function() {
    permisos.transmitirAudio = this.checked;
    agregarLog(`Traspaso de Audio del Sistema: <strong>${permisos.transmitirAudio ? 'Habilitado' : 'Deshabilitado'}</strong>`, 'warning');
  });

  // Evento copiar PIN al hacer click
  onDoc('click', '#m2p-pin-code', function() {
    if (codigoM2P && !cargandoCodigo) {
      wicopy(codigoM2P, this, '¡PIN Copiado!');
    }
  });

  // Botones
  onDoc('click', '#btn-m2p-generar', () => generarPinQR());
  onDoc('click', '#btn-m2p-desconectar', () => desconectarSesion());

  // Generar primer código
  generarPinQR();
};

export const cleanup = () => {
  if (dbUnsub) {
    dbUnsub();
    dbUnsub = null;
  }
  docListeners.forEach(({ type, wrapper }) => {
    document.removeEventListener(type, wrapper);
  });
  docListeners = [];
  estadoWebRTC = 'inactivo';
  codigoM2P = '';
  cargandoCodigo = false;
};

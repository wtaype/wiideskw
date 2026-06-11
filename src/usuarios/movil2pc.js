// src/usuarios/movil2pc.js — Controlador Principal Modular de Móvil a PC
import './movil2pc.css';
import { getls, Notificacion } from '../widev.js';
import { rutas } from '../rutas.js';
import { setEstado, suscribir } from './estados/estados.js';
import { verificarEstadoPin, invocarTauri, iniciarTransmision, detenerTransmision } from './servicios/servicio_movil2pc.js';
import * as ajustes from './movil2pc/ajustes.js';
import * as conexion from './movil2pc/conexion.js';
import * as logs from './movil2pc/logs.js';

let unsubStore = null;

const wi = () => getls('wiSmile') || {};

export const render = () => {
  const u = wi();
  if (!u.email) {
    setTimeout(() => rutas.navigate('/login'), 0);
    return '';
  }

  return `
    <div class="m2p_container">
      <!-- GRID PRINCIPAL DE DOS COLUMNAS -->
      <div class="m2p_grid">
        <!-- COLUMNA 1: CONFIGURACIONES (IZQUIERDA) -->
        ${ajustes.render()}

        <!-- COLUMNA 2: CONEXIÓN Y QR (DERECHA) -->
        ${conexion.render()}
      </div>

      <!-- SECCIÓN INFERIOR: CONSOLA DE LOGS -->
      ${logs.render()}

      <div style="margin-top: 2vh;">
        <button class="nv_item" data-page="smile" style="border:none; padding:1.5vh 3vh; border-radius:6px; background:var(--bg3); color:var(--tx1); font-weight:700; cursor:pointer; display:flex; align-items:center; gap:1vh;">
          <i class="fas fa-arrow-left"></i> Volver al Dashboard
        </button>
      </div>
    </div>
  `;
};

const actualizarVista = () => {
  const container = document.querySelector('.m2p_container');
  if (container) {
    // Preservar consola de logs antes de redibujar
    const oldLogs = document.getElementById('m2p-logs-box')?.innerHTML;
    container.parentElement.innerHTML = render();
    
    // Volver a inicializar los submódulos
    ajustes.init(logs.agregarLog);
    conexion.init();
    logs.init();

    if (oldLogs) {
      const newBox = document.getElementById('m2p-logs-box');
      if (newBox) {
        newBox.innerHTML = oldLogs;
        newBox.scrollTop = newBox.scrollHeight;
      }
    }
  }
};

export const init = async () => {
  cleanup();

  // 1. Obtener la configuración inicial de la PC
  try {
    const config = await invocarTauri('obtener_config');
    const idPc = config?.id_pc || '';
    setEstado({ movil2pcIdPc: idPc });
    await verificarEstadoPin();
  } catch (err) {
    console.error('[Móvil2PC] Fallo al cargar configuración del equipo:', err);
    logs.agregarLog('Error al cargar la configuración de red del equipo.', 'error');
  }

  // 2. Inicializar los submódulos
  ajustes.init(logs.agregarLog);
  conexion.init();
  logs.init();

  // 3. Suscribirse a cambios en el store global
  unsubStore = suscribir((estado, cambios) => {
    if (
      cambios.includes('movil2pcEstado') ||
      cambios.includes('movil2pcCalidad') ||
      cambios.includes('movil2pcAudio') ||
      cambios.includes('movil2pcPinConfigurado') ||
      cambios.includes('movil2pcConectado') ||
      cambios.includes('movil2pcIdPc')
    ) {
      if (cambios.includes('movil2pcEstado')) {
        const nuevoEstado = estado.movil2pcEstado;
        if (nuevoEstado === 'esperando') {
          logs.agregarLog('Esperando conexión del dispositivo móvil...', 'system');
        } else if (nuevoEstado === 'conectando') {
          logs.agregarLog('Dispositivo móvil enlazado. Iniciando conexión WebRTC...', 'warning');
        } else if (nuevoEstado === 'conectado') {
          logs.agregarLog('¡Conexión establecida con éxito! Transmitiendo pantalla...', 'success');
          Notificacion('¡Dispositivo conectado con éxito!', 'success');
        } else if (nuevoEstado === 'apagado') {
          logs.agregarLog('Transmisión finalizada.', 'error');
        }
      }
      actualizarVista();
    }
  });

  // 4. Iniciar automáticamente la transmisión pasiva (Anydesk style)
  try {
    logs.agregarLog('Inicializando canal de transmisión pasivo...', 'info');
    await iniciarTransmision();
  } catch (err) {
    console.error('[Móvil2PC] Fallo al iniciar transmisión automática:', err);
    logs.agregarLog('Error al abrir canal de transmisión pasivo.', 'error');
  }
};

export const cleanup = () => {
  if (unsubStore) {
    unsubStore();
    unsubStore = null;
  }
  ajustes.cleanup();
  conexion.cleanup();
  logs.cleanup();
  detenerTransmision();
};

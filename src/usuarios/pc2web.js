import './pc2web.css';
import { getls, savels, Notificacion, wiSpin, wicopy } from '../widev.js';
import { app } from '../wii.js';
import { rutas } from '../rutas.js';
import QRCode from 'qrcode';

// ── Estado Local ──────────────────────────────────────────────
let proyectando = false;
let codigoWeb = '';
let cantidadEspectadores = 0;
let kbpsActual = 0;
let fpsActual = 0;
let docListeners = [];
let metricasInterval = null;

// Configuración de proyección
let opcionesProyeccion = {
  requerirClave: false,
  claveAcceso: '1234',
  limiteEspectadores: '5',
  compartirAudio: true
};

// Historial de visualizadores (Simulación de conexiones)
let visualizadoresHistorial = [
  { hora: '19:42:05', ip: '192.168.1.50', dispositivo: 'Chrome / Android', estado: 'conectado' },
  { hora: '19:42:15', ip: '192.168.1.120', dispositivo: 'Safari / iPadOS', estado: 'conectado' }
];

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

  const linkProyeccion = codigoWeb ? `https://wiidesk.web.app/${codigoWeb}` : '—';

  // Generar tabla de visualizadores
  let htmlVisualizadores = '';
  if (!proyectando || visualizadoresHistorial.length === 0) {
    htmlVisualizadores = `
      <tr>
        <td colspan="4" style="text-align: center; color: var(--tx3); font-size: var(--fz_s3); padding: 3vh 0;">
          Ningún visualizador conectado
        </td>
      </tr>
    `;
  } else {
    htmlVisualizadores = visualizadoresHistorial.map(v => `
      <tr style="animation: p2w_fade_in_row 0.3s ease both;">
        <td><span class="p2w_log_time">${v.hora}</span></td>
        <td><strong>${v.ip}</strong></td>
        <td><span class="p2w_log_dev"><i class="fas ${v.dispositivo.includes('Android') || v.dispositivo.includes('iOS') ? 'fa-mobile-alt' : 'fa-laptop'}"></i> ${v.dispositivo}</span></td>
        <td><span class="p2w_log_status connected">Activo</span></td>
      </tr>
    `).join('');
  }

  return `
    <div class="p2w_container">
      
      <!-- HEADER -->
      <div class="p2w_header">
        <div class="p2w_title_section">
          <h2><i class="fas fa-share-nodes"></i> Proyección: PC a Web</h2>
          <p>Comparte la pantalla de tu computadora directamente a cualquier navegador web (Solo Vista).</p>
        </div>
        <div class="p2w_status_indicator">
          <span class="p2w_dot ${proyectando ? 'active' : 'inactive'}"></span>
          <span class="p2w_status_txt">${proyectando ? 'TRANSMITIENDO' : 'INACTIVO'}</span>
        </div>
      </div>

      <!-- GRID PRINCIPAL -->
      <div class="p2w_grid">
        
        <!-- COLUMNA IZQUIERDA: CONTROLES Y ENLACE -->
        <div class="p2w_col">
          
          <!-- CONTROL INTRRUPTOR -->
          <div class="p2w_card p2w_main_control">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2vh;">
              <h3 style="margin: 0;"><i class="fas fa-tower-broadcast"></i> Señal de Proyección</h3>
              
              <!-- INTERRUPTOR DESLIZANTE -->
              <label class="p2w_switch">
                <input type="checkbox" id="switch-proyectar" ${proyectando ? 'checked' : ''} />
                <span class="slider round"></span>
              </label>
            </div>
            <p class="m2p_card_subtitle" style="margin-bottom: 0;">
              ${proyectando ? 'Tu pantalla se está capturando en tiempo real. Los visualizadores autorizados pueden verla.' : 'Enciende el interruptor para generar el enlace temporal de visualización.'}
            </p>
          </div>

          <!-- ENLACE DE ACCESO -->
          <div class="p2w_card p2w_link_card" style="display: ${proyectando ? 'block' : 'none'};">
            <h3><i class="fas fa-link"></i> Enlace Temporal Compartido</h3>
            <p class="m2p_card_subtitle">Copia el enlace o escanea el código QR desde cualquier celular, tableta o laptop.</p>
            
            <div class="p2w_link_box">
              <span id="p2w-url-display" class="p2w_url_text">${linkProyeccion}</span>
              <button class="p2w_copy_btn" id="btn-p2w-copiar" title="Copiar Enlace"><i class="fas fa-copy"></i></button>
            </div>

            <div class="p2w_qr_box">
              <canvas id="p2w-qr" class="p2w_qr_canvas" width="150" height="150"></canvas>
            </div>
          </div>

        </div>

        <!-- COLUMNA DERECHA: MÉTRICAS Y AJUSTES -->
        <div class="p2w_col">
          
          <!-- MÉTRICAS EN TIEMPO REAL -->
          <div class="p2w_card p2w_metrics_card" style="display: ${proyectando ? 'block' : 'none'};">
            <h3><i class="fas fa-chart-line"></i> Estadísticas de Transmisión</h3>
            
            <div class="p2w_metrics_grid">
              <div class="p2w_metric_box">
                <i class="fas fa-users"></i>
                <strong id="m-viewers">${cantidadEspectadores}</strong>
                <span>Espectadores</span>
              </div>
              <div class="p2w_metric_box">
                <i class="fas fa-wifi"></i>
                <strong id="m-bandwidth">${kbpsActual} KB/s</strong>
                <span>Ancho de Banda</span>
              </div>
              <div class="p2w_metric_box">
                <i class="fas fa-bolt"></i>
                <strong id="m-fps">${fpsActual} FPS</strong>
                <span>Tasa de Cuadros</span>
              </div>
            </div>
          </div>

          <!-- CONFIGURACIÓN DE SEGURIDAD -->
          <div class="p2w_card">
            <h3><i class="fas fa-lock"></i> Opciones de Seguridad</h3>
            <p class="m2p_card_subtitle">Ajusta los privilegios de los espectadores que accedan al enlace web.</p>
            
            <div class="p2w_options_list">
              <label class="p2w_option_row">
                <div class="p2w_opt_info">
                  <strong>Requerir PIN de Acceso</strong>
                  <span>Solicitar clave numérica al abrir la página web.</span>
                </div>
                <input type="checkbox" id="chk-p2w-pin" ${opcionesProyeccion.requerirClave ? 'checked' : ''} />
              </label>

              <div class="p2w_pin_input_row" id="p2w-pin-setup" style="display: ${opcionesProyeccion.requerirClave ? 'flex' : 'none'};">
                <label>PIN de visualización:</label>
                <input type="text" id="txt-p2w-pin" value="${opcionesProyeccion.claveAcceso}" maxlength="8" style="width: 100px; text-align: center;" />
              </div>

              <label class="p2w_option_row">
                <div class="p2w_opt_info">
                  <strong>Transmitir Audio Local</strong>
                  <span>Enviar sonido de la pestaña o sistema.</span>
                </div>
                <input type="checkbox" id="chk-p2w-audio" ${opcionesProyeccion.compartirAudio ? 'checked' : ''} />
              </label>

              <div class="p2w_option_row" style="cursor: default;">
                <div class="p2w_opt_info">
                  <strong>Límite de Espectadores</strong>
                  <span>Número máximo de conexiones simultáneas.</span>
                </div>
                <select id="sel-p2w-limit" style="width: 80px;">
                  <option value="1" ${opcionesProyeccion.limiteEspectadores === '1' ? 'selected' : ''}>1</option>
                  <option value="3" ${opcionesProyeccion.limiteEspectadores === '3' ? 'selected' : ''}>3</option>
                  <option value="5" ${opcionesProyeccion.limiteEspectadores === '5' ? 'selected' : ''}>5</option>
                  <option value="10" ${opcionesProyeccion.limiteEspectadores === '10' ? 'selected' : ''}>10</option>
                </select>
              </div>
            </div>
          </div>

        </div>

      </div>

      <!-- VISUALIZADORES LOG (HISTORIAL DE CONEXIONES) -->
      <div class="p2w_card p2w_log_card" style="display: ${proyectando ? 'block' : 'none'};">
        <h3><i class="fas fa-list-check"></i> Espectadores Conectados</h3>
        <table class="p2w_table">
          <thead>
            <tr>
              <th>Hora Conexión</th>
              <th>Dirección IP</th>
              <th>Dispositivo / Navegador</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody id="p2w-table-body">
            ${htmlVisualizadores}
          </tbody>
        </table>
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

const iniciarProyeccion = () => {
  proyectando = true;
  codigoWeb = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Recargar la pantalla para aplicar el render
  actualizarVista();
  Notificacion('¡Proyección de pantalla iniciada!', 'success');

  // Generar QR
  setTimeout(() => {
    const canvas = document.getElementById('p2w-qr');
    if (canvas) {
      QRCode.toCanvas(canvas, `https://wiidesk.web.app/${codigoWeb}`, {
        width: 150,
        margin: 1,
        color: { dark: '#F5AF00', light: '#151b2e' } // Tonalidades Oro / Futuro
      });
    }
  }, 50);

  // Iniciar simulación de métricas dinámicas
  metricasInterval = setInterval(() => {
    cantidadEspectadores = 2;
    kbpsActual = Math.floor(800 + Math.random() * 1200);
    fpsActual = Math.floor(58 + Math.random() * 3);

    const mView = document.getElementById('m-viewers');
    const mBand = document.getElementById('m-bandwidth');
    const mFps = document.getElementById('m-fps');

    if (mView) mView.textContent = cantidadEspectadores;
    if (mBand) mBand.textContent = `${kbpsActual} KB/s`;
    if (mFps) mFps.textContent = `${fpsActual} FPS`;
  }, 2000);
};

const detenerProyeccion = () => {
  proyectando = false;
  codigoWeb = '';
  cantidadEspectadores = 0;
  kbpsActual = 0;
  fpsActual = 0;
  
  if (metricasInterval) {
    clearInterval(metricasInterval);
    metricasInterval = null;
  }

  actualizarVista();
  Notificacion('Proyección de pantalla detenida.', 'info');
};

const actualizarVista = () => {
  const container = document.querySelector('.p2w_container');
  if (container) {
    container.innerHTML = render();
  }
};

// ── Inicialización ────────────────────────────────────────────
export const init = () => {
  cleanup();

  // Switch Proyectar
  onDoc('change', '#switch-proyectar', function() {
    if (this.checked) {
      iniciarProyeccion();
    } else {
      detenerProyeccion();
    }
  });

  // Copiar Enlace
  onDoc('click', '#btn-p2w-copiar', function() {
    const link = `https://wiidesk.web.app/${codigoWeb}`;
    if (codigoWeb) {
      wicopy(link, this, '¡Copiado!');
    }
  });

  // Checkbox PIN de Seguridad
  onDoc('change', '#chk-p2w-pin', function() {
    opcionesProyeccion.requerirClave = this.checked;
    const setupRow = document.getElementById('p2w-pin-setup');
    if (setupRow) {
      setupRow.style.display = this.checked ? 'flex' : 'none';
    }
    Notificacion(`Solicitud de PIN: ${this.checked ? 'Activada' : 'Desactivada'}`, 'info');
  });

  // Guardar clave acceso
  onDoc('input', '#txt-p2w-pin', function() {
    opcionesProyeccion.claveAcceso = this.value;
  });

  // Checkbox Audio
  onDoc('change', '#chk-p2w-audio', function() {
    opcionesProyeccion.compartirAudio = this.checked;
    Notificacion(`Transmisión de audio: ${this.checked ? 'Habilitada' : 'Deshabilitada'}`, 'info');
  });

  // Selector Límite Espectadores
  onDoc('change', '#sel-p2w-limit', function() {
    opcionesProyeccion.limiteEspectadores = this.value;
    Notificacion(`Límite de espectadores cambiado a: ${opcionesProyeccion.limiteEspectadores}`, 'success');
  });

  console.log('📺 Módulo PC a Web inicializado');
};

export const cleanup = () => {
  docListeners.forEach(({ type, wrapper }) => {
    document.removeEventListener(type, wrapper);
  });
  docListeners = [];
  if (metricasInterval) {
    clearInterval(metricasInterval);
    metricasInterval = null;
  }
  proyectando = false;
  codigoWeb = '';
  cantidadEspectadores = 0;
};

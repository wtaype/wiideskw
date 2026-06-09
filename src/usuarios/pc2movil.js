import './pc2movil.css';
import { getls, savels, Notificacion, wiSpin, wicopy } from '../widev.js';
import { app } from '../wii.js';
import { rutas } from '../rutas.js';
import { db } from '../firebase.js';

// ── Estado Local ──────────────────────────────────────────────
let estadoWebRTC = 'inactivo'; // inactivo | conectando | conectado | caido
let dispositivoSeleccionado = null;
let orientacionHorizontal = false;
let resolucionScale = '1.0'; // 0.5 | 0.75 | 1.0
let docListeners = [];

// Pre-cargar algunos celulares mockeados para demostración
let dispositivosMoviles = [
  { id: 'dev_xiaomi', alias: 'Xiaomi Mi 11 Ultra', localIp: '192.168.18.99', macAddress: '8C-A6-DF-4E-9F-12', online: true, tipo: 'android' },
  { id: 'dev_iphone', alias: 'iPhone 15 Pro Max', localIp: '192.168.18.105', macAddress: '00-25-90-A8-1C-5E', online: false, tipo: 'ios' },
  { id: 'dev_pixel', alias: 'Google Pixel 8 Pro', localIp: '192.168.18.112', macAddress: 'BC-D1-1F-E2-A3-89', online: true, tipo: 'android' }
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

  // Generar lista HTML de dispositivos móviles
  const htmlMoviles = dispositivosMoviles.map(d => {
    const esOnline = d.online;
    const badgeClass = esOnline ? 'm2m_badge_online' : 'm2m_badge_offline';
    const badgeTexto = esOnline ? 'En Línea' : 'Offline';
    const esSel = dispositivoSeleccionado && dispositivoSeleccionado.id === d.id;
    const selectClass = esSel ? 'active' : '';

    return `
      <div class="m2m_device_item ${selectClass}" data-id="${d.id}">
        <div class="m2m_device_info_col">
          <strong><i class="fas fa-mobile-screen"></i> ${d.alias}</strong>
          <span>IP: ${d.localIp} | MAC: ${d.macAddress}</span>
        </div>
        <span class="m2m_status_badge ${badgeClass}">${badgeTexto}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="m2m_container">
      
      <!-- HEADER -->
      <div class="m2m_header">
        <div class="m2m_title_section">
          <h2><i class="fas fa-mobile-screen"></i> Control Remoto: PC a Móvil</h2>
          <p>Supervisa y controla dispositivos móviles de forma remota en baja latencia.</p>
        </div>
        <div class="m2m_status_indicator">
          <span class="m2m_dot wd_status_${estadoWebRTC}"></span>
          <span class="m2m_status_txt" id="m2m-status-text">${estadoWebRTC.toUpperCase()}</span>
        </div>
      </div>

      <!-- GRID PRINCIPAL -->
      <div class="m2m_grid">
        
        <!-- COLUMNA IZQUIERDA: SELECTOR Y AJUSTES -->
        <div class="m2m_col_left">
          
          <!-- SELECTOR DE DISPOSITIVOS -->
          <div class="m2m_card">
            <h3><i class="fas fa-list"></i> Celulares Vinculados</h3>
            <p class="m2m_card_subtitle">Selecciona el dispositivo para conectar el control WebRTC.</p>
            <div class="m2m_device_list">${htmlMoviles}</div>
          </div>

          <!-- CONTROLES DE TRANSMISIÓN -->
          <div class="m2m_card m2m_settings">
            <h3><i class="fas fa-sliders-h"></i> Ajustes de Transmisión</h3>
            
            <div class="m2m_setting_row">
              <label>Resolución:</label>
              <select id="sel-resolucion" ${estadoWebRTC !== 'conectado' ? 'disabled' : ''}>
                <option value="0.5">540p (Fluido / 0.5x)</option>
                <option value="0.75">720p (Medio / 0.75x)</option>
                <option value="1.0" selected>1080p (Original / 1.0x)</option>
              </select>
            </div>

            <div class="m2m_setting_row">
              <label>Framerate:</label>
              <select id="sel-fps" ${estadoWebRTC !== 'conectado' ? 'disabled' : ''}>
                <option value="30">30 FPS (Bajo consumo)</option>
                <option value="60" selected>60 FPS (Ultra Suave)</option>
              </select>
            </div>

            <div class="m2m_setting_row">
              <label>Orientación:</label>
              <button class="wd_btn wd_btn_secondary" id="btn-m2m-rotar" style="padding: 0.8vh 2vh; font-size: var(--fz_s3);" ${estadoWebRTC !== 'conectado' ? 'disabled' : ''}>
                <i class="fas fa-redo"></i> Rotar Visor
              </button>
            </div>
          </div>

          <div style="display: flex; gap: 2vh;">
            <button class="wd_btn wd_btn_primary" id="btn-m2m-conectar" disabled>
              <i class="fas fa-plug"></i> Iniciar Control
            </button>
            <button class="wd_btn wd_btn_danger" id="btn-m2m-detener" disabled>
              <i class="fas fa-power-off"></i> Parar
            </button>
          </div>

        </div>

        <!-- COLUMNA DERECHA: VISOR EMULADO -->
        <div class="m2m_col_right">
          <div class="m2m_card m2m_viewer_card">
            
            <div class="m2m_phone_wrapper ${orientacionHorizontal ? 'landscape' : 'portrait'}">
              
              <!-- DISPOSITIVO FÍSICO SIMULADO -->
              <div class="m2m_phone_frame">
                <div class="m2m_phone_notch"></div>
                
                <!-- PANTALLA -->
                <div class="m2m_phone_screen" id="m2m-screen-area">
                  
                  <!-- ESTADO APAGADO / DESCONECTADO -->
                  <div class="m2m_screen_offline" id="m2m-screen-offline">
                    <i class="fas fa-mobile-button"></i>
                    <span>Sin Señal de Video</span>
                    <p>Selecciona un dispositivo activo a la izquierda y pulsa 'Iniciar Control'.</p>
                  </div>

                  <!-- ESTADO COMPLEMENTARIO DE CARGA -->
                  <div class="m2m_screen_loading" id="m2m-screen-loading" style="display:none;">
                    <i class="fas fa-circle-notch fa-spin"></i>
                    <span>Negociando WebRTC...</span>
                  </div>

                  <!-- VIDEO DE STREAMING REAL -->
                  <div class="m2m_screen_video_wrap" id="m2m-screen-video-wrap" style="display:none;">
                    <!-- Simulador de interfaz móvil corporativa para mayor impacto estético -->
                    <div class="m2m_mobile_ui_mockup">
                      <div class="m2m_mockup_topbar">
                        <span>19:42</span>
                        <div class="m2m_topbar_icons">
                          <i class="fas fa-wifi"></i>
                          <i class="fas fa-signal"></i>
                          <i class="fas fa-battery-three-quarters"></i>
                        </div>
                      </div>
                      
                      <div class="m2m_mockup_content">
                        <img src="/smile.avif" alt="App Logo" class="m2m_mockup_logo" />
                        <h4>Wiidesk Mobile</h4>
                        <span class="m2m_mockup_status">P2P Conectado</span>
                        <div class="m2m_mockup_chart">
                          <div class="bar" style="height: 40%"></div>
                          <div class="bar" style="height: 60%"></div>
                          <div class="bar" style="height: 80%"></div>
                          <div class="bar" style="height: 50%"></div>
                          <div class="bar" style="height: 70%"></div>
                        </div>
                        <p class="m2m_mockup_stats">Latency: 12ms | Bandwidth: 4.8 Mbps</p>
                      </div>
                    </div>
                  </div>

                </div>

                <!-- CONTROLES HARDWARE (BARRA INFERIOR/LATERAL) -->
                <div class="m2m_phone_hardware">
                  <button class="m2m_hw_btn" id="hw-recents" title="Recientes"><i class="fas fa-bars"></i></button>
                  <button class="m2m_hw_btn" id="hw-home" title="Inicio"><i class="fas fa-circle"></i></button>
                  <button class="m2m_hw_btn" id="hw-back" title="Atrás"><i class="fas fa-chevron-left"></i></button>
                </div>

              </div>

            </div>

          </div>
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

const actualizarBadgesEstado = () => {
  const dot = document.querySelector('.m2m_dot');
  const txt = document.getElementById('m2m-status-text');
  if (dot && txt) {
    dot.className = 'm2m_dot';
    dot.classList.add(`wd_status_${estadoWebRTC}`);
    txt.textContent = estadoWebRTC.toUpperCase();
  }
};

const conectarDispositivo = () => {
  if (!dispositivoSeleccionado) return;
  estadoWebRTC = 'conectando';
  actualizarBadgesEstado();
  
  // Animación del visor
  const offScreen = document.getElementById('m2m-screen-offline');
  const loadScreen = document.getElementById('m2m-screen-loading');
  const videoScreen = document.getElementById('m2m-screen-video-wrap');
  
  if (offScreen) offScreen.style.display = 'none';
  if (loadScreen) loadScreen.style.display = 'flex';
  if (videoScreen) videoScreen.style.display = 'none';

  Notificacion(`Estableciendo señalización con ${dispositivoSeleccionado.alias}...`, 'info');

  setTimeout(() => {
    estadoWebRTC = 'conectado';
    actualizarBadgesEstado();
    
    if (loadScreen) loadScreen.style.display = 'none';
    if (videoScreen) videoScreen.style.display = 'block';

    Notificacion(`Conexión WebRTC exitosa con ${dispositivoSeleccionado.alias}`, 'success');

    // Habilitar controles
    const btnDetener = document.getElementById('btn-m2m-detener');
    const btnConectar = document.getElementById('btn-m2m-conectar');
    const selRes = document.getElementById('sel-resolucion');
    const selFps = document.getElementById('sel-fps');
    const btnRotar = document.getElementById('btn-m2m-rotar');
    
    if (btnDetener) btnDetener.disabled = false;
    if (btnConectar) btnConectar.disabled = true;
    if (selRes) selRes.disabled = false;
    if (selFps) selFps.disabled = false;
    if (btnRotar) btnRotar.disabled = false;

  }, 1800);
};

const desconectarDispositivo = () => {
  estadoWebRTC = 'inactivo';
  actualizarBadgesEstado();

  const offScreen = document.getElementById('m2m-screen-offline');
  const loadScreen = document.getElementById('m2m-screen-loading');
  const videoScreen = document.getElementById('m2m-screen-video-wrap');
  
  if (offScreen) offScreen.style.display = 'flex';
  if (loadScreen) loadScreen.style.display = 'none';
  if (videoScreen) videoScreen.style.display = 'none';

  Notificacion('Control remoto finalizado', 'info');

  const btnDetener = document.getElementById('btn-m2m-detener');
  const btnConectar = document.getElementById('btn-m2m-conectar');
  const selRes = document.getElementById('sel-resolucion');
  const selFps = document.getElementById('sel-fps');
  const btnRotar = document.getElementById('btn-m2m-rotar');
  
  if (btnDetener) btnDetener.disabled = true;
  if (btnConectar) btnConectar.disabled = false;
  if (selRes) selRes.disabled = true;
  if (selFps) selFps.disabled = true;
  if (btnRotar) btnRotar.disabled = true;
};

// ── Inicialización ────────────────────────────────────────────
export const init = () => {
  cleanup();

  // Seleccionar dispositivo de la lista
  onDoc('click', '.m2m_device_item', function() {
    const id = this.getAttribute('data-id');
    const dev = dispositivosMoviles.find(x => x.id === id);
    
    if (dev) {
      if (!dev.online) {
        Notificacion(`${dev.alias} está desconectado. No es posible iniciar WebRTC.`, 'warning');
        return;
      }
      
      dispositivoSeleccionado = dev;
      
      // Marcar activo en la UI
      document.querySelectorAll('.m2m_device_item').forEach(el => el.classList.remove('active'));
      this.classList.add('active');

      // Habilitar botón de conexión
      const btnConectar = document.getElementById('btn-m2m-conectar');
      if (btnConectar && estadoWebRTC === 'inactivo') {
        btnConectar.disabled = false;
      }
    }
  });

  // Botón Conectar/Detener
  onDoc('click', '#btn-m2m-conectar', () => conectarDispositivo());
  onDoc('click', '#btn-m2m-detener', () => desconectarDispositivo());

  // Botón Rotar Visor
  onDoc('click', '#btn-m2m-rotar', () => {
    orientacionHorizontal = !orientacionHorizontal;
    const frame = document.querySelector('.m2m_phone_wrapper');
    if (frame) {
      frame.className = `m2m_phone_wrapper ${orientacionHorizontal ? 'landscape' : 'portrait'}`;
    }
    Notificacion(`Rotación cambiada a: ${orientacionHorizontal ? 'Horizontal' : 'Vertical'}`, 'info');
  });

  // Simulador de clicks y coordenadas en la pantalla móvil
  onDoc('click', '#m2m-screen-area', function(e) {
    if (estadoWebRTC !== 'connected' && estadoWebRTC !== 'conectado') return;
    
    const rect = this.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width).toFixed(3);
    const y = ((e.clientY - rect.top) / rect.height).toFixed(3);
    
    console.log(`📱 Enviando toque WebRTC -> X: ${x}, Y: ${y}`);
    Notificacion(`Touch enviado a coordenadas (${x}, ${y})`, 'info', 800);
  });

  // Teclas de Hardware Emuladas
  onDoc('click', '#hw-home', () => {
    if (estadoWebRTC !== 'conectado') return;
    Notificacion('Comando enviado: Botón Inicio', 'success');
  });

  onDoc('click', '#hw-back', () => {
    if (estadoWebRTC !== 'conectado') return;
    Notificacion('Comando enviado: Botón Atrás', 'success');
  });

  onDoc('click', '#hw-recents', () => {
    if (estadoWebRTC !== 'conectado') return;
    Notificacion('Comando enviado: Recientes', 'success');
  });

  console.log('📱 Módulo PC a Móvil inicializado');
};

export const cleanup = () => {
  docListeners.forEach(({ type, wrapper }) => {
    document.removeEventListener(type, wrapper);
  });
  docListeners = [];
  estadoWebRTC = 'inactivo';
  dispositivoSeleccionado = null;
  orientacionHorizontal = false;
};

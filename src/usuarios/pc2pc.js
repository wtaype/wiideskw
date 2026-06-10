import './pc2pc.css';
import { getls, savels, Notificacion, wiSpin, wicopy } from '../widev.js';
import { app } from '../wii.js';
import { rutas } from '../rutas.js';
import { getEstado, setEstado, suscribir } from '../estados.js';
import { db } from '../firebase.js';

// ── Estado Local ──────────────────────────────────────────────
let localEstadoWebRTC = 'inactivo'; // inactivo | negociando | conectado | caido
let hostActivo = null;
let monitorSeleccionado = '1';
let resolucionTransmision = '1080p';
let fpsTransmision = '60';
let docListeners = [];
let estadoBaja = null;

// Equipos remotos preestablecidos si no se cargan de base de datos
let equiposRemotosMock = [
  { hostId: 'host_oficina', alias: 'Servidor Oficina', localIp: '192.168.1.150', macAddress: '1C-2F-90-AA-BB-CC', online: true },
  { hostId: 'host_casa', alias: 'PC Gaming Casa', localIp: '192.168.1.52', macAddress: 'F8-75-A4-00-11-22', online: true },
  { hostId: 'host_render', alias: 'Estación de Render', localIp: '10.0.0.12', macAddress: '00-11-22-33-44-55', online: false }
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

  // Generar dropdown de hosts
  const htmlOpcionesHosts = equiposRemotosMock.map(e => {
    const esOnline = e.online;
    const preText = esOnline ? '🟢' : '⚫';
    const esSel = hostActivo && hostActivo.hostId === e.hostId ? 'selected' : '';
    return `<option value="${e.hostId}" ${esSel} ${!esOnline ? 'disabled' : ''}>${preText} ${e.alias} (${e.localIp})</option>`;
  }).join('');

  const isConnected = localEstadoWebRTC === 'conectado';
  const isNegotiating = localEstadoWebRTC === 'negociando';

  return `
    <div class="pc2p_container">
      
      <!-- CONTENEDOR PRINCIPAL DEL CONTROL REMOTO -->
      <div class="pc2p_viewport_card">
        
        <!-- BARRA FLOTANTE DE ACCIONES DE SESIÓN (SESSION TOOLBAR) -->
        <div class="pc2p_toolbar" style="display: ${isConnected ? 'flex' : 'none'};">
          <div class="pc2p_toolbar_left">
            <span class="pc2p_active_host"><i class="fas fa-desktop"></i> ${hostActivo ? hostActivo.alias : 'Remoto'}</span>
            <span class="pc2p_quality_tag">1080p @ 60fps</span>
            <span class="pc2p_latency_tag"><i class="fas fa-bolt"></i> 8ms</span>
          </div>

          <div class="pc2p_toolbar_center">
            <button class="pc2p_tool_btn" id="btn-p2p-ctrlaltdel" title="Enviar Ctrl+Alt+Del">
              <i class="fas fa-keyboard"></i> <span>Ctrl+Alt+Del</span>
            </button>
            
            <div class="pc2p_tool_sep"></div>
            
            <select class="pc2p_tool_select" id="sel-p2p-monitor" title="Seleccionar Monitor">
              <option value="1">Monitor 1 (Principal)</option>
              <option value="2">Monitor 2 (Secundario)</option>
            </select>

            <select class="pc2p_tool_select" id="sel-p2p-calidad" title="Resolución">
              <option value="1080p">Full HD (1080p)</option>
              <option value="720p">HD (720p)</option>
              <option value="4k">Ultra HD (4K)</option>
            </select>
          </div>

          <div class="pc2p_toolbar_right">
            <button class="pc2p_tool_btn danger" id="btn-p2p-apagar-remoto" title="Apagar equipo remoto">
              <i class="fas fa-power-off"></i>
            </button>
            <button class="pc2p_tool_btn disconnect" id="btn-p2p-desconectar" title="Desconectar">
              <i class="fas fa-plug-circle-xmark"></i> <span>Salir</span>
            </button>
          </div>
        </div>

        <!-- AREA DE VISUALIZACIÓN / STREAMING DE PANTALLA -->
        <div class="pc2p_screen_area" id="pc2p-screen">
          
          <!-- ESTADO: DESCONECTADO (MUESTRA EL PORTAL DE CONEXION) -->
          <div class="pc2p_portal" style="display: ${(!isConnected && !isNegotiating) ? 'flex' : 'none'};">
            <div class="pc2p_portal_box">
              <div class="pc2p_portal_ico"><i class="fas fa-network-wired"></i></div>
              <h2>Portal de Enlace PC a PC</h2>
              <p>Conéctate a cualquier ordenador remoto configurado en tu cuenta con latencia cero.</p>
              
              <div class="pc2p_portal_form">
                <div class="pc2p_field">
                  <label><i class="fas fa-server"></i> Seleccionar Equipo:</label>
                  <select id="sel-host-conectar">
                    <option value="" disabled selected>Selecciona un equipo de la lista...</option>
                    ${htmlOpcionesHosts}
                  </select>
                </div>

                <div class="pc2p_field" id="pc2p-pin-field" style="display:none;">
                  <label><i class="fas fa-key"></i> PIN de Seguridad:</label>
                  <input type="password" id="txt-host-pin" placeholder="Escribe el PIN de 6 dígitos del Host..." maxlength="6" />
                </div>

                <button class="wd_btn wd_btn_primary" id="btn-p2p-conectar-host" disabled>
                  <i class="fas fa-expand"></i> Iniciar Enlace P2P
                </button>
              </div>
            </div>
          </div>

          <!-- ESTADO: CARGANDO / CONECTANDO -->
          <div class="pc2p_loader_overlay" style="display: ${isNegotiating ? 'flex' : 'none'};">
            <div class="pc2p_loader_content">
              <div class="pc2p_network_radar">
                <div class="radar_circle c1"></div>
                <div class="radar_circle c2"></div>
                <div class="radar_circle c3"></div>
                <i class="fas fa-laptop-medical"></i>
              </div>
              <h3>Estableciendo Canal WebRTC</h3>
              <span class="pc2p_loader_status" id="p2p-loading-msg">Realizando intercambio de señalización...</span>
            </div>
          </div>

          <!-- ESTADO: CONECTADO (STREAMING DE ESCRITORIO REMOTO SIMULADO) -->
          <div class="pc2p_stream_wrap" style="display: ${isConnected ? 'block' : 'none'};">
            
            <!-- MOCK DE ESCRITORIO DE WINDOWS REMOTO PARA WOW FACTOR -->
            <div class="pc2p_desktop_mock">
              <!-- Wallpaper Cyberpunk de Fondo -->
              <div class="desktop_icons">
                <div class="d_icon"><i class="fas fa-folder"></i><span>Proyectos</span></div>
                <div class="d_icon"><i class="fas fa-network-wired"></i><span>Red Local</span></div>
                <div class="d_icon"><i class="fas fa-recycle"></i><span>Papelera</span></div>
              </div>
              
              <!-- Ventana abierta simulada en el remoto -->
              <div class="desktop_window">
                <div class="win_titlebar">
                  <span>Terminal - Compilación Rust</span>
                  <div class="win_btns"><span></span><span></span><span></span></div>
                </div>
                <div class="win_body">
                  <pre>
$ cargo tauri build
   Compiling app v1.0.0 (C:\proyectos\tudesk)
    Finished release [optimized] target(s) in 2m 14s
$ ./target/release/wiidesk.exe
[System] WebRTC signaling P2P: CONNECTED
[System] Latency: 8ms | CPU: 14% | GPU: 34%
                  </pre>
                </div>
              </div>

              <!-- Barra de tareas de Windows simulada -->
              <div class="desktop_taskbar">
                <div class="taskbar_left">
                  <i class="fab fa-windows" style="color: var(--Cielo);"></i>
                  <div class="taskbar_search"><i class="fas fa-search"></i></div>
                </div>
                <div class="taskbar_center">
                  <div class="taskbar_appactive"><i class="fas fa-terminal"></i></div>
                  <div class="taskbar_app"><i class="fas fa-folder-open"></i></div>
                  <div class="taskbar_app"><i class="fas fa-globe"></i></div>
                </div>
                <div class="taskbar_right">
                  <i class="fas fa-volume-up"></i>
                  <i class="fas fa-wifi"></i>
                  <span>19:42<br>09/06/2026</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      <div style="margin-top: 4vh; display: ${isConnected ? 'none' : 'block'};">
        <button class="nv_item" data-page="smile" style="border:none; padding:1.5vh 3vh; border-radius:6px; background:var(--bg3); color:var(--tx1); font-weight:700; cursor:pointer; display:flex; align-items:center; gap:1vh;">
          <i class="fas fa-arrow-left"></i> Volver al Dashboard
        </button>
      </div>

    </div>
  `;
};

// ── Lógica e Interacción ──────────────────────────────────────

const iniciarConexionP2P = () => {
  if (!hostActivo) return;
  
  localEstadoWebRTC = 'negociando';
  actualizarVista();

  const msgLoader = document.getElementById('p2p-loading-msg');
  
  setTimeout(() => {
    if (msgLoader) msgLoader.textContent = 'Enlazando canales de datos e inyección de entrada nativa...';
    
    setTimeout(() => {
      localEstadoWebRTC = 'conectado';
      setEstado({ estadoWebRTC: 'conectado' });
      actualizarVista();
      Notificacion(`Conexión remota establecida con ${hostActivo.alias}`, 'success');
    }, 1200);
  }, 1000);
};

const desconectarP2P = () => {
  localEstadoWebRTC = 'inactivo';
  setEstado({ estadoWebRTC: 'inactivo', hostConectado: null });
  actualizarVista();
  Notificacion('Conexión remota cerrada.', 'info');
};

const actualizarVista = () => {
  const container = document.querySelector('.pc2p_container');
  if (container) {
    container.innerHTML = render();
  }
};

// ── Inicialización ────────────────────────────────────────────
export const init = () => {
  cleanup();

  // Revisar si ya venimos con un host seleccionado del Dashboard
  const extHost = getEstado('hostConectado');
  if (extHost) {
    hostActivo = extHost;
    iniciarConexionP2P();
  }

  // Suscribirse a cambios globales del store
  estadoBaja = suscribir((estado) => {
    if (estado.estadoWebRTC === 'inactivo' && localEstadoWebRTC === 'conectado') {
      desconectarP2P();
    }
  });

  // Selector de Host en el Portal
  onDoc('change', '#sel-host-conectar', function() {
    const hostId = this.value;
    const equipo = equiposRemotosMock.find(x => x.hostId === hostId);
    
    if (equipo) {
      hostActivo = equipo;
      setEstado({ hostConectado: equipo });
      
      // Mostrar campo de PIN
      const pinField = document.getElementById('pc2p-pin-field');
      if (pinField) pinField.style.display = 'block';

      // Habilitar botón de conectar
      const btnConectar = document.getElementById('btn-p2p-conectar-host');
      if (btnConectar) btnConectar.disabled = false;
    }
  });

  // Botón iniciar enlace P2P
  onDoc('click', '#btn-p2p-conectar-host', () => {
    const pinVal = document.getElementById('txt-host-pin')?.value || '';
    if (pinVal.length < 4) {
      Notificacion('Escribe un PIN de seguridad válido', 'warning');
      return;
    }
    iniciarConexionP2P();
  });

  // Botón Desconectar
  onDoc('click', '#btn-p2p-desconectar', () => desconectarP2P);
  onDoc('click', '#btn-p2p-desconectar', () => desconectarP2P());

  // Enviar Ctrl+Alt+Del simulado
  onDoc('click', '#btn-p2p-ctrlaltdel', () => {
    Notificacion('Enviando comando Ctrl+Alt+Del a la PC remota', 'success');
  });

  // Botón Apagar Remoto
  onDoc('click', '#btn-p2p-apagar-remoto', () => {
    if (confirm(`¿Seguro que deseas enviar la orden de apagado inmediato a ${hostActivo?.alias || 'equipo remoto'}?`)) {
      Notificacion('Orden de apagado enviada al Host.', 'error');
      desconectarP2P();
    }
  });

  // Monitor e interactividad
  onDoc('change', '#sel-p2p-monitor', function() {
    monitorSeleccionado = this.value;
    Notificacion(`Cambiando visualización a Monitor ${monitorSeleccionado}`, 'info');
  });

  onDoc('change', '#sel-p2p-calidad', function() {
    resolucionTransmision = this.value;
    Notificacion(`Calidad de transmisión ajustada a: ${resolucionTransmision.toUpperCase()}`, 'success');
  });

  console.log('🖥️ Módulo PC a PC inicializado');
};

export const cleanup = () => {
  docListeners.forEach(({ type, wrapper }) => {
    document.removeEventListener(type, wrapper);
  });
  docListeners = [];
  if (estadoBaja) {
    estadoBaja();
    estadoBaja = null;
  }
  localEstadoWebRTC = 'inactivo';
  hostActivo = null;
};

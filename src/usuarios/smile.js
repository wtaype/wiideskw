import './smile.css';
import { getls, savels, Notificacion, wiSpin, wicopy, wiAuth } from '../widev.js';
import { app } from '../wii.js';
import { rutas } from '../rutas.js';
import { db } from '../firebase.js';
import { doc, setDoc, getDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';

// Configuración local por defecto (si no estamos en Tauri)
let configLocal = {
  dispositivo_nombre: 'Mi PC',
  ip_local: '127.0.0.1',
  mac_address: '00-00-00-00-00-00',
  ip_broadcast: '255.255.255.255',
  dominio_remoto: 'https://wiidesk.web.app',
  seguridad: {
    requerir_pin: true,
    pin_hash: '',
    pin_salt: ''
  }
};

let wolHabilitado = false;
let cargandoWol = false;
let cargandoPower = false;
let hostsRemotos = [];
let cargandoHosts = true;
let hostIdUnico = '';

const obtenerUsuario = () => getls('wiSmile') || null;

// Invocar comando Tauri de manera segura
const invocarTauri = async (cmd, args = {}) => {
  if (window.__TAURI__ && window.__TAURI__.core && typeof window.__TAURI__.core.invoke === 'function') {
    return await window.__TAURI__.core.invoke(cmd, args);
  }
  throw new Error('Tauri no disponible');
};

export const render = () => {
  const user = obtenerUsuario();
  if (!user) {
    setTimeout(() => rutas.navigate('/login'), 0);
    return '';
  }

  const primerNombre = user.nombre || user.usuario || 'Usuario';

  // Generación de tarjetas de hosts remotos (Fase 1: UI & Skeletons)
  let htmlHosts = '';
  if (cargandoHosts) {
    // Shimmer skeletons
    htmlHosts = `
      <div class="wd_skeleton_card"></div>
      <div class="wd_skeleton_card"></div>
      <div class="wd_skeleton_card"></div>
    `;
  } else if (hostsRemotos.length === 0) {
    htmlHosts = `
      <div class="ad_empty">
        <i class="fa-solid fa-network-wired"></i>
        <p>No tienes otros equipos vinculados</p>
        <span class="wd_empty_note">Vincula este equipo desde la App móvil usando el código QR.</span>
      </div>
    `;
  } else {
    htmlHosts = hostsRemotos.map(h => {
      const esOnline = h.online || false;
      const badgeClass = esOnline ? 'wd_badge_online' : 'wd_badge_offline';
      const badgeTexto = esOnline ? 'En Línea' : 'Desconectado';
      const icoClass = esOnline ? 'wd_device_ico_online' : 'wd_device_ico_offline';
      const wolBtnAttr = esOnline ? 'disabled class="wd_btn_disabled"' : '';
      
      return `
        <div class="wd_device_card">
          <div class="wd_device_left">
            <div class="wd_device_ico ${icoClass}">
              <i class="fa-solid ${h.macAddress ? 'fa-laptop' : 'fa-desktop'}"></i>
            </div>
            <div class="wd_device_info">
              <strong>${h.alias || h.dispositivoNombre || 'Equipo Sin Nombre'}</strong>
              <span>IP: ${h.localIp || '—'} | MAC: ${h.macAddress || '—'}</span>
              <div class="wd_device_badge_container">
                <span class="wd_badge ${badgeClass}">${badgeTexto}</span>
              </div>
            </div>
          </div>
          <div class="wd_device_actions">
            ${esOnline ? 
              `<button class="wd_btn_icon btn-conectar" data-hostid="${h.hostId}" title="Conectar"><i class="fa-solid fa-expand"></i></button>` :
              `<button class="wd_btn_icon btn-encender" data-mac="${h.macAddress}" data-ipb="${h.ipBroadcast || '255.255.255.255'}" ${wolBtnAttr} title="Despertar (WoL)"><i class="fa-solid fa-power-off"></i></button>`
            }
            <button class="wd_btn_icon wd_btn_icon_danger btn-apagar-remoto" data-hostid="${h.hostId}" title="Apagar equipo"><i class="fa-solid fa-circle-minus"></i></button>
          </div>
        </div>
      `;
    }).join('');
  }

  return `
    <div class="wd_dash">
      
      <!-- HERO BANNER -->
      <header class="wd_hero">
        <div class="wd_hero_glow"></div>
        <div class="wd_hero_content">
          <div class="wd_welcome">
            <h1>¡Hola, <span>${primerNombre}</span>!</h1>
            <p>Bienvenido al Centro de Control de Wiidesk. Gestiona tus equipos locales y remotos.</p>
          </div>
          <div>
            <span class="wd_badge wd_badge_active"><i class="fa-solid fa-shield-halved"></i> Host Activo</span>
          </div>
        </div>
      </header>

      <!-- SECCIONES GRID -->
      <div class="wd_grid">
        
        <!-- COLUMNA IZQUIERDA: ESTE EQUIPO (HOST LOCAL) -->
        <div class="wd_col">
          <h2 class="wd_panel_title"><i class="fa-solid fa-display"></i> Este Equipo (Host Local)</h2>
          
          <div class="wd_card">
            <div class="wd_host_details">
              <div class="wd_host_row">
                <span class="wd_host_label">Nombre de Red:</span>
                <span class="wd_host_val" id="local-hostname">${configLocal.dispositivo_nombre}</span>
              </div>
              <div class="wd_host_row">
                <span class="wd_host_label">Dirección IP:</span>
                <span class="wd_host_val" id="local-ip">${configLocal.ip_local}</span>
              </div>
              <div class="wd_host_row">
                <span class="wd_host_label">Dirección MAC:</span>
                <span class="wd_host_val wd_host_mac" id="local-mac" title="Copiar MAC">${configLocal.mac_address}</span>
              </div>
              <div class="wd_host_row">
                <span class="wd_host_label">Encendido por Red:</span>
                <span class="wd_badge ${wolHabilitado ? 'wd_badge_online' : 'wd_badge_offline'}" id="local-wol-badge">
                  ${wolHabilitado ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            <div class="wd_local_actions">
              <button class="wd_btn wd_btn_primary" id="btn-toggle-wol">
                <i class="fa-solid fa-wand-magic-sparkles"></i> Activar Encendido por Red
              </button>

              <div class="wd_local_actions_grid">
                <button class="wd_btn wd_btn_secondary" id="btn-suspender-local">
                  <i class="fa-solid fa-moon"></i> Suspender PC
                </button>
                <button class="wd_btn wd_btn_danger" id="btn-apagar-local">
                  <i class="fa-solid fa-power-off"></i> Apagar PC
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- COLUMNA DERECHA: DIRECTORIO DE EQUIPOS REMOTOS -->
        <div class="wd_col">
          <h2 class="wd_panel_title"><i class="fa-solid fa-network-wired"></i> Equipos Remotos</h2>
          <div class="wd_host_list" id="remote-hosts-list">
            ${htmlHosts}
          </div>
        </div>

      </div>

    </div>
  `;
};



// Carga la lista de equipos remotos del usuario
const cargarEquiposRemotos = async (ownerUid) => {
  if (!db || !ownerUid) {
    cargandoHosts = false;
    hostsRemotos = [
      { hostId: 'host_office', alias: 'PC Oficina Principal', localIp: '192.168.1.50', macAddress: 'AA-BB-CC-DD-EE-FF', online: true },
      { hostId: 'host_home', alias: 'Laptop Familiar', localIp: '192.168.1.120', macAddress: '00-11-22-33-44-55', online: false }
    ];
    actualizarVistaHosts();
    return;
  }

  try {
    const q = query(collection(db, 'equipos'), where('ownerUid', '==', ownerUid));
    const querySnapshot = await getDocs(q);
    const auxList = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Filtrar para no mostrar este mismo host en la lista de remotos
      if (data.hostId !== hostIdUnico) {
        auxList.push({
          id: doc.id,
          ...data
        });
      }
    });
    hostsRemotos = auxList;
  } catch (err) {
    console.error('Error cargando equipos:', err);
  } finally {
    cargandoHosts = false;
    actualizarVistaHosts();
  }
};

const actualizarVistaHosts = () => {
  const container = document.getElementById('remote-hosts-list');
  if (!container) return;
  
  if (hostsRemotos.length === 0) {
    container.innerHTML = `
      <div class="ad_empty">
        <i class="fa-solid fa-network-wired"></i>
        <p>No tienes otros equipos vinculados</p>
        <span class="wd_empty_note">Vincula este equipo desde la App móvil usando el código QR.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = hostsRemotos.map(h => {
    const esOnline = h.online || false;
    const badgeClass = esOnline ? 'wd_badge_online' : 'wd_badge_offline';
    const badgeTexto = esOnline ? 'En Línea' : 'Desconectado';
    const icoClass = esOnline ? 'wd_device_ico_online' : 'wd_device_ico_offline';
    const wolBtnAttr = esOnline ? 'disabled class="wd_btn_disabled"' : '';
    
    return `
      <div class="wd_device_card">
        <div class="wd_device_left">
          <div class="wd_device_ico ${icoClass}">
            <i class="fa-solid ${h.macAddress ? 'fa-laptop' : 'fa-desktop'}"></i>
          </div>
          <div class="wd_device_info">
            <strong>${h.alias || h.dispositivoNombre || 'Equipo Sin Nombre'}</strong>
            <span>IP: ${h.localIp || '—'} | MAC: ${h.macAddress || '—'}</span>
            <div class="wd_device_badge_container">
              <span class="wd_badge ${badgeClass}">${badgeTexto}</span>
            </div>
          </div>
        </div>
        <div class="wd_device_actions">
          ${esOnline ? 
            `<button class="wd_btn_icon btn-conectar" data-hostid="${h.hostId}" title="Conectar"><i class="fa-solid fa-expand"></i></button>` :
            `<button class="wd_btn_icon btn-encender" data-mac="${h.macAddress}" data-ipb="${h.ipBroadcast || '255.255.255.255'}" ${wolBtnAttr} title="Despertar (WoL)"><i class="fa-solid fa-power-off"></i></button>`
          }
          <button class="wd_btn_icon wd_btn_icon_danger btn-apagar-remoto" data-hostid="${h.hostId}" title="Apagar equipo"><i class="fa-solid fa-circle-minus"></i></button>
        </div>
      </div>
    `;
  }).join('');
};

// Handlers de botones locales
const handleToggleWol = async (e) => {
  const btn = e.currentTarget;
  if (cargandoWol) return;
  cargandoWol = true;
  wiSpin(btn, true, 'Habilitando...');

  try {
    await invocarTauri('activar_wol');
    wolHabilitado = true;

    const badge = document.getElementById('local-wol-badge');
    if (badge) {
      badge.textContent = 'Activo';
      badge.className = 'wd_badge wd_badge_online';
    }

    Notificacion('Encendido por Red configurado con éxito', 'success');
  } catch (err) {
    console.error('Error activando Encendido por Red:', err);
    try {
      wolHabilitado = await invocarTauri('verificar_wol');
    } catch(e) {}

    if (wolHabilitado) {
      Notificacion('Encendido por Red ya se encuentra habilitado', 'info');
    } else {
      Notificacion('No se pudo activar. Ejecuta la app como Administrador.', 'warning');
    }
  } finally {
    cargandoWol = false;
    wiSpin(btn, false, 'Activar Encendido por Red');
  }
};

const handleSuspenderLocal = async (e) => {
  if (cargandoPower) return;
  cargandoPower = true;
  const btn = e.currentTarget;
  wiSpin(btn, true, 'Suspendiendo...');
  
  try {
    await invocarTauri('suspender_equipo');
    Notificacion('Enviando comando de suspensión...', 'info');
  } catch (err) {
    console.error('Error al suspender:', err);
    Notificacion('Error al suspender el equipo local', 'error');
  } finally {
    cargandoPower = false;
    wiSpin(btn, false, 'Suspender PC');
  }
};

const handleApagarLocal = async (e) => {
  if (confirm('¿Seguro que deseas apagar este equipo de inmediato?')) {
    try {
      await invocarTauri('apagar_equipo');
      Notificacion('Enviando comando de apagado...', 'info');
    } catch (err) {
      console.error('Error al apagar:', err);
      Notificacion('Error al apagar el equipo local', 'error');
    }
  }
};

// Delegación de clicks generales en la vista
const handleDashboardClick = async (e) => {
  // Copiar MAC
  const macVal = e.target.closest('#local-mac');
  if (macVal) {
    wicopy(macVal.textContent.trim(), macVal, '¡Copiado!');
    return;
  }

  // Conectar con Host Remoto
  const btnConectar = e.target.closest('.btn-conectar');
  if (btnConectar) {
    const hostId = btnConectar.getAttribute('data-hostid');
    // Navegar al visor PC a PC
    Notificacion(`Conectando a P2P remoto con ${hostId}...`, 'info');
    rutas.navigate('/pc2pc');
    return;
  }

  // Despertar Remoto (WoL)
  const btnEncender = e.target.closest('.btn-encender');
  if (btnEncender) {
    const mac = btnEncender.getAttribute('data-mac');
    const ipb = btnEncender.getAttribute('data-ipb');
    wiSpin(btnEncender, true);
    Notificacion(`Enviando paquete mágico a MAC ${mac}...`, 'info');
    
    // Mock de encendido
    setTimeout(() => {
      wiSpin(btnEncender, false);
      Notificacion('Paquete Wake-on-LAN enviado', 'success');
    }, 1200);
    return;
  }

  // Apagar Remoto
  const btnApagarRemoto = e.target.closest('.btn-apagar-remoto');
  if (btnApagarRemoto) {
    const hostId = btnApagarRemoto.getAttribute('data-hostid');
    if (confirm(`¿Seguro que deseas apagar remotamente el equipo ${hostId}?`)) {
      Notificacion('Comando de apagado remoto enviado', 'info');
    }
  }
};



export const init = async () => {
  const user = obtenerUsuario();
  if (!user) return setTimeout(() => rutas.navigate('/login'), 100);

  // Inicializar estado local
  hostIdUnico = getls('wiHostId') || '';
  cargandoHosts = true;
  cargandoWol = false;
  cargandoPower = false;

  // Cargar configuración real desde Tauri si está disponible
  try {
    const configTauri = await invocarTauri('obtener_config');
    if (configTauri) {
      configLocal = configTauri;

      const elHostName = document.getElementById('local-hostname');
      if (elHostName) elHostName.textContent = configLocal.dispositivo_nombre;

      const elIp = document.getElementById('local-ip');
      if (elIp) elIp.textContent = configLocal.ip_local;

      const elMac = document.getElementById('local-mac');
      if (elMac) elMac.textContent = configLocal.mac_address;
    }
  } catch (err) {
    console.log('Utilizando config local fallback (no Tauri WebView)');
  }

  // Verificar estado Encendido por Red desde Tauri
  try {
    wolHabilitado = await invocarTauri('verificar_wol');
    const badge = document.getElementById('local-wol-badge');
    if (badge) {
      badge.textContent = wolHabilitado ? 'Activo' : 'Inactivo';
      badge.className = wolHabilitado ? 'wd_badge wd_badge_online' : 'wd_badge wd_badge_offline';
    }
  } catch (err) {
    console.log('No se pudo verificar Encendido por Red (no Tauri)');
  }

  // Vincular eventos
  const btnToggleWol = document.getElementById('btn-toggle-wol');
  if (btnToggleWol) btnToggleWol.addEventListener('click', handleToggleWol);

  const btnSuspender = document.getElementById('btn-suspender-local');
  if (btnSuspender) btnSuspender.addEventListener('click', handleSuspenderLocal);

  const btnApagar = document.getElementById('btn-apagar-local');
  if (btnApagar) btnApagar.addEventListener('click', handleApagarLocal);

  document.addEventListener('click', handleDashboardClick);

  // Cargar hosts remotos de Firestore
  cargarEquiposRemotos(user.uid);

  console.log(`🏜️ Centro de Control de ${app} cargado.`);
  window.__WIREADY__ = true;
};

export const cleanup = () => {
  const btnToggleWol = document.getElementById('btn-toggle-wol');
  if (btnToggleWol) btnToggleWol.removeEventListener('click', handleToggleWol);

  const btnSuspender = document.getElementById('btn-suspender-local');
  if (btnSuspender) btnSuspender.removeEventListener('click', handleSuspenderLocal);

  const btnApagar = document.getElementById('btn-apagar-local');
  if (btnApagar) btnApagar.removeEventListener('click', handleApagarLocal);

  document.removeEventListener('click', handleDashboardClick);
};

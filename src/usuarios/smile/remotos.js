// usuarios/smile/remotos.js — Componente de Equipos Remotos con Seguridad de Auth
import { getls, Notificacion, wiSpin } from '../../widev.js';
import { rutas } from '../../rutas.js';
import { db, rtdb } from '../../firebase.js';
import { doc, getDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { ref, onValue, update } from 'firebase/database';
import { invocarTauri } from './utils.js';

let hostsRemotos = [];
let cargandoHosts = true;
let unsubFirestoreHosts = null;
let unsubsRTDBHosts = [];

const obtenerUsuario = () => getls('wiSmile') || null;

const limpiarSuscripcionesHosts = () => {
  if (unsubFirestoreHosts) {
    unsubFirestoreHosts();
    unsubFirestoreHosts = null;
  }
  unsubsRTDBHosts.forEach(unsub => unsub());
  unsubsRTDBHosts = [];
};

const generarHtmlDispositivo = (h) => {
  const esOnline = h.online || false;
  const estado = h.estado || (esOnline ? 'encendido' : 'apagado');
  const isTransitioning = estado === 'encendiendo' || estado === 'suspendiendo' || estado === 'apagando';

  const badgeClass = esOnline ? 'wd_badge_online' : 'wd_badge_offline';
  const icoClass = esOnline ? 'wd_device_ico_online' : 'wd_device_ico_offline';
  const opacityClass = esOnline ? 'wd_card_online' : 'wd_card_offline';
  
  let badgeTexto = esOnline ? 'En Línea' : 'Desconectado';
  let badgeIcon = 'fa-circle';
  let currentBadgeClass = badgeClass;
  
  if (isTransitioning) {
    currentBadgeClass = 'wd_badge_active';
    badgeIcon = 'fa-spinner fa-spin';
    badgeTexto = estado;
  }
  
  const isEncenderDisabled = esOnline || isTransitioning;
  const isSuspenderDisabled = !esOnline || isTransitioning;
  const isApagarDisabled = !esOnline || isTransitioning;

  return `
    <div class="wd_device_card ${opacityClass}">
      <div class="wd_device_header">
        <div class="wd_device_left">
          <div class="wd_device_ico ${icoClass}">
            <i class="fa-solid ${h.macAddress ? 'fa-laptop' : 'fa-desktop'}"></i>
          </div>
          <div class="wd_device_info">
            <strong>${h.alias || h.equipo || 'Equipo Sin Nombre'}</strong>
            <span>IP: ${h.localIp || '—'} | MAC: ${h.macAddress || '—'}</span>
            <div class="wd_device_badge_container">
              <span class="wd_badge ${currentBadgeClass}"><i class="fa-solid ${badgeIcon}"></i> ${badgeTexto.toUpperCase()}</span>
            </div>
          </div>
        </div>
        ${esOnline ? `<button class="wd_btn_icon btn-conectar" data-hostid="${h.idEquipo}" title="Conectar"><i class="fa-solid fa-expand"></i></button>` : ''}
      </div>
      
      <div class="wd_action_buttons_container">
        <button class="wd_action_btn wd_action_btn_success btn-encender" data-hostid="${h.idEquipo}" data-mac="${h.macAddress}" data-ipb="${h.ipBroadcast || '255.255.255.255'}" ${isEncenderDisabled ? 'disabled' : ''}>
          <i class="fa-solid fa-power-off"></i>
          <span>Encender</span>
        </button>
        <button class="wd_action_btn wd_action_btn_warning btn-suspender" data-hostid="${h.idEquipo}" ${isSuspenderDisabled ? 'disabled' : ''}>
          <i class="fa-solid fa-moon"></i>
          <span>Suspender</span>
        </button>
        <button class="wd_action_btn wd_action_btn_error btn-apagar-remoto" data-hostid="${h.idEquipo}" ${isApagarDisabled ? 'disabled' : ''}>
          <i class="fa-solid fa-power-off"></i>
          <span>Apagar</span>
        </button>
      </div>
    </div>
  `;
};

export const render = () => {
  let htmlHosts = '';
  if (cargandoHosts) {
    htmlHosts = `
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
    htmlHosts = hostsRemotos.map(generarHtmlDispositivo).join('');
  }

  return `
    <div class="wd_col">
      <h2 class="wd_panel_title"><i class="fa-solid fa-network-wired"></i> Equipos Remotos</h2>
      <div class="wd_host_list" id="remote-hosts-list">
        ${htmlHosts}
      </div>
    </div>
  `;
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

  container.innerHTML = hostsRemotos.map(generarHtmlDispositivo).join('');
};

const cargarEquiposRemotos = async (userId, localHostName) => {
  limpiarSuscripcionesHosts();

  if (!db || !userId) {
    cargandoHosts = false;
    hostsRemotos = [];
    actualizarVistaHosts();
    return;
  }

  const user = obtenerUsuario();
  if (!user) return;

  const usuarioSanitizado = (user.usuario || 'user').trim().toLowerCase().replace(/[@.]/g, '_');
  const idEquipoLocal = `${usuarioSanitizado}_${localHostName.toLowerCase()}`;

  try {
    const qPcs = query(collection(db, 'pcs'), where('userId', '==', userId));
    
    unsubFirestoreHosts = onSnapshot(qPcs, async (snapshot) => {
      const auxList = [];
      const promesas = [];

      snapshot.forEach((pcDoc) => {
        const pcData = pcDoc.data();
        const idEquipo = pcData.equipoId;
        
        if (idEquipo && idEquipo !== idEquipoLocal) {
          const equipDocRef = doc(db, 'equipos', idEquipo);
          promesas.push(
            getDoc(equipDocRef).then((snap) => {
              if (snap.exists()) {
                auxList.push({
                  id: snap.id,
                  ...snap.data(),
                  online: false
                });
              }
            }).catch(e => console.warn(`[Remotos] No se pudo leer el equipo ${idEquipo}:`, e))
          );
        }
      });

      await Promise.all(promesas);

      unsubsRTDBHosts.forEach(unsub => unsub());
      unsubsRTDBHosts = [];

      hostsRemotos = auxList;
      cargandoHosts = false;

      if (hostsRemotos.length === 0) {
        actualizarVistaHosts();
      } else {
        hostsRemotos.forEach((host, idx) => {
          if (!rtdb || !host.idEquipo) return;
          const presenciaRef = ref(rtdb, `encendido/${usuarioSanitizado}/${host.idEquipo}`);
          const unsubRTDB = onValue(presenciaRef, (snap) => {
            const val = snap.val();
            if (hostsRemotos[idx]) {
              hostsRemotos[idx].online = val ? !!val.online : false;
              hostsRemotos[idx].estado = val?.estado || (val?.online ? 'encendido' : 'apagado');
              hostsRemotos[idx].comando = val?.comando || 'ninguno';
              actualizarVistaHosts();
            }
          });
          unsubsRTDBHosts.push(unsubRTDB);
        });
      }
    }, (err) => {
      console.error('[Remotos] Error al escuchar cambios en pcs registrados:', err);
      cargandoHosts = false;
      actualizarVistaHosts();
    });
  } catch (err) {
    console.error('[Remotos] Error cargando equipos:', err);
    cargandoHosts = false;
    actualizarVistaHosts();
  }
};

const handleRemotosClick = async (e) => {
  // Conectar con Host Remoto
  const btnConectar = e.target.closest('.btn-conectar');
  if (btnConectar) {
    const hostId = btnConectar.getAttribute('data-hostid');
    Notificacion(`Conectando a P2P remoto con ${hostId}...`, 'info');
    rutas.navigate('/pc2pc');
    return;
  }

  // Despertar Remoto (WoL)
  const btnEncender = e.target.closest('.btn-encender');
  if (btnEncender) {
    const mac = btnEncender.getAttribute('data-mac');
    const ipb = btnEncender.getAttribute('data-ipb');
    const idEquipoRemoto = btnEncender.getAttribute('data-hostid');
    wiSpin(btnEncender, true);
    Notificacion(`Enviando paquete mágico a MAC ${mac}...`, 'info');
    
    try {
      await invocarTauri('enviar_wol', { mac, ipBroadcast: ipb || '255.255.255.255' });
      Notificacion('Paquete Wake-on-LAN enviado con éxito', 'success');
      if (rtdb && idEquipoRemoto) {
        const user = obtenerUsuario();
        if (user) {
          const usuarioSanitizado = (user.usuario || 'user').trim().toLowerCase().replace(/[@.]/g, '_');
          const devRef = ref(rtdb, `encendido/${usuarioSanitizado}/${idEquipoRemoto}`);
          await update(devRef, { estado: 'encendiendo' });
        }
      }
    } catch (err) {
      console.error('[Remotos] Error al enviar WoL:', err);
      Notificacion('Error al enviar paquete Wake-on-LAN', 'error');
    } finally {
      wiSpin(btnEncender, false);
    }
    return;
  }

  // Suspender Remoto
  const btnSuspender = e.target.closest('.btn-suspender');
  if (btnSuspender) {
    const idEquipoRemoto = btnSuspender.getAttribute('data-hostid');
    if (confirm(`¿Seguro que deseas suspender remotamente el equipo ${idEquipoRemoto}?`)) {
      if (rtdb) {
        const user = obtenerUsuario();
        if (user) {
          const usuarioSanitizado = (user.usuario || 'user').trim().toLowerCase().replace(/[@.]/g, '_');
          const devRef = ref(rtdb, `encendido/${usuarioSanitizado}/${idEquipoRemoto}`);
          try {
            await update(devRef, { comando: 'suspender', estado: 'suspendiendo' });
            Notificacion('Comando de suspensión remota enviado con éxito', 'success');
          } catch (err) {
            console.error('[Remotos] Error al enviar comando de suspensión remota:', err);
            Notificacion('Error al suspender el equipo remoto', 'error');
          }
        }
      } else {
        Notificacion('Base de datos no disponible', 'warning');
      }
    }
    return;
  }

  // Apagar Remoto
  const btnApagarRemoto = e.target.closest('.btn-apagar-remoto');
  if (btnApagarRemoto) {
    const idEquipoRemoto = btnApagarRemoto.getAttribute('data-hostid');
    if (confirm(`¿Seguro que deseas apagar remotamente el equipo ${idEquipoRemoto}?`)) {
      if (rtdb) {
        const user = obtenerUsuario();
        if (user) {
          const usuarioSanitizado = (user.usuario || 'user').trim().toLowerCase().replace(/[@.]/g, '_');
          const devRef = ref(rtdb, `encendido/${usuarioSanitizado}/${idEquipoRemoto}`);
          try {
            await update(devRef, { comando: 'apagar', estado: 'apagando' });
            Notificacion('Comando de apagado remoto enviado con éxito', 'success');
          } catch (err) {
            console.error('[Remotos] Error al enviar comando de apagado remoto:', err);
            Notificacion('Error al apagar el equipo remoto', 'error');
          }
        }
      } else {
        Notificacion('Base de datos no disponible', 'warning');
      }
    }
  }
};

export const init = async (uid, user) => {
  cargandoHosts = true;
  hostsRemotos = [];
  actualizarVistaHosts();
  
  let localHostName = 'mi-pc';
  try {
    const configTauri = await invocarTauri('obtener_config');
    if (configTauri?.dispositivo_nombre) {
      localHostName = configTauri.dispositivo_nombre;
    }
  } catch (e) {
    console.warn('[Remotos] Error al obtener config local para filtro:', e);
  }

  if (uid) {
    cargarEquiposRemotos(uid, localHostName);
  }

  document.addEventListener('click', handleRemotosClick);
};

export const cleanup = () => {
  limpiarSuscripcionesHosts();
  document.removeEventListener('click', handleRemotosClick);
};


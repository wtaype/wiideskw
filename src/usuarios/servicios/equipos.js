// usuarios/servicios/equipos.js — Servicio de fondo: presencia en RTDB solamente
import { auth, rtdb } from '../../firebase.js';
import { ref, set, onDisconnect, serverTimestamp as rtTimestamp } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { getls } from '../../widev.js';

const invocarTauri = async (cmd, args = {}) => {
  if (window.__TAURI__?.core?.invoke) {
    return await window.__TAURI__.core.invoke(cmd, args);
  }
  throw new Error(`[Equipos] Tauri no disponible para: ${cmd}`);
};

let _idEquipoActual = null;

const detener = async () => {
  if (_idEquipoActual && rtdb) {
    try {
      const presenciaRef = ref(rtdb, `presencia/${_idEquipoActual}`);
      await set(presenciaRef, {
        online:      false,
        actualizado: rtTimestamp(),
      });
      console.log(`[Equipos] Presencia marcada offline para: ${_idEquipoActual}`);
    } catch (err) {
      console.error('[Equipos] Error al desactivar presencia en detener:', err);
    }
    _idEquipoActual = null;
  }
  console.log('[Equipos] Servicio detenido.');
};

const iniciar = async (user) => {
  if (!user?.email) return;

  // Solo arrancar el servicio de fondo si estamos en Tauri
  if (!window.__TAURI__) {
    console.log('[Equipos] Entorno Web ordinario detectado. Servicio de fondo local desactivado.');
    return;
  }

  let config = null;
  try {
    config = await invocarTauri('obtener_config');
  } catch (err) {
    console.error('[Equipos] Error al obtener configuración de Tauri. Cancelando inicio.', err);
    return;
  }

  if (!config || !config.dispositivo_nombre) {
    console.warn('[Equipos] Configuración de Tauri vacía o inválida. Cancelando inicio.');
    return;
  }

  const nombrePC = config.dispositivo_nombre.trim();
  const usuarioSanitizado = (user.usuario || 'user').trim().toLowerCase().replace(/[@.]/g, '_');
  const idEquipo = `${usuarioSanitizado}_${nombrePC.toLowerCase()}`;
  _idEquipoActual = idEquipo;

  // Presencia en tiempo real via RTDB (sin heartbeat)
  if (rtdb) {
    try {
      const presenciaRef = ref(rtdb, `presencia/${idEquipo}`);
      await onDisconnect(presenciaRef).set({
        online:      false,
        actualizado: rtTimestamp(),
      });
      await set(presenciaRef, {
        online:      true,
        actualizado: rtTimestamp(),
      });
      console.log(`[Equipos] Presencia RTDB activa para: ${idEquipo}`);
    } catch (err) {
      console.error('[Equipos] Error al configurar presencia RTDB:', err);
    }
  }

  console.log('[Equipos] Servicio activo (Presencia RTDB solamente).');
};

// ── Arranque automático al detectar sesión ─────────────────────────────────────
onAuthStateChanged(auth, (firebaseUser) => {
  detener();
  if (firebaseUser) {
    const uLocal = typeof getls === 'function' ? getls('wiSmile') : null;
    iniciar({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      usuario: uLocal?.usuario || firebaseUser.displayName || firebaseUser.email.split('@')[0],
    });
  }
});

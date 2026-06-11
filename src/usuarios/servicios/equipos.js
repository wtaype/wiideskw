// usuarios/servicios/equipos.js — Servicio de fondo: comandos y presencia en RTDB
import { auth, rtdb } from '../../firebase.js';
import { ref, set, onDisconnect, onValue, serverTimestamp as rtTimestamp } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { getls } from '../../widev.js';

const invocarTauri = async (cmd, args = {}) => {
  if (window.__TAURI__?.core?.invoke) {
    return await window.__TAURI__.core.invoke(cmd, args);
  }
  throw new Error(`[Equipos] Tauri no disponible para: ${cmd}`);
};

let _idEquipoActual = null;
let _usuarioActual = null;
let _unsubRTDB = null;

const detener = async () => {
  if (_unsubRTDB) {
    _unsubRTDB();
    _unsubRTDB = null;
  }
  if (_idEquipoActual && _usuarioActual && rtdb) {
    try {
      const presenciaRef = ref(rtdb, `encendido/${_usuarioActual}/${_idEquipoActual}`);
      await set(presenciaRef, {
        online:      false,
        estado:      'apagado',
        comando:     'ninguno',
        actualizado: rtTimestamp(),
      });
      console.log(`[Equipos] Presencia marcada offline para: ${_idEquipoActual}`);
    } catch (err) {
      console.error('[Equipos] Error al desactivar presencia en detener:', err);
    }
  }
  _idEquipoActual = null;
  _usuarioActual = null;
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
  _usuarioActual = usuarioSanitizado;

  // 1. Presencia en tiempo real via RTDB (sin heartbeat)
  if (rtdb) {
    try {
      const presenciaRef = ref(rtdb, `encendido/${usuarioSanitizado}/${idEquipo}`);
      await onDisconnect(presenciaRef).set({
        online:      false,
        estado:      'apagado',
        comando:     'ninguno',
        actualizado: rtTimestamp(),
      });
      await set(presenciaRef, {
        online:      true,
        estado:      'encendido',
        comando:     'ninguno',
        actualizado: rtTimestamp(),
      });
      console.log(`[Equipos] Presencia RTDB activa para: ${idEquipo}`);
    } catch (err) {
      console.error('[Equipos] Error al configurar presencia RTDB:', err);
    }
  }

  // 2. Escucha de comandos en tiempo real desde RTDB
  if (rtdb) {
    try {
      const comandoRef = ref(rtdb, `encendido/${usuarioSanitizado}/${idEquipo}/comando`);
      _unsubRTDB = onValue(comandoRef, async (snapshot) => {
        const cmd = snapshot.val();
        if (cmd && cmd !== 'ninguno') {
          console.log(`[Equipos] Comando remoto recibido desde RTDB: ${cmd}`);
          
          // Resetear el comando a 'ninguno' en RTDB (Handshake rápido en RTDB para evitar bucles)
          let resetExitoso = false;
          try {
            await set(comandoRef, 'ninguno');
            console.log('[Equipos] Handshake: Comando reseteado a "ninguno" en RTDB con éxito.');
            resetExitoso = true;
          } catch (err) {
            console.error('[Equipos] Error crítico al resetear comando en RTDB. Cancelando ejecución nativa.', err);
          }

          // Ejecutar el comando nativo correspondiente en Rust solo si el reseteo fue exitoso
          if (resetExitoso) {
            try {
              if (cmd === 'apagar') {
                console.log('[Equipos] Ejecutando comando apagar_equipo...');
                await invocarTauri('apagar_equipo');
              } else if (cmd === 'suspender') {
                console.log('[Equipos] Ejecutando comando suspender_equipo...');
                await invocarTauri('suspender_equipo');
              }
            } catch (err) {
              console.error(`[Equipos] Error al ejecutar comando nativo (${cmd}):`, err);
            }
          }
        }
      }, (err) => {
        console.error('[Equipos] Error en listener de comandos de RTDB:', err);
      });
      console.log(`[Equipos] Listener de comandos RTDB activo para: ${idEquipo}`);
    } catch (err) {
      console.error('[Equipos] Error al inicializar listener de RTDB:', err);
    }
  }

  console.log('[Equipos] Servicio activo (Comandos y Presencia en RTDB).');
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


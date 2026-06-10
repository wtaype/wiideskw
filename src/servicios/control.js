// servicios/control.js — Servicio de fondo: presencia RTDB + escucha de comandos
// Se importa una sola vez en main.js y vive durante toda la sesión del usuario.
//
// ✅ Sin setInterval — la presencia usa Firebase RTDB onDisconnect()
//    → Solo 2 writes por sesión (conectar / desconectar), sin importar duración.
import { auth, db, rtdb } from '../firebase.js';
import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { ref, set, onDisconnect, serverTimestamp as rtTimestamp } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { wiAuth } from '../widev.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

const invocarTauri = async (cmd, args = {}) => {
  if (window.__TAURI__?.core?.invoke) {
    return await window.__TAURI__.core.invoke(cmd, args);
  }
  throw new Error(`[ControlRemoto] Tauri no disponible para: ${cmd}`);
};

const obtenerNombrePC = async () => {
  try {
    const config = await invocarTauri('obtener_config');
    return config?.dispositivo_nombre?.trim() || 'mi-pc';
  } catch {
    return 'mi-pc';
  }
};

// ── Estado interno del servicio ────────────────────────────────────────────────

let _unsubSnapshot = null;

const detener = () => {
  if (_unsubSnapshot) {
    _unsubSnapshot();
    _unsubSnapshot = null;
  }
  console.log('[ControlRemoto] Servicio detenido.');
};

// ── Núcleo del servicio ────────────────────────────────────────────────────────

const iniciar = async (user) => {
  if (!db || !user?.usuario) return;

  const nombrePC = await obtenerNombrePC();
  const docId    = `${user.usuario.trim().toLowerCase()}_${nombrePC.toLowerCase()}`;
  const docRef   = doc(db, 'control', docId);

  // ── Registro inicial del equipo en Firestore ───────────────────────────────
  try {
    await setDoc(docRef, {
      id:          docId,
      uid:         user.uid || '',
      usuario:     user.usuario,
      equipo:      nombrePC,
      actualizado: serverTimestamp(),
      comando:     'ninguno',
      // 'estado' no se resetea aquí — preserva el último valor conocido
    }, { merge: true });
    console.log(`[ControlRemoto] Equipo registrado: ${docId}`);
  } catch (err) {
    console.error('[ControlRemoto] Error al registrar equipo:', err);
    return;
  }

  // ── Presencia en tiempo real via RTDB (sin setInterval) ───────────────────
  // 1 write al conectar + 1 write automático de Firebase al desconectar
  try {
    const presenciaRef = ref(rtdb, `presencia/${docId}`);
    // Al desconectar (lo configura Firebase para ejecutarse en el servidor):
    await onDisconnect(presenciaRef).set({
      online:      false,
      actualizado: rtTimestamp(),
    });
    // Marcar como online ahora:
    await set(presenciaRef, {
      online:      true,
      actualizado: rtTimestamp(),
    });
    console.log('[ControlRemoto] Presencia RTDB activa — sin heartbeat.');
  } catch (err) {
    console.error('[ControlRemoto] Error al configurar presencia RTDB:', err);
  }

  // ── Escucha de comandos remotos en tiempo real (Firestore onSnapshot) ─────
  _unsubSnapshot = onSnapshot(docRef, async (snap) => {
    if (!snap.exists()) return;
    const { comando } = snap.data();
    if (!comando || comando === 'ninguno') return;

    // Ejecutar y registrar el nuevo estado permanente
    let estadoResultante = 'ninguno';
    if (comando === 'apagar')    estadoResultante = 'apagado';
    if (comando === 'suspender') estadoResultante = 'suspendido';

    // Resetear el comando e inmediatamente escribir el estado resultante
    try {
      await setDoc(docRef, {
        comando: 'ninguno',
        estado:  estadoResultante,
      }, { merge: true });
    } catch (err) {
      console.error('[ControlRemoto] Error al resetear comando:', err);
    }

    console.log(`[ControlRemoto] Comando recibido: ${comando} → estado: ${estadoResultante}`);

    try {
      if (comando === 'apagar')    await invocarTauri('apagar_equipo');
      if (comando === 'suspender') await invocarTauri('suspender_equipo');
    } catch (err) {
      console.error(`[ControlRemoto] Error ejecutando comando "${comando}":`, err);
    }
  });

  console.log('[ControlRemoto] Servicio activo — RTDB presencia + onSnapshot comandos.');
};

// ── Arranque automático al detectar sesión ─────────────────────────────────────

onAuthStateChanged(auth, (firebaseUser) => {
  detener();
  if (firebaseUser) {
    const localUser = wiAuth.user;
    if (localUser && localUser.uid === firebaseUser.uid) {
      iniciar(localUser);
    } else {
      iniciar({
        uid: firebaseUser.uid,
        usuario: firebaseUser.displayName || firebaseUser.email.split('@')[0],
      });
    }
  }
});

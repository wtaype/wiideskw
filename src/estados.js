// estados.js — Store reactivo compartido y sincronizador genérico de Firestore
import { db, auth } from './firebase.js';
import { doc, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { wiAuth } from './widev.js';

// ── 1. CONFIGURACIÓN Y ESTADO DE COMANDOS ─────────────────────────────────────

// Mapeo de colecciones a escuchar. Para agregar una nueva, añade un objeto al array:
// Ejemplo: { coleccion: 'accesos', estadoKey: 'accesoComputadora' }
const CONFIG_LISTENERS = [
  { coleccion: 'lab',     estadoKey: 'labComando' },
  { coleccion: 'control', estadoKey: 'controlPC'  }
];

const _estado = {};
CONFIG_LISTENERS.forEach(cfg => {
  _estado[cfg.estadoKey] = { cmd: '—', index: 0 };
});

const actualizadorGeneral = (estadoKey, data, isInitial) => {
  if (isInitial) return;

  switch (estadoKey) {
    case 'labComando': {
      const cmd = data.comando;
      if (cmd && cmd !== 'ninguno' && cmd !== '—') {
        reproducirSonido(cmd);
      }
      break;
    }
    case 'controlPC': {
      const cmd    = data.comando;
      const estado = data.estado;
      if (cmd && cmd !== 'ninguno' && cmd !== '—') {
        console.log(`[Estados] Control PC — comando pendiente: ${cmd}`);
      }
      if (estado && estado !== 'ninguno' && estado !== '—') {
        console.log(`[Estados] Control PC — estado actual: ${estado}`);
      }
      break;
    }
  }
};


// ── 2. NÚCLEO DE LA TIENDA REACTIVA (STORE) ───────────────────────────────────
const _suscriptores = new Set();

export const getEstado = (clave) => clave ? _estado[clave] : { ..._estado };

export const setEstado = (cambios) => {
  Object.assign(_estado, cambios);
  _suscriptores.forEach(fn => fn({ ..._estado }));
};

export const suscribir = (fn) => {
  _suscriptores.add(fn);
  return () => { _suscriptores.delete(fn); };
};

export const limpiarSesion = () => {
  const reset = {};
  CONFIG_LISTENERS.forEach(cfg => {
    reset[cfg.estadoKey] = { cmd: '—', index: 0 };
  });
  setEstado(reset);
};

const reproducirSonido = async (cmd) => {
  if (window.__TAURI__ && window.__TAURI__.core && typeof window.__TAURI__.core.invoke === 'function') {
    try {
      await window.__TAURI__.core.invoke('lib_genial', { cmd });
    } catch (err) {
      console.error('Error al invocar Rust:', err);
    }
  } else {
    console.log(`[Estados] Simulación de pitido: "${cmd}"`);
  }
};


// ── 3. SINCRONIZACIÓN DE SESIÓN Y FIRESTORE ───────────────────────────────────
let unsubs = [];

wiAuth.on((user) => {
  unsubs.forEach(unsub => unsub());
  unsubs = [];

  if (user && user.uid) {
    console.log(`[Estados] Conectando listeners genéricos para: ${user.email}`);

    CONFIG_LISTENERS.forEach(({ coleccion, estadoKey }) => {
      let isInitial = true;
      const docRef = doc(db, coleccion, user.uid);

      const unsub = onSnapshot(docRef, async (snap) => {
        if (!snap.exists()) return;

        const data = snap.data();
        const actual = getEstado(estadoKey) || { cmd: '—', index: 0 };
        const nuevoIndex = (actual.index || 0) + 1;

        console.log(`[Estados] [${coleccion}] Datos recibidos:`, data);

        setEstado({
          [estadoKey]: { ...data, index: nuevoIndex }
        });

        actualizadorGeneral(estadoKey, data, isInitial);
        isInitial = false;
      });
      unsubs.push(unsub);
    });
  }
});

export const salir = async (keep = []) => {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('vault_unlocked');
  }
  try {
    await signOut(auth);
  } catch (e) {
    console.error('signOut:', e);
  }
  const keysToKeep = Array.from(new Set(['wiTema', 'cookiesPrivacidad', ...keep]));
  wiAuth.logout(keysToKeep);
};

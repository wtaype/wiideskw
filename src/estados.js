// estados.js — Store reactivo compartido de sesión entre todos los módulos JS
import { db, auth } from './firebase.js';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { wiAuth } from './widev.js';

const _estado = {
  labComando: { cmd: '—', index: 0 },           // Último comando del laboratorio (sonidos)
};

const _suscriptores = new Set();

/** Lee el estado completo o una clave específica */
export const getEstado = (clave) =>
  clave ? _estado[clave] : { ..._estado };

/** Actualiza una o varias claves y notifica a todos los suscriptores */
export const setEstado = (cambios) => {
  Object.assign(_estado, cambios);
  _suscriptores.forEach(fn => fn({ ..._estado }));
};

/** Suscribe una función a los cambios de estado. Retorna la función de baja (cleanup) */
export const suscribir = (fn) => {
  _suscriptores.add(fn);
  console.log(`[Estados] Suscriptor añadido. Total suscriptores: ${_suscriptores.size}`);
  return () => {
    const deleted = _suscriptores.delete(fn);
    console.log(`[Estados] Suscriptor eliminado (${deleted}). Total suscriptores: ${_suscriptores.size}`);
  };
};

/** Limpia la sesión al cerrar sesión */
export const limpiarSesion = () => setEstado({
  labComando: { cmd: '—', index: 0 },
});

// Listener global de Firestore para sonidos del Lab (con contador incremental)
let unsubFirestoreLab = null;
let isInitial = true;

wiAuth.on((user) => {
  if (unsubFirestoreLab) {
    console.log('[Estados] Desconectando listener global de comandos...');
    unsubFirestoreLab();
    unsubFirestoreLab = null;
  }

  if (user && user.uid) {
    console.log(`[Estados] Conectando listener global de comandos para: ${user.email}`);
    isInitial = true; // Reiniciar al conectar sesión
    
    unsubFirestoreLab = onSnapshot(doc(db, 'lab', user.uid), async (snap) => {
      if (!snap.exists()) return;
      
      const data = snap.data();
      const cmd = data.comando ?? '—';

      // Leemos el estado actual e incrementamos el índice
      const actual = getEstado('labComando') || { cmd: '—', index: 0 };
      const nuevoIndex = (actual.index || 0) + 1;

      console.log(`[Estados] Comando detectado en Firestore: "${cmd}", index: ${nuevoIndex}`);

      // Actualizamos el estado compartido reactivo global con el nuevo comando y su índice secuencial
      setEstado({
        labComando: {
          cmd: cmd,
          index: nuevoIndex
        }
      });

      // Si es la carga inicial, no reproducimos sonido
      if (isInitial) {
        isInitial = false;
        console.log(`[Estados] Carga inicial de sonidos omitida: "${cmd}"`);
        return;
      }

      // Reproducir sonido global si es un comando de sonido válido
      if (cmd && cmd !== 'ninguno' && cmd !== '—') {
        console.log(`[Estados] Reproduciendo sonido global para: "${cmd}"`);
        if (window.__TAURI__ && window.__TAURI__.core && typeof window.__TAURI__.core.invoke === 'function') {
          try {
            await window.__TAURI__.core.invoke('lib_genial', { cmd });
          } catch (err) {
            console.error('Error al invocar Rust desde estados.js:', err);
          }
        } else {
          console.log(`[Estados] Simulación de pitido global: "${cmd}"`);
        }
      }
    });
  }
});

// Función global de cierre de sesión
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

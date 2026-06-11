// src/usuarios/estados/nucleo.js — Motor reactivo del Store
import { auth } from '../../firebase.js';
import { signOut } from 'firebase/auth';
import { wiAuth } from '../../widev.js';

const _estado = {};
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

export const reproducirSonido = async (cmd) => {
  if (window.__TAURI__?.core?.invoke) {
    try {
      await window.__TAURI__.core.invoke('lib_genial', { cmd });
    } catch (err) {
      console.error('Error al invocar Rust:', err);
    }
  } else {
    console.log(`[Estados] Simulación de pitido: "${cmd}"`);
  }
};

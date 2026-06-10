// estado.js — Store reactivo compartido de sesión entre todos los módulos JS
// Patrón: suscriptores con cleanup automático (compatible con init/cleanup de cada módulo)

const _estado = {
  usuarioActual: null,       // { uid, email, nombre } — tras Google Auth
  hostConectado: null,       // { hostId, alias, localIp, macAddress } — equipo activo
  estadoWebRTC: 'inactivo',  // 'inactivo' | 'negociando' | 'conectado' | 'caido'
  pinVerificado: false,      // true después de verificar el PIN correctamente
  wolActivo: false,          // true si el adaptador de red tiene WoL habilitado
  labComando: '—',           // Último comando del laboratorio (sonidos)
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
  return () => _suscriptores.delete(fn);
};

/** Limpia la sesión al cerrar sesión */
export const limpiarSesion = () => setEstado({
  usuarioActual: null,
  hostConectado: null,
  estadoWebRTC: 'inactivo',
  pinVerificado: false,
  labComando: '—',
});
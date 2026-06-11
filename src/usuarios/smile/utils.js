// usuarios/smile/utils.js — Utilidades comunes para la conexión de hosts
export const invocarTauri = async (cmd, args = {}) => {
  if (!window.__TAURI__?.core?.invoke) {
    throw new Error('Tauri no disponible');
  }
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Tiempo de espera de Tauri agotado (4s) para ${cmd}`)), 4000)
  );
  return Promise.race([window.__TAURI__.core.invoke(cmd, args), timeoutPromise]);
};

export const formatearCodigo9Digitos = (cod) => {
  if (!cod || cod.length !== 9) return cod || '—';
  return `${cod.slice(0, 3)} ${cod.slice(3, 6)} ${cod.slice(6, 9)}`;
};

// Stub para APIs de Tauri cuando corre en navegador (sin Tauri)
// En producción con Tauri, el alias se remueve y usa el real
export const invoke = async (cmd, args) => {
  console.warn(`[WiiDesk] Tauri stub — invoke('${cmd}')`, args);
  // Fallbacks para dev en browser
  if (cmd === "get_lan_ip") return "192.168.1.x (demo)";
  if (cmd === "get_network_info") return { ip: "192.168.1.x", port: 8765 };
  if (cmd === "start_ws_server") return "Servidor simulado activo (demo)";
  if (cmd === "stop_ws_server") return null;
  if (cmd === "get_server_status") return false;
  return null;
};
export const listen = async () => () => {};
export const emit = async () => {};

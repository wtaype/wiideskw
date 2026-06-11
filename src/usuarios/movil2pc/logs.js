// src/usuarios/movil2pc/logs.js — Componente independiente de Consola de Logs WebRTC
export const render = () => {
  return `
    <!-- CONSOLA DE REGISTROS WebRTC -->
    <div class="m2p_card m2p_console" style="grid-column: 1 / -1;">
      <h3><i class="fas fa-terminal"></i> Registro de Actividad (WebRTC logs)</h3>
      <div class="m2p_logs" id="m2p-logs-box">
        <div class="m2p_log_line system"><span class="log_time">[00:00:00]</span> Módulo Móvil a PC inicializado. Listo para recibir conexiones.</div>
      </div>
    </div>
  `;
};

/**
 * Agrega una línea de registro en el terminal visual
 */
export const agregarLog = (msg, tipo = 'info') => {
  const box = document.getElementById('m2p-logs-box');
  if (!box) return;
  const time = new Date().toTimeString().split(' ')[0];
  const div = document.createElement('div');
  div.className = `m2p_log_line ${tipo}`;
  div.innerHTML = `<span class="log_time">[${time}]</span> ${msg}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
};

export const init = () => {};
export const cleanup = () => {};

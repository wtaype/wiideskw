import './lab/lab.css'; // Reutilizamos los estilos premium del lab existente
import { getls } from '../widev.js';
import { rtdb } from '../firebase.js';
import { ref, onValue, set } from 'firebase/database';

const wi = () => getls('wiSmile') || {};
let unsubLab1UI = null;

// ── RENDER: UI del Laboratorio 1 con RTDB ──
export const render = () => {
  const u = wi();
  if (!u.email) return '';
  
  return `
    <div class="lab_wrap">
      <h2 class="lab_title">Lab 1 — Realtime Database ⚡</h2>
      <div class="lab_card">
        <p class="lab_card_desc">Envía comandos de sonido usando Firebase Realtime Database. El PC reaccionará al instante mediante WebSockets.</p>
        <div class="lab_btns">
          <button class="lab_btn lab_info" data-cmd="hello">Emitir Asterisk</button>
          <button class="lab_btn lab_error" data-cmd="error" style="background-color:#ef4444; border-color:#ef4444;">Detención Crítica</button>
          <button class="lab_btn lab_warning" data-cmd="alerta" style="background-color:#f59e0b; border-color:#f59e0b;">Advertencia</button>
          <button class="lab_btn lab_none" data-cmd="ninguno">Detener/Limpiar</button>
        </div>
        <p class="lab_estado">Estado en RTDB: <strong id="lab1-cmd-rt">—</strong></p>
      </div>
    </div>
  `;
};

// ── ENVÍO A RTDB: Guarda el comando directamente en Realtime Database ──
const enviarComandoRT = async (cmd) => {
  const { uid } = wi();
  if (!uid || !rtdb) return;
  
  console.log(`[Lab1 UI] Escribiendo comando "${cmd}" a RTDB...`);
  try {
    const commandRef = ref(rtdb, `lab1/${uid}`);
    await set(commandRef, {
      comando: cmd
    });
  } catch (err) {
    console.error('[Lab1 UI] Error al escribir en RTDB:', err);
  }
};

// ── INICIALIZACIÓN Y LIMPIEZA ──────────────────────────────────
export const init = () => {
  cleanup();
  const { uid } = wi();
  if (!uid || !rtdb) return;

  const el = document.getElementById('lab1-cmd-rt');

  // Escuchamos los cambios en la base de datos en tiempo real para actualizar la pantalla
  const commandRef = ref(rtdb, `lab1/${uid}`);
  unsubLab1UI = onValue(commandRef, (snapshot) => {
    const data = snapshot.val();
    const cmd = data?.comando || '—';
    if (el) {
      el.textContent = cmd;
    }
  });

  // Escucha clics en los botones
  document.addEventListener('click', handleBtnClick);
};

const handleBtnClick = (e) => {
  const btn = e.target.closest('.lab_btn');
  if (btn) {
    enviarComandoRT(btn.dataset.cmd);
  }
};

export const cleanup = () => {
  document.removeEventListener('click', handleBtnClick);
  if (unsubLab1UI) {
    unsubLab1UI();
    unsubLab1UI = null;
  }
};

import './lab.css';
import { getls } from '../widev.js';
import { db } from '../firebase.js';
import { doc, setDoc } from 'firebase/firestore';
import { getEstado, suscribir } from '../estado.js';

const wi = () => getls('wiSmile') || {};
let unsubEstado = null;

// ── RENDER: Muestra los botones y el estado actual de los comandos ──
export const render = () => {
  const u = wi();
  if (!u.email) return '';
  
  // Leemos el comando actual desde el estado global reactivo
  const comandoActual = getEstado('labComando') || '—';
  
  return `
    <div class="lab_wrap">
      <h2 class="lab_title">Lab — Solo Sonidos</h2>
      <div class="lab_card">
        <p class="lab_card_desc">Envía comandos de sonido desde la web o el móvil.</p>
        <div class="lab_btns">
          <button class="lab_btn lab_info" data-cmd="hello">Emitir Pitido</button>
          <button class="lab_btn lab_none" data-cmd="ninguno">Detener/Limpiar</button>
        </div>
        <p class="lab_estado">Estado actual: <strong id="lab-cmd-rt">${comandoActual}</strong></p>
      </div>
    </div>
  `;
};

// ── ENVÍO A FIRESTORE: Guarda el comando junto con un timestamp para evitar duplicados
const enviarComando = async (cmd) => {
  const { uid } = wi();
  if (!uid) return;
  
  console.log(`[Lab] Enviando comando "${cmd}" con marca de tiempo...`);
  await setDoc(doc(db, 'lab', uid), { 
    comando: cmd,
    timestamp: Date.now() // Timestamp para asegurar que se identifique como comando nuevo
  }, { merge: true });
};

// ── INICIALIZACIÓN Y LIMPIEZA ──────────────────────────────────
export const init = () => {
  cleanup();

  // Suscribirse a los cambios del estado compartido global para actualizar la UI reactivamente
  unsubEstado = suscribir((estado) => {
    const el = document.getElementById('lab-cmd-rt');
    if (el) {
      el.textContent = estado.labComando || '—';
    }
  });

  // Escucha clics en los botones de esta pantalla
  document.addEventListener('click', handleBtnClick);
};

const handleBtnClick = (e) => {
  const btn = e.target.closest('.lab_btn');
  if (btn) {
    enviarComando(btn.dataset.cmd);
  }
};

export const cleanup = () => {
  document.removeEventListener('click', handleBtnClick);
  if (unsubEstado) {
    unsubEstado();
    unsubEstado = null;
  }
};

import './lab/lab.css';
import { getls } from '../widev.js';
import { db } from '../firebase.js';
import { doc, setDoc } from 'firebase/firestore';
import { getEstado, suscribir } from '../estados.js';

const wi = () => getls('wiSmile') || {};
let unsubEstado = null;

// ── RENDER: Muestra los botones y el estado actual de los comandos ──
export const render = () => {
  const u = wi();
  if (!u.email) return '';
  
  const actual = getEstado('labComando') || { cmd: '—', index: 0 };
  
  return `
    <div class="lab_wrap">
      <h2 class="lab_title">Lab — Solo Sonidos</h2>
      <div class="lab_card">
        <p class="lab_card_desc">Envía comandos de sonido desde la web o el móvil.</p>
        <div class="lab_btns">
          <button class="lab_btn lab_info" data-cmd="hello">Emitir Pitido</button>
          <button class="lab_btn lab_none" data-cmd="ninguno">Detener/Limpiar</button>
        </div>
        <p class="lab_estado">Estado actual: <strong id="lab-cmd-rt">${actual.cmd || '—'}</strong></p>
      </div>
    </div>
  `;
};

// ── ENVÍO A FIRESTORE: Guarda el comando
const enviarComando = async (cmd) => {
  const { uid } = wi();
  if (!uid) return;
  
  console.log(`[Lab] Enviando comando "${cmd}"...`);
  await setDoc(doc(db, 'lab', uid), { 
    comando: cmd,
    userId: uid
  }, { merge: true });
};

// ── INICIALIZACIÓN Y LIMPIEZA ──────────────────────────────────
export const init = () => {
  cleanup();
  
  // Sincronizamos la UI al entrar
  const actual = getEstado('labComando') || { cmd: '—', index: 0 };
  const el = document.getElementById('lab-cmd-rt');
  if (el) {
    el.textContent = actual.cmd || '—';
  }

  // Suscribirse al estado reactivo global solo para actualizar la UI
  unsubEstado = suscribir((estado) => {
    const labCmd = estado.labComando || { cmd: '—', index: 0 };
    const elRt = document.getElementById('lab-cmd-rt');
    if (elRt) {
      elRt.textContent = labCmd.cmd;
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

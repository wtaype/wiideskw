import './lab.css';
import { getls } from '../widev.js';
import { db } from '../firebase.js';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

const wi = () => getls('wiSmile') || {};
let unsubFirestore = null;

// ── RENDER: Muestra los botones y el estado actual de los comandos ──
export const render = () => {
  const u = wi();
  if (!u.email) return '';
  
  return `
    <div class="lab_wrap">
      <h2 class="lab_title">Lab — Solo Sonidos</h2>
      <div class="lab_card">
        <p class="lab_card_desc">Envía comandos de sonido desde la web o el móvil.</p>
        <div class="lab_btns">
          <button class="lab_btn lab_info" data-cmd="hello">Emitir Pitido</button>
          <button class="lab_btn lab_none" data-cmd="ninguno">Detener/Limpiar</button>
        </div>
        <p class="lab_estado">Estado actual: <strong id="lab-cmd-rt">—</strong></p>
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
    comando: cmd
  }, { merge: true });
};

// ── INICIALIZACIÓN Y LIMPIEZA ──────────────────────────────────
export const init = () => {
  cleanup();

  const { uid } = wi();
  if (uid) {
    unsubFirestore = onSnapshot(doc(db, 'lab', uid), async (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const cmd = data.comando ?? '—';

      const el = document.getElementById('lab-cmd-rt');
      if (el) {
        el.textContent = cmd;
      }

      if (cmd && cmd !== 'ninguno' && cmd !== '—') {
        // Ejecutar sonido nativo
        if (window.__TAURI__ && window.__TAURI__.core && typeof window.__TAURI__.core.invoke === 'function') {
          try {
            await window.__TAURI__.core.invoke('lib_genial', { cmd });
          } catch (err) {
            console.error('Error al invocar Rust desde lab.js:', err);
          }
        } else {
          console.log(`[Lab] Simulación de pitido: "${cmd}"`);
        }
      }
    });
  }

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
  if (unsubFirestore) {
    unsubFirestore();
    unsubFirestore = null;
  }
};


import { db } from '../firebase.js';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { getls } from '../widev.js';

const getU = () => getls('wiSmile') || {};

export const render = () => `
  <div style="padding: 20px; text-align: center;">
    <h2>Lab Firestore</h2>
    <button onclick="window.enviarLab('Hola')">Hola</button>
    <button onclick="window.enviarLab('Hello')">Hello</button>
    <p>Activo: <strong id="lab-cmd">—</strong></p>
  </div>`;

window.enviarLab = c => {
  const { usuario, userId } = getU();
  if (usuario && userId) setDoc(doc(db, 'lab', usuario), { texto: c, userId }, { merge: true });
};

export const init = () => {
  const { usuario } = getU();
  if (usuario) {
    window.unsubLab = onSnapshot(doc(db, 'lab', usuario), s => {
      const el = document.getElementById('lab-cmd');
      if (el) el.textContent = s.data()?.texto || '—';
    });
  }
};

export const cleanup = () => window.unsubLab?.();

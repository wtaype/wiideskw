// src/usuarios/estados/lab.js — Estado y oyente del Laboratorio
import { db } from '../../firebase.js';
import { doc, onSnapshot } from 'firebase/firestore';
import { wiAuth } from '../../widev.js';
import { getEstado, setEstado, reproducirSonido } from './nucleo.js';

// Inicializar el estado de este módulo
setEstado({ labComando: { cmd: '—', index: 0 } });

let unsub = null;

wiAuth.on((user) => {
  if (unsub) {
    unsub();
    unsub = null;
  }

  if (user && user.uid) {
    let isInitial = true;
    const docRef = doc(db, 'labComando', user.uid);

    unsub = onSnapshot(docRef, (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();
      const actual = getEstado('labComando') || { cmd: '—', index: 0 };
      const nuevoIndex = (actual.index || 0) + 1;

      setEstado({
        labComando: { ...data, index: nuevoIndex }
      });

      if (!isInitial) {
        const cmd = data.comando;
        if (cmd && cmd !== 'ninguno' && cmd !== '—') {
          reproducirSonido(cmd);
        }
      }
      isInitial = false;
    }, (err) => {
      console.error('[Estados/Lab] Error en Firestore snapshot:', err);
    });
  }
});

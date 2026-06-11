// servicios/lab1.js — Servicio de fondo: Lab 1 Realtime Database
// Escucha comandos de sonido en tiempo real desde RTDB y llama a Rust (MessageBeep).
import { auth, rtdb } from '../../firebase.js';
import { ref, onValue, set } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { wiAuth } from '../../widev.js';

let _unsubLab1 = null;

const detener = () => {
  if (_unsubLab1) {
    _unsubLab1();
    _unsubLab1 = null;
  }
  console.log('[Lab1] Servicio de fondo detenido.');
};

const invocarTauri = async (cmd, args = {}) => {
  if (window.__TAURI__?.core?.invoke) {
    return await window.__TAURI__.core.invoke(cmd, args);
  }
  console.log(`[Lab1] Simulación de Tauri: ${cmd} con args:`, args);
};

const iniciar = (user) => {
  if (!rtdb || !user?.uid) return;

  const labRef = ref(rtdb, `lab1/${user.uid}`);
  console.log(`[Lab1] Conectando listener RTDB para: lab1/${user.uid}`);

  // onValue crea la suscripción en tiempo real a RTDB
  _unsubLab1 = onValue(labRef, async (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    const cmd = data.comando;
    if (cmd && cmd !== 'ninguno') {
      console.log(`[Lab1] Comando de sonido recibido de RTDB: ${cmd}`);
      
      // Invocar el comando de sonido nativo en Rust (Tauri)
      try {
        await invocarTauri('lib_genial_lab1', { cmd });
      } catch (err) {
        console.error('[Lab1] Error al reproducir sonido en Rust:', err);
      }

      // Resetear el comando a 'ninguno' en RTDB para evitar bucles infinitos (Handshake)
      try {
        await set(ref(rtdb, `lab1/${user.uid}/comando`), 'ninguno');
      } catch (err) {
        console.error('[Lab1] Error al resetear comando en RTDB:', err);
      }
    }
  });
};

onAuthStateChanged(auth, (firebaseUser) => {
  detener();
  if (firebaseUser) {
    const localUser = wiAuth.user;
    if (localUser && localUser.uid === firebaseUser.uid) {
      iniciar(localUser);
    } else {
      iniciar({
        uid: firebaseUser.uid,
      });
    }
  }
});

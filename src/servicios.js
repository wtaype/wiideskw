// servicios.js — Servicio global en segundo plano para escuchar comandos de Firestore (ej. sonidos)
import { db } from './firebase.js';
import { doc, onSnapshot } from 'firebase/firestore';
import { wiAuth } from './widev.js';
import { setEstado } from './estado.js';

let unsubLab = null;
let ultimoTimestamp = null;

// Escucha los cambios de sesión (login/logout) de forma reactiva
wiAuth.on((user) => {
  // Si cambia el usuario o cierra sesión, cancelamos la suscripción anterior
  if (unsubLab) {
    console.log('🔌 Desconectando listener global de comandos...');
    unsubLab();
    unsubLab = null;
    ultimoTimestamp = null;
  }

  // Si hay un usuario válido conectado
  if (user && user.uid) {
    console.log(`🔌 Conectando listener global de comandos para el usuario: ${user.email}`);
    
    unsubLab = onSnapshot(doc(db, 'lab', user.uid), async (snap) => {
      if (!snap.exists()) return;
      
      const data = snap.data();
      const cmd = data.comando ?? '—';
      const timestamp = data.timestamp ?? null;

      console.log(`[Servicio] Comando detectado en Firestore: "${cmd}", timestamp: ${timestamp}`);

      // Actualizar el estado compartido reactivo global
      setEstado({ labComando: cmd });

      // Inicialización de primer disparo al cargar la app
      if (ultimoTimestamp === null) {
        // Asignamos el timestamp actual para no hacer sonar comandos viejos
        ultimoTimestamp = timestamp || Date.now();
        console.log(`[Servicio] Inicializando marca de tiempo de control en: ${ultimoTimestamp}`);
        return;
      }

      // Validar si el comando es realmente nuevo y no una lectura repetida
      if (timestamp && timestamp > ultimoTimestamp) {
        ultimoTimestamp = timestamp;
        console.log(`[Servicio] Ejecutando nuevo comando de sonido: "${cmd}"`);

        // Si el comando es un sonido válido, invocamos a Rust
        if (cmd && cmd !== '—' && cmd !== 'ninguno') {
          const hasGlobalTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;
          if (hasGlobalTauri && window.__TAURI__.core?.invoke) {
            try {
              await window.__TAURI__.core.invoke('lib_genial', { cmd });
            } catch (err) {
              console.error('Error al invocar Rust desde servicios.js:', err);
            }
          } else {
            console.log(`[Servicio] Simulación de sonido nativo (fuera de Tauri): Emmit beep para "${cmd}"`);
          }
        }
      }
    });
  } else {
    // Si no hay sesión activa, el estado global vuelve a estar vacío
    setEstado({ labComando: '—' });
  }
});

// usuarios/servicios/pcs.js — Gestión del código de conexión único (idPc) estilo AnyDesk
import { db } from '../../firebase.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const invocarTauri = async (cmd, args = {}) => {
  if (window.__TAURI__?.core?.invoke) {
    return await window.__TAURI__.core.invoke(cmd, args);
  }
  throw new Error(`[PCS] Tauri no disponible para: ${cmd}`);
};

// Generar código aleatorio de 9 dígitos
const generarCodigo9Digitos = () => {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
};

/**
 * Registra y valida el código único de conexión de 9 dígitos (idPc) para este equipo.
 */
export const registrarCodigoConexion = async (userId, idEquipo) => {
  if (!db || !userId || !idEquipo) return null;

  try {
    const config = await invocarTauri('obtener_config');
    let idPc = config?.id_pc || '';

    // 1. Si ya existe el código local, verificar disponibilidad en Firestore
    if (idPc) {
      const pcRef = doc(db, 'pcs', idPc);
      const pcSnap = await getDoc(pcRef);
      if (pcSnap.exists()) {
        const data = pcSnap.data();
        if (data.userId !== userId) {
          console.log(`[PCS] Colisión: el código local ${idPc} pertenece a otro usuario. Se generará uno nuevo.`);
          idPc = '';
        } else {
          console.log(`[PCS] Código de conexión existente validado para este usuario: ${idPc}`);
        }
      } else {
        console.log(`[PCS] El código determinista ${idPc} está libre en la nube. Se procederá a registrar.`);
      }
    }

    // 2. Si no existe un código válido (o hubo colisión), generamos uno nuevo aleatorio y único
    if (!idPc) {
      let intento = 0;
      while (intento < 10) {
        const codigoCandidato = generarCodigo9Digitos();
        const pcRef = doc(db, 'pcs', codigoCandidato);
        const pcSnap = await getDoc(pcRef);

        if (!pcSnap.exists()) {
          idPc = codigoCandidato;
          break;
        }
        intento++;
      }
    }

    if (!idPc) {
      throw new Error('No se pudo generar un código único de 9 dígitos tras 10 intentos.');
    }

    // 3. Registrar en la colección 'pcs'
    const pcDocRef = doc(db, 'pcs', idPc);
    await setDoc(pcDocRef, {
      idPc,
      equipoId: idEquipo,
      userId,
      creado: serverTimestamp(),
    }, { merge: true });

    // 4. Guardar en la configuración local de Tauri
    config.id_pc = idPc;
    await invocarTauri('guardar_config', { config });
    console.log(`[PCS] Código de conexión registrado con éxito: ${idPc}`);
    return idPc;
  } catch (err) {
    console.error('[PCS] Error al registrar o validar el código de conexión:', err);
    return null;
  }
};


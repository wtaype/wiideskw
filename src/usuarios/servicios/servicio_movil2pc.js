// src/usuarios/servicios/servicio_movil2pc.js — Servicio de transmisión y control remoto por WebRTC
import { auth, rtdb, db } from '../../firebase.js';
import { doc, setDoc } from 'firebase/firestore';
import { ref, set, onValue, onChildAdded, remove, off } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { getEstado, setEstado } from '../estados/estados.js';

export const invocarTauri = async (cmd, args = {}) => {
  if (window.__TAURI__?.core?.invoke) {
    return await window.__TAURI__.core.invoke(cmd, args);
  }
  throw new Error(`[Móvil2PC] Tauri no disponible para: ${cmd}`);
};

let _localStream = null;
let _peerConnection = null;
let _sessionRef = null;
let _listeners = []; // Guardar referencias de listeners de RTDB para limpiarlos

/**
 * Escucha cambios de autenticación para limpiar si es necesario.
 */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    detenerTransmision();
  } else {
    // Al iniciar, verificar si ya tiene un PIN configurado en la configuración local
    verificarEstadoPin();
  }
});

/**
 * Verifica si hay un PIN guardado localmente en la configuración.
 */
export const verificarEstadoPin = async () => {
  try {
    const config = await invocarTauri('obtener_config');
    const tienePin = !!(config?.seguridad?.pin_hash && config?.seguridad?.pin_salt);
    setEstado({ movil2pcPinConfigurado: tienePin });
  } catch (err) {
    console.error('[Móvil2PC] Error al verificar estado del PIN:', err);
  }
};

/**
 * Guarda un nuevo PIN de seguridad local.
 */
export const guardarNuevoPIN = async (pin) => {
  try {
    const [hash, salt] = await invocarTauri('configurar_pin_seguro', { pin });
    const config = await invocarTauri('obtener_config');
    
    config.seguridad = {
      requerir_pin: true,
      pin_hash: hash,
      pin_salt: salt
    };
    
    await invocarTauri('guardar_config', { config });

    const idPc = config?.id_pc;
    if (idPc && auth.currentUser) {
      const docRef = doc(db, 'pcs', idPc);
      await setDoc(docRef, {
        userId: auth.currentUser.uid,
        conPin: true,
        pin: salt,
        pinHash: hash
      }, { merge: true });
    }

    setEstado({ movil2pcPinConfigurado: true });
    console.log('[Móvil2PC] PIN de seguridad actualizado con éxito.');
    return true;
  } catch (err) {
    console.error('[Móvil2PC] Error al guardar nuevo PIN:', err);
    throw err;
  }
};

/**
 * Detiene y limpia la transmisión actual.
 */
export const detenerTransmision = async () => {
  console.log('[Móvil2PC] Deteniendo transmisión y limpiando recursos...');
  
  // 1. Apagar listeners de RTDB
  _listeners.forEach(({ rtdbRef, callback, eventType }) => {
    try {
      off(rtdbRef, eventType, callback);
    } catch (e) {}
  });
  _listeners = [];

  // 2. Eliminar sesión de RTDB si existe
  if (_sessionRef) {
    try {
      await remove(_sessionRef);
    } catch (e) {}
    _sessionRef = null;
  }

  // 3. Cerrar conexión WebRTC
  if (_peerConnection) {
    _peerConnection.close();
    _peerConnection = null;
  }

  // 4. Detener captura de pantalla
  if (_localStream) {
    _localStream.getTracks().forEach(track => track.stop());
    _localStream = null;
  }

  setEstado({
    movil2pcConectado: false,
    movil2pcEstado: 'apagado'
  });
};

/**
 * Inicia la captura de pantalla y el canal de señalización en RTDB.
 */
export const iniciarTransmision = async () => {
  try {
    // 1. Validar sesión
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado.');

    // 2. Obtener configuración (para idPc y PIN)
    const config = await invocarTauri('obtener_config');
    const idPc = config?.id_pc;
    if (!idPc) throw new Error('El equipo no posee un código único de conexión (idPc). Registre el equipo primero.');

    const pinHash = config?.seguridad?.pin_hash;
    const pinSalt = config?.seguridad?.pin_salt;
    const requerirPin = !!(pinHash && pinSalt);

    setEstado({ movil2pcEstado: 'conectando' });

    // 3. Capturar pantalla y audio de sistema (si está configurado)
    const usarAudio = getEstado('movil2pcAudio');
    const calidad = getEstado('movil2pcCalidad');
    const constraints = {
      video: {
        width: calidad === '1080p' ? 1920 : 1280,
        height: calidad === '1080p' ? 1080 : 720,
        frameRate: 30
      },
      audio: usarAudio ? {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      } : false
    };

    console.log('[Móvil2PC] Solicitando captura de pantalla con constraints:', constraints);
    _localStream = await navigator.mediaDevices.getDisplayMedia(constraints);
    console.log('[Móvil2PC] Captura de pantalla iniciada con éxito.');

    // Escuchar si el usuario cancela la captura desde el banner del sistema
    _localStream.getVideoTracks()[0].onended = () => {
      console.log('[Móvil2PC] El usuario detuvo la captura de pantalla.');
      detenerTransmision();
    };

    // 4. Crear la sesión en RTDB
    _sessionRef = ref(rtdb, `conexiones/${idPc}`);
    
    const datosSesion = {
      tipo: 'movil2pc',
      estado: 'esperando',
      creado: Date.now(),
      userId: user.uid
    };

    await set(_sessionRef, datosSesion);
    if (idPc && user) {
      const docRef = doc(db, 'pcs', idPc);
      await setDoc(docRef, {
        userId: user.uid,
        conPin: requerirPin,
        pin: pinSalt || '',
        pinHash: pinHash || ''
      }, { merge: true });
    }
    console.log(`[Móvil2PC] Sesión registrada en RTDB: conexiones/${idPc}`);

    // 5. Escuchar cambios de estado en la sesión
    const estadoRef = ref(rtdb, `conexiones/${idPc}/estado`);
    const onEstadoChange = onValue(estadoRef, async (snapshot) => {
      const estado = snapshot.val();
      if (!estado) return;

      console.log('[Móvil2PC] Cambio de estado de sesión en RTDB:', estado);
      if (estado === 'conectando') {
        iniciarWebRtcConnection(idPc);
      } else if (estado === 'rechazado') {
        console.warn('[Móvil2PC] Conexión rechazada o fallida.');
        setTimeout(() => detenerTransmision(), 2000);
      }
    });

    _listeners.push({ rtdbRef: estadoRef, callback: onEstadoChange, eventType: 'value' });
    setEstado({ movil2pcEstado: 'esperando' });

  } catch (err) {
    console.error('[Móvil2PC] Error al iniciar la transmisión:', err);
    detenerTransmision();
  }
};

/**
 * Inicializa la conexión peer-to-peer WebRTC y comienza el handshake de SDP e ICE.
 */
const iniciarWebRtcConnection = async (idPc) => {
  try {
    const config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    _peerConnection = new RTCPeerConnection(config);

    // Agregar tracks locales del stream capturado
    _localStream.getTracks().forEach(track => {
      _peerConnection.addTrack(track, _localStream);
    });

    // Enviar ICE candidates locales a la RTDB (cands2 para el receptor PC)
    _peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        const nuevoCandidatoRef = ref(rtdb, `conexiones/${idPc}/cands2/${Math.random().toString(36).substring(2)}`);
        await set(nuevoCandidatoRef, event.candidate.toJSON());
      }
    };

    // Escuchar cuando el canal de datos esté listo (el celular inicia el canal de datos)
    _peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      console.log('[Móvil2PC] Canal de datos abierto:', channel.label);
      
      channel.onmessage = (msgEvent) => {
        try {
          const cmd = JSON.parse(msgEvent.data);
          procesarComandoRemoto(cmd);
        } catch (e) {
          console.error('[Móvil2PC] Error al procesar comando del canal de datos:', e);
        }
      };

      channel.onopen = () => {
        console.log('[Móvil2PC] Canal de datos listo para recibir comandos.');
        setEstado({ 
          movil2pcConectado: true,
          movil2pcEstado: 'conectado'
        });
      };

      channel.onclose = () => {
        console.log('[Móvil2PC] Canal de datos cerrado.');
        detenerTransmision();
      };
    };

    // Escuchar la oferta SDP del celular (oferta)
    const ofertaRef = ref(rtdb, `conexiones/${idPc}/oferta`);
    onValue(ofertaRef, async (snapshot) => {
      const sdpOferta = snapshot.val();
      if (!sdpOferta) return;

      console.log('[Móvil2PC] Recibida oferta SDP del celular. Generando respuesta...');
      await _peerConnection.setRemoteDescription(new RTCSessionDescription({
        type: 'offer',
        sdp: sdpOferta
      }));

      const respuesta = await _peerConnection.createAnswer();
      await _peerConnection.setLocalDescription(respuesta);

      // Escribir la respuesta en la RTDB (respuesta)
      await set(ref(rtdb, `conexiones/${idPc}/respuesta`), respuesta.sdp);
      await set(ref(rtdb, `conexiones/${idPc}/estado`), 'conectado');
      console.log('[Móvil2PC] Respuesta SDP subida a RTDB.');
    }, { onlyOnce: true });

    // Escuchar candidatos ICE del celular (cands1 para el iniciador)
    const candidatosAndroidRef = ref(rtdb, `conexiones/${idPc}/cands1`);
    const onCandidatoAgregado = onChildAdded(candidatosAndroidRef, async (snapshot) => {
      const candidateData = snapshot.val();
      if (!candidateData) return;

      try {
        await _peerConnection.addIceCandidate(new RTCIceCandidate(candidateData));
        console.log('[Móvil2PC] Candidato ICE del celular agregado con éxito.');
      } catch (err) {
        console.error('[Móvil2PC] Error al agregar candidato ICE del celular:', err);
      }
    });

    _listeners.push({ rtdbRef: candidatosAndroidRef, callback: onCandidatoAgregado, eventType: 'child_added' });

  } catch (err) {
    console.error('[Móvil2PC] Error al inicializar conexión WebRTC:', err);
    detenerTransmision();
  }
};

/**
 * Envia el comando al backend en Rust.
 */
const procesarComandoRemoto = async (cmd) => {
  try {
    switch (cmd.tipo) {
      case 'mouse_move':
        await invocarTauri('mover_cursor', { xNormalizado: cmd.x, yNormalizado: cmd.y });
        break;
      case 'mouse_click':
        await invocarTauri('simular_clic', { boton: cmd.boton, presionado: cmd.presionado });
        break;
      case 'teclado':
        await invocarTauri('simular_teclado', { texto: cmd.texto });
        break;
      case 'tecla_especial':
        await invocarTauri('simular_tecla_especial', { tecla: cmd.tecla, presionado: cmd.presionado });
        break;
      default:
        console.warn('[Móvil2PC] Comando remoto no reconocido:', cmd.tipo);
    }
  } catch (err) {
    console.error('[Móvil2PC] Error al ejecutar comando en Tauri:', err);
  }
};

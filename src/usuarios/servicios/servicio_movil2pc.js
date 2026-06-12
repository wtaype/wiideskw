// src/usuarios/servicios/servicio_movil2pc.js — Servicio de transmisión y control remoto por WebRTC
import { auth, rtdb, db } from '../../firebase.js';
import { doc, setDoc } from 'firebase/firestore';
import { ref, set, onValue, onChildAdded, remove, off, onDisconnect } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { getEstado, setEstado } from '../estados/estados.js';
import { agregarLog } from '../movil2pc/logs.js';

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
let _remoteDescriptionSet = false;
let _iceCandidateQueue = [];

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
    const [salt, hash] = await invocarTauri('registrar_pin', { pin });
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
        pinSalt: salt,
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

  _remoteDescriptionSet = false;
  _iceCandidateQueue = [];

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

    agregarLog('Solicitando captura de pantalla...', 'info');
    console.log('[Móvil2PC] Solicitando captura de pantalla con constraints:', constraints);
    _localStream = await navigator.mediaDevices.getDisplayMedia(constraints);
    agregarLog('Captura de pantalla iniciada con éxito.', 'success');
    console.log('[Móvil2PC] Captura de pantalla iniciada con éxito.');

    // Escuchar si el usuario cancela la captura desde el banner del sistema
    _localStream.getVideoTracks()[0].onended = () => {
      console.log('[Móvil2PC] El usuario detuvo la captura de pantalla.');
      agregarLog('El usuario canceló la captura de pantalla desde el sistema.', 'warning');
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
    await onDisconnect(_sessionRef).remove();
    if (idPc && user) {
      const docRef = doc(db, 'pcs', idPc);
      await setDoc(docRef, {
        userId: user.uid,
        conPin: requerirPin,
        pinSalt: pinSalt || '',
        pinHash: pinHash || ''
      }, { merge: true });
    }
    agregarLog('Identificador de conexión registrado en la nube.', 'success');
    console.log(`[Móvil2PC] Sesión registrada en RTDB: conexiones/${idPc}`);

    // 5. Escuchar cambios de estado en la sesión
    const estadoRef = ref(rtdb, `conexiones/${idPc}/estado`);
    const onEstadoChange = onValue(estadoRef, async (snapshot) => {
      const estado = snapshot.val();
      if (!estado) return;

      console.log('[Móvil2PC] Cambio de estado de sesión en RTDB:', estado);
      if (estado === 'conectando') {
        agregarLog('Recibida señal de conexión. Inicializando enlace WebRTC...', 'warning');
        iniciarWebRtcConnection(idPc);
      } else if (estado === 'rechazado') {
        agregarLog('Conexión finalizada o rechazada por el dispositivo móvil.', 'error');
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

    agregarLog('Inicializando objeto PeerConnection...', 'info');
    _peerConnection = new RTCPeerConnection(config);

    _peerConnection.onconnectionstatechange = () => {
      const state = _peerConnection.connectionState;
      agregarLog(`Estado de conexión P2P: ${state}`, state === 'connected' ? 'success' : (state === 'failed' || state === 'closed' ? 'error' : 'warning'));
      console.log('[Móvil2PC] Estado de conexión P2P:', state);
    };

    _peerConnection.oniceconnectionstatechange = () => {
      const state = _peerConnection.iceConnectionState;
      agregarLog(`Estado de transporte ICE: ${state}`, state === 'connected' || state === 'completed' ? 'success' : (state === 'failed' ? 'error' : 'warning'));
      console.log('[Móvil2PC] Estado de transporte ICE:', state);
    };

    // Agregar tracks locales del stream capturado
    agregarLog('Enlazando pistas de video/audio de captura de pantalla...', 'info');
    _localStream.getTracks().forEach(track => {
      _peerConnection.addTrack(track, _localStream);
    });

    // Enviar ICE candidates locales a la RTDB (cands2 para el receptor PC)
    _peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        const nuevoCandidatoRef = ref(rtdb, `conexiones/${idPc}/cands2/${Math.random().toString(36).substring(2)}`);
        await set(nuevoCandidatoRef, event.candidate.toJSON());
        agregarLog('Generado y publicado candidato ICE local.', 'info');
      }
    };

    // Escuchar cuando el canal de datos esté listo (el celular inicia el canal de datos)
    _peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      agregarLog(`Canal de datos de control remoto detectado: ${channel.label}`, 'info');
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
        agregarLog('¡Canal de datos de control remoto listo para recibir comandos!', 'success');
        console.log('[Móvil2PC] Canal de datos listo para recibir comandos.');
        setEstado({ 
          movil2pcConectado: true,
          movil2pcEstado: 'conectado'
        });
      };

      channel.onclose = () => {
        agregarLog('Canal de datos de control remoto cerrado.', 'error');
        console.log('[Móvil2PC] Canal de datos cerrado.');
        detenerTransmision();
      };
    };

    // Escuchar la oferta SDP del celular (oferta)
    const ofertaRef = ref(rtdb, `conexiones/${idPc}/oferta`);
    onValue(ofertaRef, async (snapshot) => {
      const sdpOferta = snapshot.val();
      if (!sdpOferta) return;

      agregarLog(`Recibida oferta SDP del celular (longitud: ${sdpOferta.length} caracteres). Aplicando...`, 'info');
      console.log('[Móvil2PC] Recibida oferta SDP del celular. Generando respuesta...');
      
      try {
        await _peerConnection.setRemoteDescription(new RTCSessionDescription({
          type: 'offer',
          sdp: sdpOferta
        }));
        _remoteDescriptionSet = true;
        agregarLog('Oferta SDP remota aplicada con éxito. Procesando candidatos ICE en cola...', 'success');
      } catch (err) {
        agregarLog(`Error al configurar la oferta SDP remota: ${err.message}`, 'error');
        console.error('[Móvil2PC] Error setRemoteDescription:', err);
        return;
      }

      // Procesar candidatos ICE en cola
      while (_iceCandidateQueue.length > 0) {
        const candidate = _iceCandidateQueue.shift();
        try {
          await _peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          agregarLog('Candidato ICE de la cola aplicado con éxito.', 'info');
        } catch (err) {
          agregarLog(`Error al aplicar candidato ICE de la cola: ${err.message}`, 'error');
        }
      }

      try {
        agregarLog('Generando respuesta SDP (Answer)...', 'info');
        const respuesta = await _peerConnection.createAnswer();
        
        agregarLog('Aplicando respuesta SDP local...', 'info');
        await _peerConnection.setLocalDescription(respuesta);

        // Escribir la respuesta en la RTDB (respuesta)
        await set(ref(rtdb, `conexiones/${idPc}/respuesta`), respuesta.sdp);
        await set(ref(rtdb, `conexiones/${idPc}/estado`), 'conectado');
        agregarLog('Respuesta SDP enviada a la base de datos. Enlace WebRTC establecido.', 'success');
        console.log('[Móvil2PC] Respuesta SDP subida a RTDB.');
      } catch (err) {
        agregarLog(`Fallo al generar o aplicar respuesta SDP local: ${err.message}`, 'error');
        console.error('[Móvil2PC] Error createAnswer/setLocalDescription:', err);
      }
    }, { onlyOnce: true });

    // Escuchar candidatos ICE del celular (cands1 para el iniciador)
    const candidatosAndroidRef = ref(rtdb, `conexiones/${idPc}/cands1`);
    const onCandidatoAgregado = onChildAdded(candidatosAndroidRef, async (snapshot) => {
      const candidateData = snapshot.val();
      if (!candidateData) return;

      if (_remoteDescriptionSet) {
        try {
          await _peerConnection.addIceCandidate(new RTCIceCandidate(candidateData));
          agregarLog('Candidato ICE del móvil aplicado con éxito.', 'info');
          console.log('[Móvil2PC] Candidato ICE del celular agregado con éxito.');
        } catch (err) {
          agregarLog(`Error al aplicar candidato ICE del móvil: ${err.message}`, 'error');
          console.error('[Móvil2PC] Error al agregar candidato ICE del celular:', err);
        }
      } else {
        _iceCandidateQueue.push(candidateData);
        agregarLog('Candidato ICE del móvil encolado (esperando oferta SDP remota).', 'warning');
        console.log('[Móvil2PC] Candidato ICE del celular encolado.');
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

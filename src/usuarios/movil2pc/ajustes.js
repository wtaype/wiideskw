// src/usuarios/movil2pc/ajustes.js — Componente de configuración de seguridad y calidad
import { getEstado, setEstado } from '../estados/estados.js';
import { guardarNuevoPIN } from '../servicios/servicio_movil2pc.js';
import { Notificacion } from '../../widev.js';
import { filtrarAlfanumerico, validarPin } from './devs.js';

let docListeners = [];

const onDoc = (type, selector, handler) => {
  const wrapper = (e) => {
    const target = selector ? e.target.closest(selector) : e.target;
    if (target) handler.call(target, e);
  };
  document.addEventListener(type, wrapper);
  docListeners.push({ type, wrapper });
};

export const render = () => {
  const pinConfigurado = getEstado('movil2pcPinConfigurado');
  const calidad = getEstado('movil2pcCalidad') || '720p';
  const audioActivo = getEstado('movil2pcAudio');
  
  const btnTexto = pinConfigurado ? 'Cambiar PIN' : 'Guardar PIN';

  return `
    <div class="m2p_card m2p_permisos">
      <h3><i class="fas fa-shield-halved"></i> Configuración de Seguridad</h3>
      <p class="m2p_card_subtitle">Asegura tu pantalla con un PIN de acceso personal.</p>
      
      <div class="m2p_options_list" style="margin-bottom: 2.5rem;">
        <!-- Estado del PIN -->
        <div class="m2p_option_row" style="cursor: default;">
          <div class="m2p_opt_info">
            <strong>
              <i class="fas ${pinConfigurado ? 'fa-lock' : 'fa-lock-open'}" style="color: ${pinConfigurado ? 'var(--success)' : 'var(--warning)'};"></i>
              Estado del PIN
            </strong>
            <span>${pinConfigurado ? 'Protegido de forma segura con PIN de acceso.' : 'Sin protección. Configura un PIN para habilitar la transmisión.'}</span>
          </div>
        </div>

        <!-- Entrada de nuevo PIN -->
        <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem;">
          <label style="font-weight: 700; color: var(--tx1);">Configurar / Cambiar PIN:</label>
          <div style="display: flex; gap: 1rem;">
            <input type="password" id="txt-nuevo-pin" class="m2p_pin_input" placeholder="INGRESA PIN 4-6" maxlength="6" />
            <button class="wd_btn" id="btn-m2p-guardar-pin" style="width: auto; padding: 1.25vh 3vh; background: var(--mco); color: #000; border: none;">
              ${btnTexto}
            </button>
          </div>
        </div>
      </div>

      <h3><i class="fas fa-sliders"></i> Ajustes de Transmisión</h3>
      <p class="m2p_card_subtitle">Configura la calidad de video y audio según tu conexión.</p>
      
      <div class="m2p_options_list">
        <!-- Selector de Calidad -->
        <div class="m2p_option_row" style="cursor: default;">
          <div class="m2p_opt_info">
            <strong>Resolución de Video</strong>
            <span>Elige la nitidez de la pantalla compartida.</span>
          </div>
          <select id="sel-calidad-video" style="padding: 0.5rem; border-radius: 4px; border: 1px solid var(--brd); background: var(--bg3); color: var(--tx1); font-weight: 700;">
            <option value="720p" ${calidad === '720p' ? 'selected' : ''}>720p (Recomendado)</option>
            <option value="1080p" ${calidad === '1080p' ? 'selected' : ''}>1080p (Alta Calidad)</option>
          </select>
        </div>

        <!-- Checkbox de Audio -->
        <label class="m2p_option_row">
          <div class="m2p_opt_info">
            <strong>Capturar Audio de Sistema</strong>
            <span>Enviar el sonido de tu laptop al celular.</span>
          </div>
          <input type="checkbox" id="chk-audio-sistema" ${audioActivo ? 'checked' : ''} />
        </label>
      </div>
    </div>
  `;
};

export const init = (agregarLogFn) => {
  cleanup();

  // Filtrar caracteres no alfanuméricos en tiempo real
  onDoc('input', '#txt-nuevo-pin', function() {
    this.value = filtrarAlfanumerico(this.value);
  });

  // Guardar nuevo PIN
  onDoc('click', '#btn-m2p-guardar-pin', async () => {
    const pinTxt = document.getElementById('txt-nuevo-pin')?.value || '';
    if (!validarPin(pinTxt)) {
      Notificacion('El PIN debe tener entre 4 y 6 caracteres (letras y números)', 'warning');
      return;
    }

    try {
      await guardarNuevoPIN(pinTxt);
      Notificacion('PIN de seguridad guardado con éxito', 'success');
      if (typeof agregarLogFn === 'function') {
        agregarLogFn('PIN de seguridad actualizado de forma segura.');
      }
      const txtPin = document.getElementById('txt-nuevo-pin');
      if (txtPin) txtPin.value = '';
    } catch (err) {
      Notificacion('Error al configurar el PIN', 'error');
    }
  });

  // Selector de Calidad
  onDoc('change', '#sel-calidad-video', function() {
    setEstado({ movil2pcCalidad: this.value });
    if (typeof agregarLogFn === 'function') {
      agregarLogFn(`Resolución de video cambiada a: <strong>${this.value.toUpperCase()}</strong>`);
    }
  });

  // Checkbox de Audio
  onDoc('change', '#chk-audio-sistema', function() {
    setEstado({ movil2pcAudio: this.checked });
    if (typeof agregarLogFn === 'function') {
      agregarLogFn(`Captura de audio de sistema: <strong>${this.checked ? 'Habilitada' : 'Deshabilitada'}</strong>`);
    }
  });
};

export const cleanup = () => {
  docListeners.forEach(({ type, wrapper }) => {
    document.removeEventListener(type, wrapper);
  });
  docListeners = [];
};

import './verificar.css';
import { rutas } from '../../rutas.js';
import { Mensaje, wiAuth, getls } from '../../widev.js';
import { db, auth } from '../../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '../../wii.js';

// ── ESPERAR SESIÓN DE FIREBASE ───────────────────────────────────────────────
const waitAuth = () => new Promise(r => {
  if (auth.currentUser) return r(auth.currentUser);
  const unsub = onAuthStateChanged(auth, u => { unsub(); r(u); });
});

// ── TOTP NATIVO (Web Crypto API — sin dependencias) ───────────────────────────
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const b32decode = str => {
  let bits = 0, val = 0;
  const out = [];
  for (const c of str.replace(/=+$/, '').toUpperCase())
    { val = (val << 5) | B32.indexOf(c); bits += 5; if (bits >= 8) { out.push((val >>> (bits - 8)) & 0xff); bits -= 8; } }
  return new Uint8Array(out);
};

const generateSecret = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return Array.from(bytes, b => B32[b & 31]).join('');
};

const totpToken = async (secret, offset = 0) => {
  const epoch = Math.floor(Date.now() / 30000) + offset;
  const cnt   = new ArrayBuffer(8);
  new DataView(cnt).setUint32(4, epoch, false);
  const key = await crypto.subtle.importKey('raw', b32decode(secret), { name:'HMAC', hash:'SHA-1' }, false, ['sign']);
  const sig  = new Uint8Array(await crypto.subtle.sign('HMAC', key, cnt));
  const off  = sig[19] & 0xf;
  const code = ((sig[off] & 0x7f) << 24 | sig[off+1] << 16 | sig[off+2] << 8 | sig[off+3]) % 1_000_000;
  return code.toString().padStart(6, '0');
};

const verifyTOTP = async (token, secret) => {
  for (const d of [-1, 0, 1]) if (await totpToken(secret, d) === token) return true;
  return false;
};

// ── GUARD DE SEGURIDAD ────────────────────────────────────────────────────────
const guard = (user) => {
  const wi = getls('wiSmile');
  if (!user || !wi)                                        return (rutas.navigate('/login'), false);
  if (wi.rol !== 'admin')                                  return (rutas.navigate('/'), false);
  if (wi.estado !== 'activo')                              return (rutas.navigate('/registrado'), false);
  if (sessionStorage.getItem('vault_unlocked') === 'true') return (rutas.navigate('/admin'), false);
  return wi;
};

// ── SVG LOGO GOOGLE AUTHENTICATOR (Premium) ───────────────────────────────────
const SVG_GOOGLE_AUTH = `
  <svg viewBox="0 0 512 512" class="vault_svg_logo" xml:space="preserve">
    <path fill="#1A73E8" d="M440,256.0v0.0C440,273.1,426.1,287,409.0,287H302l-46-93.0l49.7-86.0 c8.6-14.8,27.5-19.9,42.3-11.3l0.0,0.0c14.8,8.6,19.9,27.5,11.3,42.3 L309.7,225h99.3C426.1,225,440,238.9,440,256.0z"/>
    <path fill="#EA4335" d="M348.0,415.3l-0.0,0.0c-14.8,8.6-33.8,3.5-42.3-11.3L256,318.0 l-49.7,86.0c-8.6,14.8-27.5,19.9-42.3,11.3l-0.0-0.0 c-14.8-8.6-19.9-27.5-11.3-42.3L202.3,287L256,285l53.7,2l49.7,86.0 C367.9,387.8,362.8,406.8,348.0,415.3z"/>
    <path fill="#FBBC04" d="M256,194.0L242,232l-39.7-7l-49.7-86.0 c-8.6-14.8-3.5-33.8,11.3-42.3l0.0-0.0c14.8-8.6,33.8-3.5,42.3,11.3 L256,194.0z"/>
    <path fill="#34A853" d="M248,225l-36,62H103.0C85.9,287,72,273.1,72,256.0v-0.0 C72,238.9,85.9,225,103.0,225H248z"/>
    <polygon fill="#185DB7" points="309.7,287 202.3,287 256,194.0 "/>
  </svg>
`;

// ── INNER TEMPLATES ───────────────────────────────────────────────────────────
const HTML_INNER_SETUP = `
  <h1 class="vault_title">Configura tu Bóveda</h1>
  <p class="vault_subtitle">Escanea este código QR con <strong>Google Authenticator</strong> para proteger el panel de administración.</p>

  <div id="vault_qr_wrap" class="vault_qr_wrap">
    <canvas id="vault_qr"></canvas>
    <div class="vault_qr_shine"></div>
  </div>
  <p class="vault_qr_hint"><i class="fas fa-info-circle"></i> Abre Google Authenticator → Añadir cuenta → Escanear QR</p>

  <div class="vault_auth_box" style="margin-top:1.5rem">
    <label>Ingresa el código de 6 dígitos para confirmar</label>
    <div class="vault_input_wrap">
      <i class="fas fa-th"></i>
      <input type="text" id="vault_code_setup" placeholder="000000" maxlength="6" autocomplete="off" inputmode="numeric" />
    </div>
    <button id="btn_vault_confirmar" class="vault_btn_primary" disabled>
      <i class="fas fa-lock"></i> Confirmar y Cerrar Puerta
    </button>
  </div>
`;

const HTML_INNER_UNLOCK = `
  <h1 class="vault_title">Verificar que eres tú</h1>
  <p class="vault_subtitle">Abre <strong>Google Authenticator</strong> en tu celular e ingresa el código de 6 dígitos.</p>

  <div class="vault_auth_box">
    <div class="vault_input_wrap vault_input_lg">
      <i class="fas fa-th"></i>
      <input type="text" id="vault_code" placeholder="000000" maxlength="6"
             autocomplete="off" inputmode="numeric" autofocus />
    </div>
    <button id="btn_code" class="vault_btn_primary">
      <i class="fas fa-unlock"></i> Verificar y Entrar
    </button>
  </div>

  <button id="btn_vault_back" class="vault_btn_back">
    <i class="fas fa-arrow-left"></i> Volver al inicio
  </button>
`;

// ── STATE ─────────────────────────────────────────────────────────────────────
let _secret = null;
let _isSetup = false;
let _intervaloTimer = null;
const TIEMPO_LIMITE = 60; // segundos (configurable)

// ── TEMPORIZADOR AUTO-LOGOUT PERSISTENTE (localStorage) ──
function _iniciarTimer() {
  if (_intervaloTimer) clearInterval(_intervaloTimer);
  
  let expire = localStorage.getItem('vault_expire');
  if (!expire) {
    expire = Date.now() + (TIEMPO_LIMITE * 1000);
    localStorage.setItem('vault_expire', expire);
  }
  
  const calcularSegundos = () => Math.max(0, Math.ceil((parseInt(expire) - Date.now()) / 1000));
  let segundos = calcularSegundos();
  
  const vaultTimer = document.getElementById('vault_timer');
  if (vaultTimer) vaultTimer.textContent = `${segundos}s`;
  
  const tick = async () => {
    segundos = calcularSegundos();
    const vt = document.getElementById('vault_timer');
    if (vt) vt.textContent = `${segundos}s`;
    
    if (segundos <= 0) {
      if (_intervaloTimer) clearInterval(_intervaloTimer);
      _intervaloTimer = null;
      localStorage.removeItem('vault_expire');
      Mensaje('Sesión cerrada por inactividad', 'error');
      
      const { salir } = await import('../../usuarios/estados/estados.js');
      await salir();
    }
  };
  
  tick(); // Verificar inmediatamente
  if (segundos > 0) {
    _intervaloTimer = setInterval(tick, 1000);
  }
}

const _bloquearTema = (e) => {
  e.stopPropagation();
  e.preventDefault();
  Mensaje('<i class="fas fa-exclamation-circle"></i> No está permitido cambiar de tema en esta página.', 'warning');
};

// ── RENDER ────────────────────────────────────────────────────────────────────
// Renderizamos sincrónicamente el esqueleto de la bóveda para evitar pantallas blancas en F5
export const render = () => {
  const wi = getls('wiSmile');
  if (!wi || wi.rol !== 'admin') return '';

  return `
    <div class="vault_wrap">
      <div class="vault_card" id="vault_card_container">
        <div class="vault_timer_band">
          <i class="fas fa-clock fa-spin"></i> Cierre de seguridad en <strong id="vault_timer">60s</strong>
        </div>
        <div class="vault_logo_wrapper">
          ${SVG_GOOGLE_AUTH}
        </div>
        <div id="vault_content_area" style="text-align:center;padding:1rem 0">
          <i class="fas fa-spinner fa-spin fa-2x" style="color:var(--tx3,#aaa)"></i>
          <p style="margin-top:1rem;color:var(--tx2)">Cargando Autenticación...</p>
        </div>
      </div>
    </div>
  `;
};

// ── EVENT DELEGATION REGISTRY ───────────────────────────────────────────────
let docListeners = [];
const onDoc = (type, selector, handler) => {
  const wrapper = (e) => {
    if (!selector) {
      handler.call(document, e);
    } else {
      const target = e.target.closest(selector);
      if (target) {
        handler.call(target, e);
      }
    }
  };
  document.addEventListener(type, wrapper);
  docListeners.push({ type, wrapper });
};

export const init = async () => {
  cleanup(); // Clear existing listeners to prevent duplicates

  document.body.classList.add('is-vault-locked');
  _iniciarTimer();

  const wiTema = document.getElementById('wiTema');
  if (wiTema) {
    wiTema.addEventListener('click', _bloquearTema, { capture: true });
    wiTema.style.opacity = '0.4';
    wiTema.style.cursor = 'not-allowed';
    wiTema.querySelectorAll('.tema').forEach(t => t.style.cursor = 'not-allowed');
  }

  // 2. Blindaje Programático "Top Mundial": Bloquear navegación, clic derecho, copiar, pegar y shortcuts de desarrollador

  // A. Interceptar clics en enlaces
  onDoc('click', 'a, [href], .nv_item', function(e) {
    if (document.body.classList.contains('is-vault-locked')) {
      if (this.id === 'btn_vault_back' || this.closest('#btn_vault_back')) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      Mensaje('<i class="fas fa-exclamation-triangle"></i> Identidad no verificada. Completa el 2FA primero.', 'warning');
    }
  });

  // B. Bloquear Clic Derecho (Context Menu)
  onDoc('contextmenu', null, function(e) {
    if (document.body.classList.contains('is-vault-locked')) {
      e.preventDefault();
      Mensaje('<i class="fas fa-eye-slash"></i> Clic derecho inhabilitado por seguridad.', 'warning');
    }
  });

  // C. Bloquear Copiar, Cortar y Pegar
  ['copy', 'cut', 'paste'].forEach(type => {
    onDoc(type, 'input, body', function(e) {
      if (document.body.classList.contains('is-vault-locked')) {
        e.preventDefault();
        Mensaje('<i class="fas fa-key"></i> Copiar y pegar inhabilitado en esta boveda.', 'warning');
      }
    });
  });

  // D. Bloquear F12, Ctrl+U (Código Fuente), Ctrl+Shift+I/J/C (DevTools), Ctrl+S (Guardar), Ctrl+P (Imprimir)
  onDoc('keydown', null, function(e) {
    if (!document.body.classList.contains('is-vault-locked')) return;

    // F12 (keyCode 123)
    if (e.keyCode === 123) {
      e.preventDefault();
      Mensaje('<i class="fas fa-shield-alt"></i> DevTools bloqueado por seguridad.', 'error');
      return false;
    }

    // Combinaciones con Ctrl o Cmd (Mac)
    if (e.ctrlKey || e.metaKey) {
      const key = String.fromCharCode(e.keyCode).toLowerCase();
      
      // Ctrl+U, Ctrl+S, Ctrl+P, o Ctrl+Shift+I/J/C
      if (key === 'u' || key === 's' || key === 'p' || (e.shiftKey && (key === 'i' || key === 'j' || key === 'c'))) {
        e.preventDefault();
        Mensaje('<i class="fas fa-shield-alt"></i> Combinación de teclas restringida en esta zona.', 'error');
        return false;
      }
    }
  });

  // 3. Esperar la inicialización asíncrona de Firebase Auth
  const user = await waitAuth();
  const wi = guard(user);
  if (!wi) return;

  try {
    const cfgDoc = await getDoc(doc(db, 'configwii', wi.usuario));
    const cfg    = cfgDoc.exists() ? cfgDoc.data() : null;

    if (cfg?.configurado && cfg?.secret) {
      // ── MODO UNLOCK ──
      _isSetup = false;
      _secret  = cfg.secret;
      const container = document.getElementById('vault_card_container');
      if (container) container.classList.remove('vault_card_setup');
      const content = document.getElementById('vault_content_area');
      if (content) content.innerHTML = HTML_INNER_UNLOCK;
      _initUnlock(wi);
    } else {
      // ── MODO SETUP ──
      _isSetup = true;
      const container = document.getElementById('vault_card_container');
      if (container) container.classList.add('vault_card_setup');
      const content = document.getElementById('vault_content_area');
      if (content) content.innerHTML = HTML_INNER_SETUP;
      await _initSetup(wi);
    }
  } catch(e) {
    console.error('[verificar] init:', e);
    Mensaje('Error al cargar la bóveda', 'error');
  }
};

// ── SETUP ─────────────────────────────────────────────────────────────────────
async function _initSetup(wi) {
  const QRCode = await import('qrcode');

  _secret = generateSecret();

  const issuer  =  app;
  const sm       = getls('wiSmile');
  const account  = encodeURIComponent(sm?.usuario || wi.usuario);
  const otpauth  = `otpauth://totp/${issuer}:${account}?secret=${_secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

  // Renderizar QR en canvas
  const qrCanvas = document.getElementById('vault_qr');
  if (qrCanvas) {
    await QRCode.toCanvas(qrCanvas, otpauth, {
      width: 200, margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    });
  }

  // Validar código en tiempo real
  onDoc('input', '#vault_code_setup', function() {
    this.value = this.value.replace(/[^0-9]/g, '');
    const btn = document.getElementById('btn_vault_confirmar');
    if (btn) btn.disabled = this.value.length !== 6;
  });

  onDoc('click', '#btn_vault_confirmar', async function() {
    const vaultCodeSetup = document.getElementById('vault_code_setup');
    const code = vaultCodeSetup ? vaultCodeSetup.value.trim() : '';
    if (code.length !== 6) return;

    const valido = await verifyTOTP(code, _secret);
    if (!valido) {
      Mensaje('<i class="fas fa-times-circle"></i> Código incorrecto, intenta de nuevo', 'error');
      if (vaultCodeSetup) {
        vaultCodeSetup.value = '';
        vaultCodeSetup.focus();
      }
      return;
    }

    const btn = this;
    const origHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    btn.disabled = true;

    try {
      await setDoc(doc(db, 'configwii', wi.usuario), {
        configurado: true,
        secret:      _secret,
        email:       wi.email || '',
        creado:      serverTimestamp(),
        actualizado: serverTimestamp(),
      });

      Mensaje('<i class="fas fa-lock"></i> ¡Bóveda configurada! Bienvenido al panel.', 'success');
      _desbloquear();
    } catch(e) {
      console.error('[verificar] setup save:', e);
      Mensaje('Error al guardar la configuración', 'error');
      btn.innerHTML = origHtml;
      btn.disabled = false;
    }
  });
}

// ── UNLOCK ────────────────────────────────────────────────────────────────────
function _initUnlock(wi) {
  setTimeout(() => {
    const vaultCode = document.getElementById('vault_code');
    if (vaultCode) vaultCode.focus();
  }, 100);

  onDoc('input', '#vault_code', function() {
    this.value = this.value.replace(/[^0-9]/g, '');
    if (this.value.length === 6) {
      const btnCode = document.getElementById('btn_code');
      if (btnCode) btnCode.click();
    }
  });

  onDoc('click', '#btn_code', async function() {
    const vaultCode = document.getElementById('vault_code');
    const code = vaultCode ? vaultCode.value.trim() : '';
    if (code.length !== 6) return Mensaje('Ingresa los 6 dígitos', 'warning');

    const btn = this;
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
    btn.disabled = true;

    try {
      const valido = await verifyTOTP(code, _secret);

      if (valido) {
        Mensaje('<i class="fas fa-unlock"></i> ¡Bóveda desbloqueada!', 'success');
        _desbloquear();
      } else {
        Mensaje('<i class="fas fa-times-circle"></i> Código incorrecto o expirado', 'error');
        if (vaultCode) {
          vaultCode.value = '';
          vaultCode.focus();
        }
        btn.innerHTML = orig;
        btn.disabled = false;
      }
    } catch(e) {
      console.error('[verificar] unlock:', e);
      btn.innerHTML = orig;
      btn.disabled = false;
    }
  });

  onDoc('click', '#btn_vault_back', () => {
    localStorage.removeItem('vault_expire');
    rutas.navigate('/');
  });
}

// ── DESBLOQUEAR ───────────────────────────────────────────────────────────────
function _desbloquear() {
  if (_intervaloTimer) { clearInterval(_intervaloTimer); _intervaloTimer = null; }
  localStorage.removeItem('vault_expire');
  document.body.classList.remove('is-vault-locked');
  sessionStorage.setItem('vault_unlocked', 'true');
  window.location.href = '/admin';
}

export const cleanup = () => {
  if (_intervaloTimer) { clearInterval(_intervaloTimer); _intervaloTimer = null; }
  document.body.classList.remove('is-vault-locked');
  docListeners.forEach(({ type, wrapper }) => {
    document.removeEventListener(type, wrapper);
  });
  docListeners = [];

  const wiTema = document.getElementById('wiTema');
  if (wiTema) {
    wiTema.removeEventListener('click', _bloquearTema, { capture: true });
    wiTema.style.opacity = '';
    wiTema.style.cursor = '';
    wiTema.querySelectorAll('.tema').forEach(t => t.style.cursor = '');
  }
};

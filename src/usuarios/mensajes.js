import './mensajes.css';
import { auth, db } from '../firebase.js';
import { collection, setDoc, doc, query, where, getDocs, deleteDoc, serverTimestamp, limit } from 'firebase/firestore';
import { Notificacion, wicopy, wiTip, getls } from '../widev.js';
import { rutas } from '../rutas.js';
import { app } from '../wii.js';

// ── Estado ───────────────────────────────────────────────────
let msgs = [], pendiente = null, enviando = false, refreshTimer = null, _onVis = null;
const CACHE = 'wi_mensajes_cache';
const LIMIT = 50;
const wi = () => getls('wiSmile') || {};
const _save = d => { try { localStorage.setItem(CACHE, JSON.stringify(d)); } catch (_) {} };
const _cache = () => { try { return JSON.parse(localStorage.getItem(CACHE) || '[]'); } catch (_) { return []; } };
const _scroll = () => { const el = document.getElementById('wmChat'); el && requestAnimationFrame(() => el.scrollTop = el.scrollHeight); };

// ── Render ───────────────────────────────────────────────────
export const render = () => {
  const u = wi();
  if (!u.email) { location.replace('/'); return ''; }
  const display = u.nombre || u.usuario || u.email || auth.currentUser?.email || '';

  return `
  <div class="wm_container">
    <div class="wm_header">
      <div class="wm_info">
        <img src="/smile.avif" alt="${app}" class="wm_avatar" />
        <div class="wm_text">
          <h1>Mis Mensajes</h1>
          <p>Hola, <strong>${display}</strong></p>
        </div>
      </div>
      <div class="wm_status">
        <span class="wm_dot"></span>
        <span class="wm_dotxt">Conectando...</span>
      </div>
    </div>

    <div class="wm_chat" id="wmChat">${_htmlList(_cache())}</div>

    <div class="wm_input">
      <div class="wm_wrap">
        <textarea id="wmNuevo" placeholder="Escribe un mensaje." rows="1" maxlength="500"></textarea>
        <span class="wm_count" id="wmCount">0/500</span>
      </div>
      <button id="wmEnviar" disabled ${wiTip('Enviar · Enter')}><i class="fas fa-paper-plane"></i></button>
    </div>

    <div class="wm_modal" id="wmEliminar">
      <div class="wm_modal_body">
        <i class="fas fa-trash-alt"></i>
        <h3>¿Eliminar mensaje?</h3>
        <p>Esta acción no se puede deshacer</p>
        <div class="wm_modal_acts">
          <button class="wm_cancel" id="wmCancel">Cancelar</button>
          <button class="wm_confirm" id="wmConfirm">Eliminar</button>
        </div>
      </div>
    </div>
  </div>`;
};

// ── Event Registry ───────────────────────────────────────────
let docListeners = [];
const onDoc = (type, selector, handler) => {
  const wrapper = (e) => {
    const target = e.target.closest(selector);
    if (target) {
      handler.call(target, e);
    }
  };
  document.addEventListener(type, wrapper);
  docListeners.push({ type, wrapper });
};

// ── Init ─────────────────────────────────────────────────────
export const init = () => {
  cleanup();

  const u = wi();
  if (!u.email) return rutas.navigate('/');
  const userEmail = u.email || auth.currentUser?.email;
  const userUid = u.uid;

  onDoc('input', '#wmNuevo', function () {
    const countEl = document.getElementById('wmCount');
    if (countEl) countEl.textContent = `${this.value.length}/500`;
    const enviarEl = document.getElementById('wmEnviar');
    if (enviarEl) enviarEl.disabled = !this.value.trim();
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 150) + 'px';
  });

  onDoc('keydown', '#wmNuevo', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      _enviar(userEmail, userUid);
    }
  });

  onDoc('click', '#wmEnviar', () => _enviar(userEmail, userUid));

  onDoc('click', '.wm_item', function (e) {
    if (e.target.closest('.wm_del')) return;
    const id = this.getAttribute('data-id');
    const msg = msgs.find(m => m.id === id);
    if (!msg) return;
    wicopy(msg.mensaje, this, '¡Copiado! <i class="fas fa-check-circle"></i>');
    this.classList.add('copied');
    setTimeout(() => this.classList.remove('copied'), 800);
  });

  onDoc('click', '.wm_del', function (e) {
    e.stopPropagation();
    pendiente = this.getAttribute('data-id');
    const modal = document.getElementById('wmEliminar');
    if (modal) modal.classList.add('show');
  });

  onDoc('click', '#wmCancel, #wmEliminar', e => {
    if (e.target.id === 'wmCancel' || e.target.id === 'wmEliminar') {
      const modal = document.getElementById('wmEliminar');
      if (modal) modal.classList.remove('show');
      pendiente = null;
    }
  });

  onDoc('click', '#wmConfirm', _eliminar);

  // Mostrar cache inmediato, luego sync en background
  _cargar(userUid, true);

  // Auto-refresh cada 30s solo si tab visible
  refreshTimer = setInterval(() => !document.hidden && _cargar(userUid, true), 30000);
  _onVis = () => { !document.hidden && _cargar(userUid, true); };
  document.addEventListener('visibilitychange', _onVis);
  _scroll();
};

// ── Cargar (getDocs = 1 read batch, no listener permanente) ──
const _cargar = async (uid, silent = false) => {
  try {
    const q = query(collection(db, 'wiMensajes'), where('userId', '==', uid), limit(LIMIT));
    const snap = await getDocs(q);
    msgs = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.fecha?.seconds || 0) - (b.fecha?.seconds || 0));
    _save(msgs);
    const chatEl = document.getElementById('wmChat');
    if (chatEl) chatEl.innerHTML = _htmlList(msgs);
    _status(true);
    _scroll();
  } catch (e) {
    console.error('❌', e);
    _status(false);
    if (!silent) {
      const cache = _cache();
      const chatEl = document.getElementById('wmChat');
      if (cache.length) {
        msgs = cache;
        if (chatEl) chatEl.innerHTML = _htmlList(msgs);
        Notificacion('Caché local 📦', 'warning', 2000);
      } else {
        if (chatEl) chatEl.innerHTML = _empty('fa-wifi-slash', 'Sin conexión', 'Verifica tu internet');
      }
    }
  }
};

// ── Enviar (optimistic UI: aparece al instante, Firestore en background) ──
const _enviar = (email, uid) => {
  if (enviando) return;
  const ta = document.getElementById('wmNuevo');
  if (!ta) return;
  const nota = ta.value.trim();
  if (!nota) return;
  enviando = true;
  const { usuario = '', nombre = '' } = wi();
  const id = `m${Date.now()}`;

  // UI instantánea
  const fake = { id, mensaje: nota, email, usuario: nombre || usuario || email, userId: uid, fecha: { seconds: Date.now() / 1000 } };
  msgs.push(fake);
  _save(msgs);
  const chatEl = document.getElementById('wmChat');
  if (chatEl) chatEl.innerHTML = _htmlList(msgs);
  _scroll();
  ta.value = '';
  ta.style.height = 'auto';
  ta.focus();
  const countEl = document.getElementById('wmCount');
  if (countEl) countEl.textContent = '0/500';
  const enviarEl = document.getElementById('wmEnviar');
  if (enviarEl) enviarEl.disabled = true;

  // Background write
  setDoc(doc(db, 'wiMensajes', id), { id, mensaje: nota, email, usuario: nombre || usuario || email, userId: uid, fecha: serverTimestamp() })
    .then(() => { _status(true); })
    .catch(e => {
      console.error('❌', e);
      msgs = msgs.filter(m => m.id !== id);
      _save(msgs);
      const chatEl2 = document.getElementById('wmChat');
      if (chatEl2) chatEl2.innerHTML = _htmlList(msgs);
      Notificacion('Error al guardar', 'error');
    })
    .finally(() => { enviando = false; });
};

// ── Eliminar (optimistic: desaparece al instante) ──
const _eliminar = () => {
  if (!pendiente) return;
  const id = pendiente;
  pendiente = null;
  const modal = document.getElementById('wmEliminar');
  if (modal) modal.classList.remove('show');

  // UI instantánea
  const backup = [...msgs];
  msgs = msgs.filter(m => m.id !== id);
  _save(msgs);
  const item = document.querySelector(`.wm_item[data-id="${id}"]`);
  if (item) item.classList.add('deleting');
  setTimeout(() => {
    const chatEl = document.getElementById('wmChat');
    if (chatEl) chatEl.innerHTML = _htmlList(msgs);
  }, 250);

  // Background delete
  deleteDoc(doc(db, 'wiMensajes', id))
    .then(() => Notificacion('Eliminado 🗑️', 'success', 1200))
    .catch(e => {
      console.error('❌', e);
      msgs = backup;
      _save(msgs);
      const chatEl = document.getElementById('wmChat');
      if (chatEl) chatEl.innerHTML = _htmlList(msgs);
      Notificacion('Error al eliminar', 'error');
    });
};

// ── Helpers ──────────────────────────────────────────────────
const _status = ok => {
  const dot = document.querySelector('.wm_dot');
  if (dot) {
    dot.classList.remove('active', 'error');
    dot.classList.add(ok ? 'active' : 'error');
  }
  const dotxt = document.querySelector('.wm_dotxt');
  if (dotxt) {
    dotxt.textContent = ok ? 'Online' : 'Offline';
  }
};

const _dateLabel = ts => {
  if (!ts) return 'Hoy';
  const d = ts.toDate?.() || new Date((ts.seconds || 0) * 1000);
  const hoy = new Date(), ayer = new Date(hoy);
  hoy.setHours(0, 0, 0, 0); ayer.setDate(ayer.getDate() - 1); ayer.setHours(0, 0, 0, 0);
  return d >= hoy ? 'Hoy' : d >= ayer ? 'Ayer' : d.toLocaleDateString('es', { day: 'numeric', month: 'long' });
};

const _hora = ts => {
  if (!ts) return 'Ahora';
  const d = ts.toDate?.() || new Date((ts.seconds || 0) * 1000);
  return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
};

const _htmlList = list => {
  if (!list?.length) return _empty('fa-comment-dots', 'Sin mensajes aún', 'Escribe tu primer mensaje 👇');
  let lastLabel = '';
  return list.map(m => {
    const label = _dateLabel(m.fecha);
    const sep = label !== lastLabel ? `<div class="wm_sep"><span>${label}</span></div>` : '';
    lastLabel = label;
    return `${sep}<div class="wm_item" data-id="${m.id}" ${wiTip('Click para copiar')}>
      <div class="wm_bubble">
        <p class="wm_txt">${_esc(m.mensaje).replace(/\n/g, '<br>')}</p>
        <div class="wm_foot"><span class="wm_time">${_hora(m.fecha)}</span><i class="fas fa-check-double wm_check"></i></div>
      </div>
      <button class="wm_del" data-id="${m.id}" ${wiTip('Eliminar')}><i class="fas fa-trash"></i></button>
    </div>`;
  }).join('');
};

const _empty = (ico, txt, sub) => `<div class="wm_empty"><i class="fas ${ico}"></i><p>${txt}</p><span>${sub}</span></div>`;
const _esc = t => String(t || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[c]));

export const cleanup = () => {
  clearInterval(refreshTimer);
  refreshTimer = null;
  if (_onVis) {
    document.removeEventListener('visibilitychange', _onVis);
    _onVis = null;
  }
  docListeners.forEach(({ type, wrapper }) => {
    document.removeEventListener(type, wrapper);
  });
  docListeners = [];
  msgs = [];
  pendiente = null;
  enviando = false;
};
import './notas.css';
import { auth, db } from '../firebase.js';
import { collection, setDoc, doc, query, where, getDocs, deleteDoc, serverTimestamp, limit } from 'firebase/firestore';
import { Notificacion, wiTip, getls, Saludar } from '../widev.js';
import { rutas } from '../rutas.js';
import { app } from '../wii.js';

// ── Estado ───────────────────────────────────────────────────
let notas = [], editando = null, saveTimer = null, _onVis = null;
const CACHE_KEY = 'wi_notas_cache';
const CACHE_TIME_KEY = 'wi_notas_cache_time';
const LIMIT = 100;
const DEBOUNCE = 1200;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const wi = () => getls('wiSmile') || {};

// ── Cache Smart ──────────────────────────────────────────────
const _saveCache = d => { 
  try { 
    localStorage.setItem(CACHE_KEY, JSON.stringify(d)); 
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
  } catch (_) {} 
};
const _getCache = () => { 
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]'); } catch (_) { return []; } 
};
const _isCacheValid = () => {
  const time = parseInt(localStorage.getItem(CACHE_TIME_KEY) || '0');
  return Date.now() - time < CACHE_DURATION;
};
const _clearCache = () => {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_TIME_KEY);
};

// ── Colores del tema (Premium) ───────────────────────────────
const COLORES = [
  { id: 'Cielo',  hex: '#0EBEFF', bg: 'rgba(14,190,255,.12)', tx: 'var(--tx)', rgb: '14,190,255' },
  { id: 'Dulce',  hex: '#FF5C93', bg: 'rgba(255,92,147,.12)', tx: 'var(--tx)', rgb: '255,92,147' },
  { id: 'Paz',    hex: '#10B981', bg: 'rgba(16,185,129,.12)', tx: 'var(--tx)', rgb: '16,185,129' },
  { id: 'Mora',   hex: '#8B5CF6', bg: 'rgba(139,92,246,.12)', tx: 'var(--tx)', rgb: '139,92,246' },
  { id: 'Sol',    hex: '#F59E0B', bg: 'rgba(245,158,11,.12)', tx: 'var(--tx)', rgb: '245,158,11' },
];

// ── Render ───────────────────────────────────────────────────
export const render = () => {
  const u = wi();
  if (!u.email) { location.replace('/'); return ''; }
  const display = u.nombre || u.usuario || u.email || auth.currentUser?.email || '';

  return `
  <div class="wn_container">
    <div class="wn_header">
      <div class="wn_info">
        <img src="/smile.avif" alt="${app}" class="wn_avatar" />
        <div class="wn_text">
          <h1><i class="fas fa-sticky-note"></i> Mis Notas</h1>
          <p>${Saludar()} <strong>${display}</strong></p>
        </div>
      </div>
      <div class="wn_actions">
        <button class="wn_btn_new" id="wnNueva" ${wiTip('Nueva nota')}>
          <i class="fas fa-plus"></i> <span>Nueva</span>
        </button>
        <div class="wn_status_wrap">
          <div class="wn_status">
            <span class="wn_dot"></span>
            <span class="wn_dotxt">Cargando...</span>
          </div>
          <button class="wn_btn_sync" id="wnSync" ${wiTip('Sincronizar')}>
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="wn_grid" id="wnGrid">${_htmlGrid(_getCache())}</div>

    <div class="wn_modal" id="wnEliminar">
      <div class="wn_modal_body">
        <i class="fas fa-trash-alt"></i>
        <h3>¿Eliminar nota?</h3>
        <p>Esta acción no se puede deshacer</p>
        <div class="wn_modal_acts">
          <button class="wn_cancel" id="wnCancel">Cancelar</button>
          <button class="wn_confirm" id="wnConfirm">Eliminar</button>
        </div>
      </div>
    </div>
  </div>`;
};

// ── Event Registry ───────────────────────────────────────────
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

// ── Init ─────────────────────────────────────────────────────
export const init = () => {
  cleanup();

  const u = wi();
  if (!u.email) return rutas.navigate('/');
  const userEmail = u.email || auth.currentUser?.email;

  onDoc('click', '#wnNueva', () => _crearNota(userEmail));
  onDoc('click', '#wnSync', () => _syncNotas(userEmail));

  onDoc('click', '.wn_card', function(e) {
    if (e.target.closest('.wn_toolbar, .wn_colors')) return;
    const id = this.getAttribute('data-id');
    _toggleEditar(id);
  });

  onDoc('input', '.wn_titulo, .wn_contenido', function() {
    const card = this.closest('.wn_card');
    if (card) {
      _debounceGuardar(card.getAttribute('data-id'), userEmail);
    }
  });

  onDoc('click', '.wn_pin', function(e) {
    e.stopPropagation();
    const card = this.closest('.wn_card');
    if (card) {
      _togglePin(card.getAttribute('data-id'), userEmail);
    }
  });

  onDoc('click', '.wn_color', function(e) {
    e.stopPropagation();
    const card = this.closest('.wn_card');
    if (card) {
      const colorsEl = card.querySelector('.wn_colors');
      if (colorsEl) colorsEl.classList.toggle('show');
    }
  });

  onDoc('click', '.wn_color_opt', function(e) {
    e.stopPropagation();
    const card = this.closest('.wn_card');
    if (card) {
      _cambiarColor(card.getAttribute('data-id'), this.getAttribute('data-color'), userEmail);
      const colorsEl = card.querySelector('.wn_colors');
      if (colorsEl) colorsEl.classList.remove('show');
    }
  });

  onDoc('click', '.wn_del', function(e) {
    e.stopPropagation();
    const card = this.closest('.wn_card');
    if (card) {
      editando = card.getAttribute('data-id');
    }
    const modal = document.getElementById('wnEliminar');
    if (modal) modal.classList.add('show');
  });

  onDoc('click', '#wnCancel, #wnEliminar', e => {
    if (e.target.id === 'wnCancel' || e.target.id === 'wnEliminar') {
      const modal = document.getElementById('wnEliminar');
      if (modal) modal.classList.remove('show');
      editando = null;
    }
  });

  onDoc('click', '#wnConfirm', () => _eliminar(userEmail));

  onDoc('click', null, e => {
    if (!e.target.closest('.wn_colors, .wn_color')) {
      document.querySelectorAll('.wn_colors').forEach(el => el.classList.remove('show'));
    }
  });

  // Smart load: usar cache si es válido, sino cargar de Firestore
  _smartLoad(userEmail);

  // Solo recargar cuando tab se vuelve visible y cache expiró
  _onVis = () => { 
    if (!document.hidden && !_isCacheValid()) _cargarDesdeFirestore(userEmail, true); 
  };
  document.addEventListener('visibilitychange', _onVis);
};

// ── Smart Load ───────────────────────────────────────────────
const _smartLoad = (email) => {
  const cache = _getCache();
  if (cache.length && _isCacheValid()) {
    notas = cache;
    _sortNotas();
    const grid = document.getElementById('wnGrid');
    if (grid) grid.innerHTML = _htmlGrid(notas);
    _status(true, 'Cache');
  } else {
    _cargarDesdeFirestore(email, false);
  }
};

// ── Sync Manual ──────────────────────────────────────────────
const _syncNotas = async (email) => {
  const syncBtn = document.getElementById('wnSync');
  if (syncBtn) syncBtn.classList.add('spinning');
  _clearCache();
  await _cargarDesdeFirestore(email, false);
  if (syncBtn) syncBtn.classList.remove('spinning');
  Notificacion('Sincronizado ✓', 'success', 1500);
};

// ── Cargar desde Firestore ───────────────────────────────────
const _cargarDesdeFirestore = async (email, silent = false) => {
  try {
    _status(false, 'Cargando...');
    const q = query(collection(db, 'wiNotas'), where('email', '==', email), limit(LIMIT));
    const snap = await getDocs(q);
    notas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    _sortNotas();
    _saveCache(notas);
    const grid = document.getElementById('wnGrid');
    if (grid) grid.innerHTML = _htmlGrid(notas);
    _status(true);
  } catch (e) {
    console.error('❌ Notas:', e);
    _status(false, 'Offline');
    if (!silent) {
      const cache = _getCache();
      const grid = document.getElementById('wnGrid');
      if (cache.length) {
        notas = cache;
        if (grid) grid.innerHTML = _htmlGrid(notas);
        Notificacion('Usando caché local 📦', 'warning', 2000);
      } else {
        if (grid) grid.innerHTML = _empty('fa-wifi-slash', 'Sin conexión', 'Verifica tu internet');
      }
    }
  }
};

// ── Ordenar notas ────────────────────────────────────────────
const _sortNotas = () => {
  notas.sort((a, b) => {
    if (a.pin !== b.pin) return b.pin ? 1 : -1;
    return (b.fecha?.seconds || 0) - (a.fecha?.seconds || 0);
  });
};

// ── Crear nota ───────────────────────────────────────────────
const _crearNota = async (email) => {
  const id = `nota_${Date.now()}`;
  const { usuario = '', nombre = '' } = wi();

  const nueva = {
    id, titulo: '', contenido: '', color: 'Cielo', pin: false,
    email, usuario: nombre || usuario || email,
    fecha: { seconds: Date.now() / 1000 }
  };

  notas.unshift(nueva);
  _saveCache(notas);
  const grid = document.getElementById('wnGrid');
  if (grid) grid.innerHTML = _htmlGrid(notas);

  setTimeout(() => {
    const card = document.querySelector(`.wn_card[data-id="${id}"]`);
    if (card) {
      card.classList.add('editing');
      const titleEl = card.querySelector('.wn_titulo');
      if (titleEl) titleEl.focus();
    }
  }, 50);

  try {
    await setDoc(doc(db, 'wiNotas', id), { ...nueva, fecha: serverTimestamp() });
    _status(true);
    Notificacion('Nueva nota ✨', 'success', 1200);
  } catch (e) {
    console.error('❌', e);
    notas = notas.filter(n => n.id !== id);
    _saveCache(notas);
    const grid2 = document.getElementById('wnGrid');
    if (grid2) grid2.innerHTML = _htmlGrid(notas);
    Notificacion('Error al crear', 'error');
  }
};

// ── Toggle editar ────────────────────────────────────────────
const _toggleEditar = (id) => {
  const card = document.querySelector(`.wn_card[data-id="${id}"]`);
  if (!card) return;
  document.querySelectorAll('.wn_card.editing').forEach(c => {
    if (c !== card) c.classList.remove('editing');
  });
  card.classList.toggle('editing');
  if (card.classList.contains('editing')) {
    const titleEl = card.querySelector('.wn_titulo');
    if (titleEl) titleEl.focus();
  }
};

// ── Debounce guardar ─────────────────────────────────────────
const _debounceGuardar = (id, email) => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => _guardarNota(id, email), DEBOUNCE);
};

// ── Guardar nota ─────────────────────────────────────────────
const _guardarNota = async (id, email) => {
  const card = document.querySelector(`.wn_card[data-id="${id}"]`);
  if (!card) return;
  const titleEl = card.querySelector('.wn_titulo');
  const contentEl = card.querySelector('.wn_contenido');
  const titulo = titleEl ? titleEl.textContent.trim() : '';
  const contenido = contentEl ? contentEl.textContent.trim() : '';

  const nota = notas.find(n => n.id === id);
  if (!nota) return;

  // Solo guardar si cambió
  if (nota.titulo === titulo && nota.contenido === contenido) return;

  nota.titulo = titulo;
  nota.contenido = contenido;
  _saveCache(notas);
  card.classList.add('saving');

  try {
    await setDoc(doc(db, 'wiNotas', id), {
      id, titulo, contenido, color: nota.color, pin: nota.pin,
      email, usuario: nota.usuario, fecha: serverTimestamp()
    });
    _status(true);
    card.classList.remove('saving');
    card.classList.add('saved');
    setTimeout(() => card.classList.remove('saved'), 800);
  } catch (e) {
    console.error('❌', e);
    card.classList.remove('saving');
    Notificacion('Error al guardar', 'error');
  }
};

// ── Toggle pin ───────────────────────────────────────────────
const _togglePin = async (id, email) => {
  const nota = notas.find(n => n.id === id);
  if (!nota) return;

  nota.pin = !nota.pin;
  _sortNotas();
  _saveCache(notas);
  const grid = document.getElementById('wnGrid');
  if (grid) grid.innerHTML = _htmlGrid(notas);

  try {
    await setDoc(doc(db, 'wiNotas', id), { ...nota, fecha: serverTimestamp() });
    _status(true);
    Notificacion(nota.pin ? 'Fijada 📌' : 'Desanclada', 'success', 1000);
  } catch (e) {
    console.error('❌', e);
    nota.pin = !nota.pin;
    _sortNotas();
    _saveCache(notas);
    const grid2 = document.getElementById('wnGrid');
    if (grid2) grid2.innerHTML = _htmlGrid(notas);
  }
};

// ── Cambiar color ────────────────────────────────────────────
const _cambiarColor = async (id, colorId, email) => {
  const nota = notas.find(n => n.id === id);
  if (!nota || nota.color === colorId) return;

  const old = nota.color;
  nota.color = colorId;
  _saveCache(notas);
  const grid = document.getElementById('wnGrid');
  if (grid) grid.innerHTML = _htmlGrid(notas);

  try {
    await setDoc(doc(db, 'wiNotas', id), { ...nota, fecha: serverTimestamp() });
    _status(true);
  } catch (e) {
    console.error('❌', e);
    nota.color = old;
    _saveCache(notas);
    const grid2 = document.getElementById('wnGrid');
    if (grid2) grid2.innerHTML = _htmlGrid(notas);
  }
};

// ── Eliminar ─────────────────────────────────────────────────
const _eliminar = async () => {
  if (!editando) return;
  const id = editando;
  editando = null;
  const modal = document.getElementById('wnEliminar');
  if (modal) modal.classList.remove('show');

  const backup = [...notas];
  notas = notas.filter(n => n.id !== id);
  _saveCache(notas);

  const card = document.querySelector(`.wn_card[data-id="${id}"]`);
  if (card) card.classList.add('deleting');
  const grid = document.getElementById('wnGrid');
  setTimeout(() => {
    if (grid) grid.innerHTML = _htmlGrid(notas);
  }, 250);

  try {
    await deleteDoc(doc(db, 'wiNotas', id));
    Notificacion('Eliminada 🗑️', 'success', 1000);
  } catch (e) {
    console.error('❌', e);
    notas = backup;
    _saveCache(notas);
    const grid2 = document.getElementById('wnGrid');
    if (grid2) grid2.innerHTML = _htmlGrid(notas);
    Notificacion('Error al eliminar', 'error');
  }
};

// ── Helpers ──────────────────────────────────────────────────
const _status = (ok, txt) => {
  const dot = document.querySelector('.wn_dot');
  if (dot) {
    dot.classList.remove('active', 'error');
    dot.classList.add(ok ? 'active' : 'error');
  }
  const dotxt = document.querySelector('.wn_dotxt');
  if (dotxt) {
    dotxt.textContent = txt || (ok ? 'Online' : 'Offline');
  }
};

const _getColor = id => COLORES.find(c => c.id === id) || COLORES[0];

const _fecha = ts => {
  if (!ts) return 'Ahora';
  const d = ts.toDate?.() || new Date((ts.seconds || 0) * 1000);
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1);
  if (d >= hoy) return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  if (d >= ayer) return 'Ayer';
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
};

const _htmlGrid = list => {
  if (!list?.length) return _empty('fa-sticky-note', 'Sin notas aún', 'Crea tu primera nota 👆');
  return list.map(n => {
    const c = _getColor(n.color);
    return `
    <div class="wn_card${n.pin ? ' pinned' : ''}" data-id="${n.id}" style="--c-bg:${c.bg};--c-tx:${c.tx};--c-accent:${c.hex}">
      <div class="wn_card_inner">
        ${n.pin ? '<span class="wn_pin_badge"><i class="fas fa-thumbtack"></i></span>' : ''}
        <div class="wn_titulo" contenteditable="true" data-placeholder="Título" spellcheck="false">${_esc(n.titulo)}</div>
        <div class="wn_contenido" contenteditable="true" data-placeholder="Escribe aquí..." spellcheck="false">${_esc(n.contenido).replace(/\n/g,'<br>')}</div>
        <div class="wn_footer">
          <span class="wn_fecha">${_fecha(n.fecha)}</span>
          <span class="wn_saved"><i class="fas fa-check"></i></span>
        </div>
        <div class="wn_toolbar">
          <button class="wn_pin${n.pin?' active':''}" ${wiTip('Fijar')}><i class="fas fa-thumbtack"></i></button>
          <button class="wn_color" ${wiTip('Color')}><i class="fas fa-palette"></i></button>
          <button class="wn_del" ${wiTip('Eliminar')}><i class="fas fa-trash"></i></button>
        </div>
        <div class="wn_colors">${COLORES.map(x=>`<span class="wn_color_opt${x.id===n.color?' active':''}" data-color="${x.id}" style="--cc:${x.hex}"></span>`).join('')}</div>
      </div>
    </div>`;
  }).join('');
};

const _empty = (ico, txt, sub) => `<div class="wn_empty"><i class="fas ${ico}"></i><p>${txt}</p><span>${sub}</span></div>`;
const _esc = t => String(t||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

export const cleanup = () => {
  clearTimeout(saveTimer);
  if (_onVis) { document.removeEventListener('visibilitychange', _onVis); _onVis = null; }
  docListeners.forEach(({ type, wrapper }) => {
    document.removeEventListener(type, wrapper);
  });
  docListeners = [];
  notas = [];
  editando = null;
  saveTimer = null;
};

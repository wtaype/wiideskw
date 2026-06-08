// ════════════════════════════════════════════════════════════════════
// usuarios.js — CumpleWii · Admin · Gestión de Usuarios
// Jesús es mi Señor 🙏
// ════════════════════════════════════════════════════════════════════
import './usuarios.css';
import { db } from '../firebase.js';
import {
  collection, getDocs, doc, updateDoc, deleteDoc, serverTimestamp
} from 'firebase/firestore';
import { getls, savels, removels, Notificacion, Capi, Capit } from '../widev.js';

// ─── Guard ────────────────────────────────────────────────────────────────────
const wi      = () => getls('wiSmile');
const isAdmin = () => wi()?.rol === 'admin';

// ─── State ────────────────────────────────────────────────────────────────────
let _usuarios    = [];
let _filtroTab   = 'todos';   // 'todos' | 'activos' | 'pendientes' | 'suspendidos' | 'inactivos'
let _filtroSearch = '';
let _selectedId  = null;
let _saving      = false;

const CACHE_KEY = 'aduUsuarios';
const CACHE_TTL = 30; // minutos

// ─── Helpers visuales ────────────────────────────────────────────────────────
const _initials = u =>
  ((u.nombre || '') + ' ' + (u.apellidos || '') || u.usuario || '?')
    .trim().split(/\s+/).slice(0, 2)
    .map(w => (w[0] || '').toUpperCase()).join('');

const _avatar = (u, size = 42) => {
  // Campo real: u.avatar (definido en login.js y perfil.js)
  if (u.avatar) {
    return `<div class="adu_avatar" style="width:${size}px;height:${size}px"><img src="${u.avatar}" alt="${Capi(u.nombre || u.usuario || '?')}" loading="lazy"/></div>`;
  }
  const ini = _initials(u);
  const rol = (u.rol || 'usuario').toLowerCase();
  return `<div class="adu_avatar adu_avatar_ini" data-rol="${rol}" style="width:${size}px;height:${size}px;font-size:${Math.round(size*0.36)}px">${ini}</div>`;
};

const _rolBadge = rol => {
  const safe = (rol || 'usuario').toLowerCase();
  return `<span class="adu_rol_badge adu_rol_${safe}">${Capi(safe)}</span>`;
};

const _planBadge = plan => {
  const safe = (plan || 'free').toLowerCase();
  return `<span class="adu_plan_badge adu_plan_${safe}">${safe.toUpperCase()}</span>`;
};

const _estadoBadge = estado => {
  const safe = (estado || 'activo').toLowerCase();
  return `<span class="adu_status adu_status_${safe}">${Capi(safe)}</span>`;
};

const _toggleActivoHtml = (id, activo) => {
  const checked = activo ? 'checked' : '';
  return `<label class="adu_toggle" title="${activo ? 'Activo' : 'Inactivo'}">
    <input type="checkbox" class="adu_toggle_activo" data-id="${id}" ${checked}/>
    <span class="adu_toggle_slider" style="--c:#22c55e"></span>
  </label>`;
};

// ─── Filter logic ─────────────────────────────────────────────────────────────
const _applyFilters = () => {
  const term = _filtroSearch.toLowerCase().trim();
  return _usuarios.filter(u => {
    if (_filtroTab === 'activos'     && !u.activo) return false;
    if (_filtroTab === 'pendientes'  && (u.estado || 'activo') !== 'pendiente') return false;
    if (_filtroTab === 'suspendidos' && (u.estado || 'activo') !== 'suspendido') return false;
    if (_filtroTab === 'inactivos'   && u.activo !== false && (u.estado || 'activo') !== 'inactivo') return false;
    if (term) {
      const hay = [u.nombre, u.apellidos, u.usuario, u.email, u.id].join(' ').toLowerCase();
      if (!hay.includes(term)) return false;
    }
    return true;
  });
};

// ─── Stats ────────────────────────────────────────────────────────────────────
const _updateStats = () => {
  const total      = _usuarios.length;
  const activos    = _usuarios.filter(u => u.activo === true).length;
  const pendientes = _usuarios.filter(u => (u.estado || '') === 'pendiente').length;
  const inactivos  = _usuarios.filter(u => u.activo === false || (u.estado || '') === 'inactivo').length;
  
  const elTotal = document.getElementById('adu_stat_total');
  if (elTotal) elTotal.textContent = total;
  const elActivos = document.getElementById('adu_stat_activos');
  if (elActivos) elActivos.textContent = activos;
  const elPendientes = document.getElementById('adu_stat_pendientes');
  if (elPendientes) elPendientes.textContent = pendientes;
  const elInactivos = document.getElementById('adu_stat_inactivos');
  if (elInactivos) elInactivos.textContent = inactivos;
};

// ─── render (HTML estático de la página) ─────────────────────────────────────
export const render = () => {
  if (!isAdmin()) return `<div class="adu_wrap"><div class="adu_empty"><i class="fas fa-ban"></i><p>Acceso denegado.</p></div></div>`;

  return /* html */`
  <div class="adu_wrap" id="adu_wrap">

    <!-- ══ HEADER CARD ══ -->
    <div class="adu_header_card" id="adu_header_card">
      <div class="adu_header_card_stripe"></div>
      <div class="adu_header_inner">
        <div class="adu_header_text">
          <h1 class="adu_title">
            <i class="fas fa-users-cog"></i>
            Gestión de Usuarios
          </h1>
          <p class="adu_subtitle">Administra cuentas, roles, planes y estado de cada usuario de la plataforma</p>
        </div>
        <div class="adu_header_actions">
          <button class="adu_refresh_btn" id="adu_refresh" title="Actualizar lista">
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- ══ STATS BAR ══ -->
    <div class="adu_stats_bar" id="adu_stats">
      <div class="adu_stat_chip adu_stat_total">
        <span class="adu_stat_num" id="adu_stat_total">—</span>
        <span class="adu_stat_label">Total</span>
      </div>
      <div class="adu_stat_chip adu_stat_activos">
        <span class="adu_stat_num" id="adu_stat_activos">—</span>
        <span class="adu_stat_label">Activos</span>
      </div>
      <div class="adu_stat_chip adu_stat_pendientes">
        <span class="adu_stat_num" id="adu_stat_pendientes">—</span>
        <span class="adu_stat_label">Pendientes</span>
      </div>
      <div class="adu_stat_chip adu_stat_inactivos">
        <span class="adu_stat_num" id="adu_stat_inactivos">—</span>
        <span class="adu_stat_label">Inactivos</span>
      </div>
    </div>

    <!-- ══ SEARCH BAR ══ -->
    <div class="adu_search_bar">
      <i class="fas fa-search adu_search_icon"></i>
      <input
        type="text"
        id="adu_search"
        class="adu_search_input"
        placeholder="Buscar por nombre, usuario o email…"
        autocomplete="off"
      />
    </div>

    <!-- ══ FILTER TABS ══ -->
    <div class="adu_tabs" id="adu_tabs">
      <button class="adu_tab active" data-tab="todos">
        <i class="fas fa-list"></i> Todos
      </button>
      <button class="adu_tab" data-tab="activos">
        <i class="fas fa-circle-check"></i> Activos
      </button>
      <button class="adu_tab" data-tab="pendientes">
        <i class="fas fa-clock"></i> Pendientes
      </button>
      <button class="adu_tab" data-tab="suspendidos">
        <i class="fas fa-ban"></i> Suspendidos
      </button>
      <button class="adu_tab" data-tab="inactivos">
        <i class="fas fa-circle-xmark"></i> Inactivos
      </button>
    </div>

    <!-- ══ TABLE ══ -->
    <div class="adu_table_outer">
      <table class="adu_table" id="adu_table">
        <thead>
          <tr>
            <th>Avatar</th>
            <th>Nombre</th>
            <th>Usuario</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Plan</th>
            <th>Activo</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="adu_tbody">
          <tr><td colspan="9" class="adu_loading_cell">
            <div class="adu_spinner"><i class="fas fa-circle-notch fa-spin"></i> Cargando usuarios…</div>
          </td></tr>
        </tbody>
      </table>
    </div>

  </div>

  <!-- ══ OVERLAY ══ -->
  <div class="adu_overlay" id="adu_overlay"></div>

  <!-- ══ SIDE PANEL ══ -->
  <aside class="adu_panel" id="adu_panel" aria-hidden="true">
    <div class="adu_panel_header">
      <div class="adu_panel_avatar_wrap" id="adu_panel_avatar"></div>
      <div class="adu_panel_title_wrap">
        <h2 class="adu_panel_name" id="adu_panel_name">Usuario</h2>
        <span class="adu_panel_user" id="adu_panel_user">@usuario</span>
      </div>
      <button class="adu_panel_close" id="adu_panel_close" aria-label="Cerrar panel">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div class="adu_panel_body">
      <form id="adu_edit_form" autocomplete="off">
        <input type="hidden" id="edit_uid"/>

        <!-- Datos Personales -->
        <div class="adu_form_section">
          <div class="adu_form_section_title"><i class="fas fa-id-card"></i> Datos Personales</div>
          <div class="adu_form_row">
            <label class="adu_form_label" for="edit_nombre">Nombre</label>
            <input class="adu_form_input" id="edit_nombre" type="text" placeholder="Nombre"/>
          </div>
          <div class="adu_form_row">
            <label class="adu_form_label" for="edit_apellidos">Apellidos</label>
            <input class="adu_form_input" id="edit_apellidos" type="text" placeholder="Apellidos"/>
          </div>
          <div class="adu_form_row">
            <label class="adu_form_label" for="edit_usuario">Usuario (ID)</label>
            <input class="adu_form_input adu_input_locked" id="edit_usuario" type="text" disabled/>
          </div>
          <div class="adu_form_row">
            <label class="adu_form_label" for="edit_email">Email</label>
            <input class="adu_form_input adu_input_locked" id="edit_email" type="email" disabled/>
          </div>
          <div class="adu_form_row">
            <label class="adu_form_label" for="edit_bio">Bio</label>
            <textarea class="adu_form_input adu_form_textarea" id="edit_bio" placeholder="Descripción breve del usuario…" rows="2"></textarea>
          </div>
          <div class="adu_form_row">
            <label class="adu_form_label" for="edit_avatar">Avatar (URL)</label>
            <input class="adu_form_input" id="edit_avatar" type="url" placeholder="https://tu-foto.com/imagen.jpg"/>
          </div>
        </div>

        <!-- Datos de Cuenta -->
        <div class="adu_form_section">
          <div class="adu_form_section_title"><i class="fas fa-shield-halved"></i> Cuenta y Acceso</div>
          <div class="adu_form_row">
            <label class="adu_form_label" for="edit_rol">Rol de acceso</label>
            <select class="adu_form_select" id="edit_rol">
              <option value="usuario">Usuario</option>
              <option value="smile">Smile</option>
              <option value="gestor">Gestor</option>
              <option value="empresa">Empresa</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="adu_form_row">
            <label class="adu_form_label" for="edit_plan">Plan de acceso</label>
            <select class="adu_form_select" id="edit_plan">
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="vip">Vip</option>
            </select>
          </div>
          <div class="adu_form_row">
            <label class="adu_form_label" for="edit_estado">Estado</label>
            <select class="adu_form_select" id="edit_estado">
              <option value="activo">Activo</option>
              <option value="pendiente">Pendiente</option>
              <option value="suspendido">Suspendido</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
          <div class="adu_form_row adu_form_row_inline">
            <label class="adu_form_label">Cuenta activa</label>
            <label class="adu_toggle" id="edit_activo_toggle">
              <input type="checkbox" id="edit_activo"/>
              <span class="adu_toggle_slider" style="--c:#22c55e"></span>
            </label>
          </div>
        </div>

        <div class="adu_panel_footer">
          <button type="submit" class="adu_btn_save" id="adu_btn_save">
            <i class="fas fa-save"></i>
            <span>Guardar cambios</span>
          </button>
        </div>
      </form>
    </div>
  </aside>
`;
};

// ─── _renderTable ─────────────────────────────────────────────────────────────
const _renderTable = () => {
  _updateStats();
  const lista = _applyFilters();

  lista.sort((a, b) => {
    const ap = a.activo ? 0 : 1;
    const bp = b.activo ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return (a.nombre || a.usuario || '').localeCompare(b.nombre || b.usuario || '', 'es');
  });

  const tbody = document.getElementById('adu_tbody');
  if (!tbody) return;

  if (!lista.length) {
    const term = _filtroSearch.trim();
    tbody.innerHTML = `
      <tr><td colspan="9">
        <div class="adu_empty">
          <i class="fas fa-user-slash"></i>
          <p>${term ? `Sin resultados para "<strong>${term}</strong>"` : 'No hay usuarios en esta categoría'}</p>
        </div>
      </td></tr>`;
    return;
  }

  const rows = lista.map(u => {
    const isPendiente = (u.estado || '') === 'pendiente';
    const fullName    = Capit((u.nombre || '') + ' ' + (u.apellidos || '')).trim() || '—';
    return /* html */`
      <tr data-id="${u.id}" class="${!u.activo ? 'adu_row_inactive' : ''}">
        <td>${_avatar(u, 40)}</td>
        <td class="adu_nombre">${fullName}</td>
        <td class="adu_usuario">@${u.usuario || u.id || '—'}</td>
        <td class="adu_email">${u.email || '—'}</td>
        <td>${_rolBadge(u.rol)}</td>
        <td>${_planBadge(u.plan)}</td>
        <td>${_toggleActivoHtml(u.id, u.activo)}</td>
        <td>${_estadoBadge(u.estado)}</td>
        <td class="adu_actions_cell">
          <button class="adu_btn_editar" data-id="${u.id}" title="Editar usuario">
            <i class="fas fa-pen-to-square"></i> Editar
          </button>
          ${isPendiente ? `
            <button class="adu_btn_approve" data-id="${u.id}" title="Aprobar cuenta">
              <i class="fas fa-check"></i>
            </button>
            <button class="adu_btn_reject" data-id="${u.id}" title="Rechazar solicitud">
              <i class="fas fa-times"></i>
            </button>` : ''}
          <button class="adu_btn_delete" data-id="${u.id}" title="Eliminar usuario">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>`;
  }).join('');

  tbody.innerHTML = rows;
};

// ─── Panel helpers ────────────────────────────────────────────────────────────
const _openPanel = id => {
  const u = _usuarios.find(u => u.id === id);
  if (!u) return;
  _selectedId = id;

  const nombre = Capit((u.nombre || '') + ' ' + (u.apellidos || '')).trim() || u.usuario || '—';
  
  const pAvatar = document.getElementById('adu_panel_avatar');
  if (pAvatar) pAvatar.innerHTML = _avatar(u, 52);
  const pName = document.getElementById('adu_panel_name');
  if (pName) pName.textContent = nombre;
  const pUser = document.getElementById('adu_panel_user');
  if (pUser) pUser.textContent = '@' + (u.usuario || u.id || '—');

  const editUid = document.getElementById('edit_uid');
  if (editUid) editUid.value = id;
  const editNombre = document.getElementById('edit_nombre');
  if (editNombre) editNombre.value = u.nombre || '';
  const editApellidos = document.getElementById('edit_apellidos');
  if (editApellidos) editApellidos.value = u.apellidos || '';
  const editUsuario = document.getElementById('edit_usuario');
  if (editUsuario) editUsuario.value = u.usuario || u.id || '';
  const editEmail = document.getElementById('edit_email');
  if (editEmail) editEmail.value = u.email || '';
  const editBio = document.getElementById('edit_bio');
  if (editBio) editBio.value = u.bio || '';
  const editAvatar = document.getElementById('edit_avatar');
  if (editAvatar) editAvatar.value = u.avatar || '';
  const editRol = document.getElementById('edit_rol');
  if (editRol) editRol.value = u.rol || 'usuario';
  const editPlan = document.getElementById('edit_plan');
  if (editPlan) editPlan.value = u.plan || 'free';
  const editEstado = document.getElementById('edit_estado');
  if (editEstado) editEstado.value = u.estado || 'activo';
  const editActivo = document.getElementById('edit_activo');
  if (editActivo) editActivo.checked = u.activo !== false;

  const panel = document.getElementById('adu_panel');
  if (panel) {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
  }
  const overlay = document.getElementById('adu_overlay');
  if (overlay) overlay.classList.add('visible');
  document.body.classList.add('adu_no_scroll');
};

const _closePanel = () => {
  _selectedId = null;
  const panel = document.getElementById('adu_panel');
  if (panel) {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  }
  const overlay = document.getElementById('adu_overlay');
  if (overlay) overlay.classList.remove('visible');
  document.body.classList.remove('adu_no_scroll');
};

// ─── Toggle activo inline ────────────────────────────────────────────────────
const _toggleActivo = async id => {
  const idx = _usuarios.findIndex(u => u.id === id);
  if (idx === -1) return;
  const newVal = !_usuarios[idx].activo;
  const nombre = Capi(_usuarios[idx].nombre || _usuarios[idx].usuario || id);
  try {
    await updateDoc(doc(db, 'smiles', id), { activo: newVal });
    _usuarios[idx].activo = newVal;
    removels(CACHE_KEY);
    savels(CACHE_KEY, _usuarios, CACHE_TTL);
    _renderTable();
    Notificacion(`${nombre} ${newVal ? 'activado ✅' : 'desactivado ❌'}`, newVal ? 'success' : 'warning');
  } catch (err) {
    console.error('[adu] toggleActivo:', err);
    Notificacion('Error al cambiar estado', 'error');
    _renderTable();
  }
};

// ─── Aprobar / Rechazar ───────────────────────────────────────────────────────
const _aprobar = async id => {
  const idx = _usuarios.findIndex(u => u.id === id);
  if (idx === -1) return;
  const nombre = Capi(_usuarios[idx].nombre || _usuarios[idx].usuario || id);
  try {
    await updateDoc(doc(db, 'smiles', id), { estado: 'activo', activo: true });
    _usuarios[idx].estado = 'activo';
    _usuarios[idx].activo = true;
    removels(CACHE_KEY);
    savels(CACHE_KEY, _usuarios, CACHE_TTL);
    _renderTable();
    Notificacion(`${nombre} aprobado ✅`, 'success');
  } catch (err) {
    Notificacion('Error al aprobar', 'error');
  }
};

// ─── Rechazar ───────────────────────────────────────────────────────
const _rechazar = async id => {
  const idx = _usuarios.findIndex(u => u.id === id);
  if (idx === -1) return;
  const nombre = Capi(_usuarios[idx].nombre || _usuarios[idx].usuario || id);
  try {
    await updateDoc(doc(db, 'smiles', id), { estado: 'inactivo', activo: false });
    _usuarios[idx].estado = 'inactivo';
    _usuarios[idx].activo = false;
    removels(CACHE_KEY);
    savels(CACHE_KEY, _usuarios, CACHE_TTL);
    _renderTable();
    Notificacion(`Solicitud de ${nombre} rechazada`, 'warning');
  } catch (err) {
    Notificacion('Error al rechazar', 'error');
  }
};

// ─── Eliminar ─────────────────────────────────────────────────────────────────
const _eliminar = async id => {
  const u = _usuarios.find(u => u.id === id);
  const nombre = Capi(u?.nombre || u?.usuario || id);
  if (!confirm(`¿Eliminar al usuario "${nombre}"? Esta acción es permanente.`)) return;
  try {
    await deleteDoc(doc(db, 'smiles', id));
    _usuarios = _usuarios.filter(u => u.id !== id);
    removels(CACHE_KEY);
    savels(CACHE_KEY, _usuarios, CACHE_TTL);
    _renderTable();
    Notificacion(`${nombre} eliminado`, 'info');
  } catch (err) {
    Notificacion('Error al eliminar', 'error');
  }
};

// ─── Save edit ────────────────────────────────═══════════════════════════════
const _saveEdit = async () => {
  if (_saving || !_selectedId) return;
  _saving = true;

  const btnSave = document.getElementById('adu_btn_save');
  if (btnSave) {
    btnSave.classList.add('loading');
    btnSave.disabled = true;
  }
  const headerCard = document.getElementById('adu_header_card');
  if (headerCard) headerCard.classList.add('adu_loading');

  const editNombre = document.getElementById('edit_nombre');
  const editApellidos = document.getElementById('edit_apellidos');
  const editBio = document.getElementById('edit_bio');
  const editAvatar = document.getElementById('edit_avatar');
  const editRol = document.getElementById('edit_rol');
  const editPlan = document.getElementById('edit_plan');
  const editEstado = document.getElementById('edit_estado');
  const editActivo = document.getElementById('edit_activo');

  const data = {
    nombre:    editNombre ? editNombre.value.trim() : '',
    apellidos: editApellidos ? editApellidos.value.trim() : '',
    bio:       editBio ? editBio.value.trim() : '',
    avatar:    editAvatar ? editAvatar.value.trim() : '',
    rol:       editRol ? editRol.value : 'usuario',
    plan:      editPlan ? editPlan.value : 'free',
    estado:    editEstado ? editEstado.value : 'activo',
    activo:    editActivo ? editActivo.checked : false,
    actualizado: serverTimestamp(),
  };

  // Quitar campos vacíos (salvo booleanos)
  Object.keys(data).forEach(k => {
    if (data[k] === '' && k !== 'activo') delete data[k];
  });

  try {
    await updateDoc(doc(db, 'smiles', _selectedId), data);
    const idx = _usuarios.findIndex(u => u.id === _selectedId);
    if (idx !== -1) Object.assign(_usuarios[idx], data);
    removels(CACHE_KEY);
    savels(CACHE_KEY, _usuarios, CACHE_TTL);
    _renderTable();
    _closePanel();
    Notificacion('Usuario actualizado ✅', 'success');
  } catch (err) {
    console.error('[adu] saveEdit:', err);
    Notificacion('Error al guardar cambios', 'error');
  } finally {
    _saving = false;
    if (btnSave) {
      btnSave.classList.remove('loading');
      btnSave.disabled = false;
    }
    if (headerCard) headerCard.classList.remove('adu_loading');
  }
};

// ─── Carga de datos ──────────────────────────────────────────────────────────
const _loadUsuarios = async (forceReload = false) => {
  if (!forceReload) {
    const cached = getls(CACHE_KEY);
    if (cached) {
      _usuarios = cached;
      _renderTable();
      return;
    }
  }

  const tbody = document.getElementById('adu_tbody');
  if (tbody) {
    tbody.innerHTML = `
      <tr><td colspan="9" class="adu_loading_cell">
        <div class="adu_spinner"><i class="fas fa-circle-notch fa-spin"></i> Cargando usuarios…</div>
      </td></tr>`;
  }

  try {
    const snap = await getDocs(collection(db, 'smiles'));
    _usuarios = snap.docs.map(d => ({ id: d.id, usuario: d.id, ...d.data() }));
    _usuarios.sort((a, b) => (a.nombre || a.usuario || '').localeCompare(b.nombre || b.usuario || '', 'es'));
    savels(CACHE_KEY, _usuarios, CACHE_TTL);
    _renderTable();
  } catch (err) {
    console.error('[adu] loadUsuarios:', err);
    if (tbody) {
      tbody.innerHTML = `
        <tr><td colspan="9">
          <div class="adu_empty adu_empty_error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Error al cargar usuarios. Intenta de nuevo.</p>
          </div>
        </td></tr>`;
    }
    Notificacion('Error al cargar usuarios', 'error');
  }
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

// ─── INIT ─────────────────────────────────────────────────────────────────────
export const init = async () => {
  if (!isAdmin()) return;

  _filtroTab    = 'todos';
  _filtroSearch = '';
  _selectedId   = null;

  // Mostrar inmediatamente
  const aduWrap = document.getElementById('adu_wrap');
  if (aduWrap) aduWrap.classList.add('visible');

  // Cargar datos (usa cache si existe)
  _loadUsuarios(false);

  // ── Búsqueda
  onDoc('input', '#adu_search', function () {
    _filtroSearch = this.value;
    _renderTable();
  });

  // ── Tabs
  onDoc('click', '.adu_tab', function () {
    _filtroTab = this.getAttribute('data-tab');
    document.querySelectorAll('.adu_tab').forEach(el => el.classList.remove('active'));
    this.classList.add('active');
    _renderTable();
  });

  // ── Refresh
  onDoc('click', '#adu_refresh', async function () {
    const btn = this;
    btn.classList.add('adu_spinning');
    _filtroSearch = '';
    _filtroTab    = 'todos';
    const aduSearch = document.getElementById('adu_search');
    if (aduSearch) aduSearch.value = '';
    document.querySelectorAll('.adu_tab').forEach(el => el.classList.remove('active'));
    const allTab = document.querySelector('.adu_tab[data-tab="todos"]');
    if (allTab) allTab.classList.add('active');
    await _loadUsuarios(true);
    btn.classList.remove('adu_spinning');
    Notificacion('Lista actualizada', 'success');
  });

  // ── Toggle activo inline
  onDoc('change', '.adu_toggle_activo', function () {
    _toggleActivo(this.getAttribute('data-id'));
  });

  // ── Abrir panel edición
  onDoc('click', '.adu_btn_editar', function (e) {
    e.stopPropagation();
    _openPanel(this.getAttribute('data-id'));
  });

  // ── Cerrar panel — botón X
  onDoc('click', '#adu_panel_close', _closePanel);

  // ── Cerrar panel — overlay
  onDoc('click', '#adu_overlay', _closePanel);

  // ── Cerrar panel — Escape
  onDoc('keydown', null, function (e) {
    if (e.key === 'Escape') _closePanel();
  });

  // ── Submit form
  onDoc('submit', '#adu_edit_form', function (e) {
    e.preventDefault();
    _saveEdit();
  });

  // ── Aprobar
  onDoc('click', '.adu_btn_approve', function (e) {
    e.stopPropagation();
    _aprobar(this.getAttribute('data-id'));
  });

  // ── Rechazar
  onDoc('click', '.adu_btn_reject', function (e) {
    e.stopPropagation();
    _rechazar(this.getAttribute('data-id'));
  });

  // ── Eliminar
  onDoc('click', '.adu_btn_delete', function (e) {
    e.stopPropagation();
    _eliminar(this.getAttribute('data-id'));
  });
};

// ─── CLEANUP ──────────────────────────────────────────────────────────────────
export const cleanup = () => {
  docListeners.forEach(({ type, wrapper }) => {
    document.removeEventListener(type, wrapper);
  });
  docListeners = [];
  document.body.classList.remove('adu_no_scroll');
  _usuarios     = [];
  _filtroTab    = 'todos';
  _filtroSearch = '';
  _selectedId   = null;
  _saving       = false;
};

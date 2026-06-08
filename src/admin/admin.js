// ════════════════════════════════════════════════════════════════════
// admin.js — Wiidesk · Centro de Control Admin
// ════════════════════════════════════════════════════════════════════
import './admin.css';
import { db } from '../firebase.js';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { savels, getls, Saludar, Notificacion } from '../widev.js';
import { app, version, lanzamiento, by } from '../wii.js';

const wi = () => getls('wiSmile');

// ── CACHE KEYS ────────────────────────────────────────────────────────────────
const K_USERS   = 'am_users';      // smiles total
const K_ACTIVOS = 'am_activos';    // smiles activo=true
const K_DEVICES = 'am_devices';    // devices total
const K_BLOG    = 'am_blog';       // blog total
const K_CHAT    = 'am_chat';       // chatGrupal total
const K_P_FREE  = 'am_plan_free';  // plan free
const K_P_PRO   = 'am_plan_pro';   // plan pro
const K_P_VIP   = 'am_plan_vip';   // plan vip
const K_R_USR   = 'am_rol_usuario';
const K_R_EDI   = 'am_rol_editor';
const K_R_GES   = 'am_rol_gestor';
const K_R_ADM   = 'am_rol_admin';

// Helper functions for DOM manipulation
const setElText = (id, text) => {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
};

const setElStyleProp = (id, prop, val) => {
  const el = document.getElementById(id);
  if (el) el.style.setProperty(prop, val);
};

// ── RENDER ────────────────────────────────────────────────────────────────────
export const render = () => {
  const u = wi();
  if (!u || u.rol !== 'admin') return `<div class="am_page"><div class="am_empty"><i class="fas fa-ban"></i> Acceso denegado.</div></div>`;

  const hora = Saludar();
  const nombre = u.nombre || u.usuario || 'Admin';

  return `
  <div class="am_page">

    <!-- ══ HERO ══ -->
    <div class="am_hero">
      <div class="am_hero_left">
        <div class="am_hero_icon"><i class="fas fa-user-shield"></i></div>
        <div class="am_hero_txt">
          <div class="am_badge"><i class="fas fa-shield-halved"></i> Admin Master</div>
          <h1 class="am_hero_title">Centro de Control</h1>
          <p class="am_hero_sub">${hora}, <strong>${nombre}</strong> · ${app} ${version} · Desde ${lanzamiento}</p>
        </div>
      </div>
      <div class="am_hero_right">
        <div class="am_hero_meta">
          <span class="am_hero_tag"><i class="fas fa-code-branch"></i> ${version}</span>
          <span class="am_hero_tag"><i class="fas fa-user-pen"></i> ${by}</span>
        </div>
        <button class="am_btn_sync" id="am_btn_refresh">
          <i class="fas fa-sync-alt"></i> Sincronizar
        </button>
      </div>
    </div>

    <!-- ══ KPIs ══ -->
    <div class="am_grid_6" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">

      <div class="am_kpi" style="--c:#38bdf8">
        <div class="am_kpi_head">
          <div class="am_ki_ico"><i class="fas fa-users"></i></div>
          <span class="am_ki_label">Usuarios</span>
        </div>
        <div class="am_ki_val" id="am_n_users">—</div>
        <div class="am_ki_trend"><i class="fas fa-user-plus"></i> Registros totales</div>
      </div>

      <div class="am_kpi" style="--c:#22c55e">
        <div class="am_kpi_head">
          <div class="am_ki_ico"><i class="fas fa-circle-check"></i></div>
          <span class="am_ki_label">Activos</span>
        </div>
        <div class="am_ki_val" id="am_n_activos">—</div>
        <div class="am_ki_trend"><i class="fas fa-toggle-on"></i> Cuentas habilitadas</div>
      </div>

      <div class="am_kpi" style="--c:#f59e0b">
        <div class="am_kpi_head">
          <div class="am_ki_ico"><i class="fas fa-laptop"></i></div>
          <span class="am_ki_label">Equipos (Hosts)</span>
        </div>
        <div class="am_ki_val" id="am_n_devices">—</div>
        <div class="am_ki_trend"><i class="fas fa-network-wired"></i> PCs vinculadas</div>
      </div>

      <div class="am_kpi" style="--c:#8b5cf6">
        <div class="am_kpi_head">
          <div class="am_ki_ico"><i class="fas fa-newspaper"></i></div>
          <span class="am_ki_label">Blog</span>
        </div>
        <div class="am_ki_val" id="am_n_blog">—</div>
        <div class="am_ki_trend"><i class="fas fa-pen-nib"></i> Novedades publicadas</div>
      </div>

      <div class="am_kpi" style="--c:#06b6d4">
        <div class="am_kpi_head">
          <div class="am_ki_ico"><i class="fas fa-comments"></i></div>
          <span class="am_ki_label">Chat</span>
        </div>
        <div class="am_ki_val" id="am_n_chat">—</div>
        <div class="am_ki_trend"><i class="fas fa-message"></i> Canal de Soporte</div>
      </div>

    </div>

    <!-- ══ ESTADO DE LA PLATAFORMA ══ -->
    <div class="am_sec_header">
      <i class="fas fa-database"></i>
      <h2 class="am_sec_h2">Estado de la Plataforma</h2>
    </div>

    <div class="am_status_grid">

      <div class="am_status_card">
        <div class="am_status_head">
          <i class="fas fa-layer-group"></i>
          <span>Colecciones Firestore</span>
        </div>
        <ul class="am_col_list">
          <li><span class="am_col_dot" style="background:#38bdf8"></span><code>smiles</code><em>Usuarios</em></li>
          <li><span class="am_col_dot" style="background:#22c55e"></span><code>registros</code><em>Auth index</em></li>
          <li><span class="am_col_dot" style="background:#f59e0b"></span><code>devices</code><em>Equipos vinculados</em></li>
          <li><span class="am_col_dot" style="background:#8b5cf6"></span><code>blog</code><em>Artículos y Novedades</em></li>
          <li><span class="am_col_dot" style="background:#06b6d4"></span><code>chatGrupal</code><em>Chat equipo</em></li>
          <li><span class="am_col_dot" style="background:#64748b"></span><code>wiNotas</code><em>Notas de usuario</em></li>
        </ul>
      </div>

      <div class="am_status_card">
        <div class="am_status_head">
          <i class="fas fa-crown"></i>
          <span>Distribución de Licencias</span>
        </div>
        <div class="am_plan_bar">
          <div class="am_plan_row">
            <span class="am_plan_lbl">Free</span>
            <div class="am_plan_track">
              <div class="am_plan_fill" id="am_bar_free" style="--w:0%;background:#64748b"></div>
            </div>
            <span class="am_plan_num" id="am_cnt_free">—</span>
          </div>
          <div class="am_plan_row">
            <span class="am_plan_lbl">Pro</span>
            <div class="am_plan_track">
              <div class="am_plan_fill" id="am_bar_pro" style="--w:0%;background:#38bdf8"></div>
            </div>
            <span class="am_plan_num" id="am_cnt_pro">—</span>
          </div>
          <div class="am_plan_row">
            <span class="am_plan_lbl">VIP</span>
            <div class="am_plan_track">
              <div class="am_plan_fill" id="am_bar_vip" style="--w:0%;background:linear-gradient(90deg,#f59e0b,#8b5cf6)"></div>
            </div>
            <span class="am_plan_num" id="am_cnt_vip">—</span>
          </div>
        </div>
        <div class="am_status_head" style="margin-top:2vh">
          <i class="fas fa-user-tag"></i>
          <span>Distribución de Roles</span>
        </div>
        <div class="am_plan_bar">
          <div class="am_plan_row">
            <span class="am_plan_lbl">Usuario</span>
            <div class="am_plan_track"><div class="am_plan_fill" id="am_bar_rol_usuario" style="--w:0%;background:#3b82f6"></div></div>
            <span class="am_plan_num" id="am_cnt_rol_usuario">—</span>
          </div>
          <div class="am_plan_row">
            <span class="am_plan_lbl">Editor</span>
            <div class="am_plan_track"><div class="am_plan_fill" id="am_bar_rol_editor" style="--w:0%;background:#10b981"></div></div>
            <span class="am_plan_num" id="am_cnt_rol_editor">—</span>
          </div>
          <div class="am_plan_row">
            <span class="am_plan_lbl">Gestor</span>
            <div class="am_plan_track"><div class="am_plan_fill" id="am_bar_rol_gestor" style="--w:0%;background:#f97316"></div></div>
            <span class="am_plan_num" id="am_cnt_rol_gestor">—</span>
          </div>
          <div class="am_plan_row">
            <span class="am_plan_lbl">Admin</span>
            <div class="am_plan_track"><div class="am_plan_fill" id="am_bar_rol_admin" style="--w:0%;background:#8b5cf6"></div></div>
            <span class="am_plan_num" id="am_cnt_rol_admin">—</span>
          </div>
        </div>
      </div>

      <div class="am_status_card">
        <div class="am_status_head">
          <i class="fas fa-info-circle"></i>
          <span>Info del Proyecto</span>
        </div>
        <ul class="am_info_list">
          <li><i class="fas fa-laptop"></i><span>App</span><strong>${app}</strong></li>
          <li><i class="fas fa-code-branch"></i><span>Versión</span><strong>${version}</strong></li>
          <li><i class="fas fa-calendar-check"></i><span>Lanzamiento</span><strong>${lanzamiento}</strong></li>
          <li><i class="fas fa-user-pen"></i><span>Developer</span><strong>${by}</strong></li>
          <li><i class="fas fa-fire"></i><span>Backend</span><strong>Firebase / Firestore</strong></li>
          <li><i class="fas fa-bolt"></i><span>Build</span><strong>Vite</strong></li>
          <li><i class="fas fa-palette"></i><span>UI</span><strong>Vanilla CSS + WiDev</strong></li>
        </ul>
      </div>

    </div>

    <!-- ══ ACCESO RÁPIDO ══ -->
    <div class="am_sec_header">
      <i class="fas fa-bolt"></i>
      <h2 class="am_sec_h2">Acceso Rápido</h2>
    </div>

    <div class="am_quick_grid" style="grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));">
      <a href="/smile" class="am_quick_card nv_item" data-page="smile">
        <i class="fas fa-gauge-high"></i><span>Dashboard</span>
      </a>
      <a href="/usuarios" class="am_quick_card nv_item" data-page="usuarios">
        <i class="fas fa-users"></i><span>Usuarios</span>
      </a>
      <a href="/blog" class="am_quick_card nv_item" data-page="blog">
        <i class="fas fa-newspaper"></i><span>Blog</span>
      </a>
      <a href="/notas" class="am_quick_card nv_item" data-page="notas">
        <i class="fas fa-book-open"></i><span>Notas</span>
      </a>
      <a href="/chat" class="am_quick_card nv_item" data-page="chat">
        <i class="fas fa-comments"></i><span>Chat</span>
      </a>
      <a href="/perfil" class="am_quick_card nv_item" data-page="perfil">
        <i class="fas fa-user-gear"></i><span>Perfil</span>
      </a>
    </div>

  </div>`;
};

// ── EVENT DELEGATION REGISTRY ───────────────────────────────────────────────
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

// ── INIT ──────────────────────────────────────────────────────────────────────
export const init = async () => {
  const u = wi();
  if (!u || u.rol !== 'admin') return;

  _cargarLocal();
  _cargarStats(); // Silencioso — usa cache si existe

  onDoc('click', '#am_btn_refresh', function () {
    const icon = this.querySelector('i');
    if (icon) icon.classList.add('fa-spin');
    _cargarStats(true).finally(() => {
      setTimeout(() => {
        if (icon) icon.classList.remove('fa-spin');
      }, 600);
    });
  });
};

export const cleanup = () => {
  docListeners.forEach(({ type, wrapper }) => {
    document.removeEventListener(type, wrapper);
  });
  docListeners = [];
};

// ── CARGA LOCAL (cache) ───────────────────────────────────────────────────────
function _cargarLocal() {
  setElText('am_n_users', getls(K_USERS)   ?? '—');
  setElText('am_n_activos', getls(K_ACTIVOS) ?? '—');
  setElText('am_n_devices', getls(K_DEVICES) ?? '—');
  setElText('am_n_blog', getls(K_BLOG)    ?? '—');
  setElText('am_n_chat', getls(K_CHAT)    ?? '—');

  // Barras de plan/rol (requieren total para calcular %)
  const tot = getls(K_USERS) || 0;
  _setBar('free',        K_P_FREE, tot);
  _setBar('pro',         K_P_PRO,  tot);
  _setBar('vip',         K_P_VIP,  tot);
  _setBar('rol_usuario', K_R_USR,  tot);
  _setBar('rol_editor',  K_R_EDI,  tot);
  _setBar('rol_gestor',  K_R_GES,  tot);
  _setBar('rol_admin',   K_R_ADM,  tot);
}

// Actualiza barra de progreso + contador
function _setBar(id, cacheKey, total) {
  const v = getls(cacheKey);
  if (v === null) return;
  const pct = total > 0 ? Math.round((v / total) * 100) : 0;
  setElText(`am_cnt_${id}`, v);
  setElStyleProp(`am_bar_${id}`, '--w', `${pct}%`);
}

// ── CARGA DESDE FIRESTORE ────────────────────────────────────────────────────
async function _cargarStats(forzar = false) {
  try {
    const colSmiles  = collection(db, 'smiles');
    const colDevices = collection(db, 'devices');
    const colBlog    = collection(db, 'blog');
    const colChat    = collection(db, 'chatGrupal');
    const TTL = 1; // horas

    const run = (cond, fn) => cond ? [fn()] : [];

    // ── KPIs principales ─────────────────────────────────────────────────────
    const kpis = [
      ...run(forzar || getls(K_USERS) === null,
        () => getCountFromServer(colSmiles).then(s => {
          const v = s.data().count; savels(K_USERS, v, TTL); setElText('am_n_users', v);
        })),
      ...run(forzar || getls(K_ACTIVOS) === null,
        () => getCountFromServer(query(colSmiles, where('activo', '==', true))).then(s => {
          const v = s.data().count; savels(K_ACTIVOS, v, TTL); setElText('am_n_activos', v);
        })),
      ...run(forzar || getls(K_DEVICES) === null,
        () => getCountFromServer(colDevices).then(s => {
          const v = s.data().count; savels(K_DEVICES, v, TTL); setElText('am_n_devices', v);
        })),
      ...run(forzar || getls(K_BLOG) === null,
        () => getCountFromServer(colBlog).then(s => {
          const v = s.data().count; savels(K_BLOG, v, TTL); setElText('am_n_blog', v);
        })),
      ...run(forzar || getls(K_CHAT) === null,
        () => getCountFromServer(colChat).then(s => {
          const v = s.data().count; savels(K_CHAT, v, TTL); setElText('am_n_chat', v);
        })),
    ];

    // ── Distribución de planes ────────────────────────────────────────────────
    const planes = [
      { key: K_P_FREE, id: 'free',  val: 'free'  },
      { key: K_P_PRO,  id: 'pro',   val: 'pro'   },
      { key: K_P_VIP,  id: 'vip',   val: 'vip'   },
    ];
    const roles = [
      { key: K_R_USR, id: 'rol_usuario', val: 'usuario' },
      { key: K_R_EDI, id: 'rol_editor',  val: 'editor'  },
      { key: K_R_GES, id: 'rol_gestor',  val: 'gestor'  },
      { key: K_R_ADM, id: 'rol_admin',   val: 'admin'   },
    ];

    const distPlanes = planes
      .filter(p => forzar || getls(p.key) === null)
      .map(p => getCountFromServer(query(colSmiles, where('plan', '==', p.val))).then(s => {
        const v = s.data().count;
        savels(p.key, v, TTL);
        const tot = getls(K_USERS) || 1;
        const pct = Math.round((v / tot) * 100);
        setElText(`am_cnt_${p.id}`, v);
        setElStyleProp(`am_bar_${p.id}`, '--w', `${pct}%`);
      }));

    const distRoles = roles
      .filter(r => forzar || getls(r.key) === null)
      .map(r => getCountFromServer(query(colSmiles, where('rol', '==', r.val))).then(s => {
        const v = s.data().count;
        savels(r.key, v, TTL);
        const tot = getls(K_USERS) || 1;
        const pct = Math.round((v / tot) * 100);
        setElText(`am_cnt_${r.id}`, v);
        setElStyleProp(`am_bar_${r.id}`, '--w', `${pct}%`);
      }));

    await Promise.allSettled([...kpis, ...distPlanes, ...distRoles]);

    // Refresh barras con total ya cargado
    const tot = getls(K_USERS) || 1;
    [...planes, ...roles].forEach(item => {
      const v = getls(item.key);
      if (v !== null) {
        const pct = Math.round((v / tot) * 100);
        setElText(`am_cnt_${item.id}`, v);
        setElStyleProp(`am_bar_${item.id}`, '--w', `${pct}%`);
      }
    });

    if (forzar) Notificacion('Estadísticas sincronizadas ✅', 'success');

  } catch (err) {
    console.error('[Admin] Error stats:', err);
    if (forzar) Notificacion('Error al sincronizar', 'error');
  }
}

import './acerca.css';
import './terminos.css';
import { app, version } from '../../wii.js';
import { year } from '../../widev.js';

// ── DATOS ─────────────────────────────────────────────────────────────────
const SECCIONES = [
  {
    ico: 'fa-users', color: '#0EBEFF', num: '01',
    tit: 'Uso de la app',
    body: `<p>CumpleWii es una app para guardar cumpleaños, organizar fechas, recibir recordatorios, escuchar música de celebración y consultar ideas útiles. Debe usarse con información real, respeto y sin spam.</p>`
  },
  {
    ico: 'fa-shield-halved', color: '#29C72E', num: '02',
    tit: 'Cuenta y sincronización',
    body: `<p>Puedes iniciar sesión con Google o email. Sincronizamos tu perfil, cumpleaños, favoritos y ajustes con Firebase para que la app sea rápida y consistente.</p>`
  },
  {
    ico: 'fa-globe', color: '#FF5C69', num: '03',
    tit: 'Planes free, pro y vip',
    body: `<p>El plan free está disponible como base. Pro y vip quedan preparados para más capacidad, temas premium y funciones avanzadas. Los límites pueden actualizarse con aviso razonable.</p>`
  },
  {
    ico: 'fa-gavel', color: '#7000FF', num: '04',
    tit: 'Derechos y propiedad intelectual',
    body: `<p>CumpleWii es un proyecto desarrollado por Wilder Taype. El diseño, código y funcionalidades pertenecen al proyecto; tus datos personales y contenido guardado siguen siendo tuyos.</p>`
  },
  {
    ico: 'fa-triangle-exclamation', color: '#FFDA34', num: '05',
    tit: 'Limitación de responsabilidad',
    body: `<p>CumpleWii ayuda a recordar fechas, pero debes revisar que la información ingresada sea correcta. Los recordatorios pueden depender de permisos, batería, conexión y configuración del dispositivo.</p>`
  },
  {
    ico: 'fa-arrows-rotate', color: '#0EBEFF', num: '06',
    tit: 'Cambios en los términos',
    body: `<p>Podemos actualizar funciones, texto legal y detalles del servicio con el tiempo. El uso continuado de CumpleWii después de esos cambios implica aceptación de la versión vigente.</p>`
  },
];

// ── RENDER ─────────────────────────────────────────────────────────────────
export const render = () => `
<main id="wimain">
<div class="ac_wrap tm_wrap">

  <!-- ══ HERO ══ -->
  <section class="ac_hero tm_hero">
    <div class="ac_hero_orb ac_orb1"></div>
    <div class="ac_hero_orb ac_orb2"></div>
    <div class="ac_hero_orb ac_orb3"></div>
    <div class="ac_hero_body">
      <div class="ac_hero_badge"><i class="fas fa-file-contract"></i> Condiciones de Uso</div>
      <h1 class="ac_hero_tit">Términos y<br><span class="ac_grad">Condiciones</span></h1>
      <p class="ac_hero_sub">
        Reglas claras para usar <strong>${app}</strong>, cuidar tus datos y mantener una experiencia amable para recordar cumpleaños.
      </p>
      <div class="tm_hero_chips">
        <span class="tm_chip"><i class="fas fa-heart"></i> Respeto</span>
        <span class="tm_chip"><i class="fas fa-shield-halved"></i> Transparencia</span>
        <span class="tm_chip"><i class="fas fa-gavel"></i> Claridad</span>
      </div>
      <div class="tm_last_upd">
        <i class="fas fa-calendar-check"></i>
        Última actualización: ${year()} · Versión ${version}
      </div>
    </div>
  </section>

  <!-- ══ ÍNDICE RÁPIDO ══ -->
  <div class="tm_index_band">
    ${SECCIONES.map((s, i) => `
      <a href="#tm_sec_${i}" class="tm_index_item">
        <i class="fas ${s.ico}" style="color:${s.color}"></i>
        <span>${s.tit}</span>
      </a>`).join('')}
  </div>

  <!-- ══ SECCIONES ══ -->
  <section class="ac_sec tm_secciones">
    <div class="ac_sec_head">
      <div class="ac_sec_badge"><i class="fas fa-list-check"></i> Acuerdo de Uso</div>
      <h2 class="ac_sec_tit">Reglamento <span class="ac_grad">General</span></h2>
      <p class="ac_sec_sub">Lee con atención. El uso de CumpleWii requiere la aceptación de estas condiciones.</p>
    </div>
    <div class="tm_secs_grid">
      ${SECCIONES.map((s, i) => `
        <div class="tm_sec_card wi_fadeUp" id="tm_sec_${i}">
          <div class="tm_sec_header">
            <div class="tm_sec_ico" style="--tc:${s.color}">
              <i class="fas ${s.ico}"></i>
            </div>
            <div>
              <span class="tm_sec_num" style="color:${s.color}">${s.num}</span>
              <h2 class="tm_sec_tit">${s.tit}</h2>
            </div>
          </div>
          <div class="tm_sec_body">${s.body}</div>
        </div>`).join('')}
    </div>
  </section>

</div></main>
`;

// ============================================================
// ⚡ EVENT DELEGATION SYSTEM
// ============================================================
const docListeners = [];
const onDoc = (type, selector, handler) => {
  const wrapper = (e) => {
    if (!selector) {
      handler.call(e.currentTarget, e);
      return;
    }
    const target = e.target.closest(selector);
    if (target) {
      handler.call(target, e);
    }
  };
  document.addEventListener(type, wrapper);
  docListeners.push({ type, wrapper });
};

const offDoc = () => {
  docListeners.forEach(({ type, wrapper }) => {
    document.removeEventListener(type, wrapper);
  });
  docListeners.length = 0;
};

// ── INIT ──────────────────────────────────────────────────────────────────
let _obs = null;

export const init = () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  _obs = observer;
  document.querySelectorAll('.wi_fadeUp').forEach(el => { observer.observe(el); });

  onDoc('click', '.tm_nav', function (e) {
    e.preventDefault();
    const { rutas } = window._wiRutas ?? {};
    const href = this.getAttribute('href');
    if (href) rutas?.navigate?.(href);
  });

  onDoc('click', '.tm_index_item', function (e) {
    e.preventDefault();
    const href = this.getAttribute('href');
    const t = href ? document.querySelector(href) : null;
    if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
  });

  if (window.wiInitTips) window.wiInitTips();
  console.log(`📜 ${app} Términos cargados`);
  window.__WIREADY__ = true;
};

export const cleanup = () => {
  _obs?.disconnect?.();
  _obs = null;
  offDoc();
};

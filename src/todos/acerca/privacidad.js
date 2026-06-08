import './acerca.css';
import './terminos.css';
import { app, version } from '../../wii.js';
import { year } from '../../widev.js';

// ── DATOS ─────────────────────────────────────────────────────────────────
const SECCIONES = [
  {
    ico: 'fa-info', color: '#0EBEFF', num: '01',
    tit: 'Información que recopilamos',
    body: `<p>Pedimos lo necesario para la app: cuenta, perfil, plan, cumpleaños guardados, notas, favoritos, feedback y token de notificaciones si lo autorizas.</p>`
  },
  {
    ico: 'fa-chart-line', color: '#29C72E', num: '02',
    tit: 'Cómo usamos tu información',
    body: `<p>La usamos para autenticarte, sincronizar tus datos, calcular avisos, aplicar límites por plan y mejorar estabilidad.</p>`
  },
  {
    ico: 'fa-globe', color: '#FF5C69', num: '03',
    tit: 'Publicidad y servicios externos',
    body: `<p>Usamos Firebase y servicios de Google para autenticación, Firestore, Cloud Messaging y análisis técnico cuando corresponda.</p>`
  },
  {
    ico: 'fa-users', color: '#7000FF', num: '04',
    tit: 'Compartir información con terceros',
    body: `<p>No vendemos ni alquilamos tus datos. Solo compartimos información con proveedores necesarios para operar CumpleWii.</p>`
  },
  {
    ico: 'fa-lock', color: '#FFDA34', num: '05',
    tit: 'Tus derechos',
    body: `<p>Puedes pedir acceso, corrección o eliminación de tu información escribiendo al equipo. Queremos que tengas control real sobre tus datos.</p>`
  },
  {
    ico: 'fa-user-shield', color: '#0EBEFF', num: '06',
    tit: 'Seguridad',
    body: `<p>Usamos conexiones cifradas y proveedores con estándares modernos de seguridad para cuidar tus sesiones y datos sincronizados.</p>`
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
      <div class="ac_hero_badge"><i class="fas fa-shield-halved"></i> Datos Claros, Uso Responsable</div>
      <h1 class="ac_hero_tit">Política de<br><span class="ac_grad">Privacidad</span></h1>
      <p class="ac_hero_sub">
        <strong>${app}</strong> guarda solo lo necesario para iniciar sesión, sincronizar tus cumpleaños, activar recordatorios y mejorar la experiencia.
      </p>
      <div class="tm_hero_chips">
        <span class="tm_chip"><i class="fas fa-ban"></i> 0 Venta de Datos</span>
        <span class="tm_chip"><i class="fas fa-lock"></i> 100% Cifrado</span>
        <span class="tm_chip"><i class="fas fa-bell"></i> Avisos Locales</span>
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
      <div class="ac_sec_badge"><i class="fas fa-shield-halved"></i> Protección</div>
      <h2 class="ac_sec_tit">Nuestros Compromisos de <span class="ac_grad">Privacidad</span></h2>
      <p class="ac_sec_sub">Tus fechas y notas se guardan con transparencia y control absoluto.</p>
    </div>
    <div class="tm_secs_grid">
      ${SECCIONES.map((s, i) => `
        <div class="tm_sec_card wi_fadeUp" id="tm_sec_${i}">
          <div class="tm_sec_header">
            <div class="tm_sec_ico" style="--tc:${s.color}"><i class="fas ${s.ico}"></i></div>
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
  _obs = new IntersectionObserver(
    (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
    { threshold: 0.1 }
  );
  document.querySelectorAll('.wi_fadeUp').forEach(el => { _obs.observe(el); });

  onDoc('click', '.tm_nav', function (e) {
    e.preventDefault();
    import('../../rutas.js').then(m => m.rutas.navigate(this.getAttribute('href')));
  });

  onDoc('click', '.tm_index_item', function (e) {
    e.preventDefault();
    const href = this.getAttribute('href');
    const t = href ? document.querySelector(href) : null;
    if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
  });

  console.log(`🔒 ${app} Privacidad cargada`);
  window.__WIREADY__ = true;
};

export const cleanup = () => {
  _obs?.disconnect?.(); _obs = null;
  offDoc();
};

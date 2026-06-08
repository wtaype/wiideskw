import './acerca.css';
import './terminos.css';
import { app } from '../../wii.js';

const CANALES = [
  {
    ico: 'fa-github', color: '#0EBEFF', bg: 'var(--wb)', txt: 'var(--tx)',
    tit: 'GitHub Issues',
    desc: 'Reporta errores o pide nuevas funciones directamente en nuestro repositorio oficial de manera transparente.',
    url: 'https://github.com/wtaype/CumpleWii/issues',
    cta: 'Abrir GitHub'
  },
  {
    ico: 'fa-envelope', color: '#29C72E', bg: 'var(--wb)', txt: 'var(--tx)',
    tit: 'Correo directo',
    desc: 'Escríbenos con tus comentarios, sugerencias o cualquier duda que tengas, preferentemente desde la sección de contacto.',
    url: '/contacto',
    cta: 'Enviar correo'
  },
];

const CATS = [
  { ico: 'fa-bug', color: '#FF5C69', tit: 'Reportar un error', desc: 'Algo no funciona como debería y quieres ayudarnos a corregirlo (bugs, errores visuales).' },
  { ico: 'fa-lightbulb', color: '#FFDA34', tit: 'Sugerir una idea', desc: 'Tienes una propuesta de mejora que haría a CumpleWii más útil o más bonito.' },
  { ico: 'fa-star', color: '#0EBEFF', tit: 'Dejar una opinión', desc: 'Quieres contarnos cómo ha sido tu experiencia con la app o qué es lo que más te gusta.' },
  { ico: 'fa-spa', color: '#7000FF', tit: 'Contenido y datos', desc: 'Algo relacionado con música, blog, privacidad, planes de usuario o datos guardados.' },
];

export const render = () => `
<main id="wimain">
<div class="ac_wrap tm_wrap">

  <section class="ac_hero tm_hero">
    <div class="ac_hero_orb ac_orb1"></div><div class="ac_hero_orb ac_orb2"></div><div class="ac_hero_orb ac_orb3"></div>
    <div class="ac_hero_body">
      <div class="ac_hero_badge"><i class="fas fa-heart"></i> Tu opinión nos importa</div>
      <h1 class="ac_hero_tit">Centro de<br><span class="ac_grad">Feedback 💡</span></h1>
      <p class="ac_hero_sub">
        <strong>${app}</strong> crece gracias a tus ideas, tus reportes y lo que sientes al usar la app.
        Ayúdanos a construir la mejor experiencia para celebrar.
      </p>
      <div class="tm_hero_chips">
        <span class="tm_chip"><i class="fas fa-bullhorn"></i> Tu Voz Importa</span>
        <span class="tm_chip"><i class="fas fa-users"></i> App Comunitaria</span>
        <span class="tm_chip"><i class="fas fa-rocket"></i> Mejora Constante</span>
      </div>
    </div>
  </section>

  <section class="ac_sec">
    <div class="ac_sec_head">
      <div class="ac_sec_badge"><i class="fas fa-comments"></i> Canales de ayuda</div>
      <h2 class="ac_sec_tit">¿Cómo <span class="ac_grad">escribirnos?</span></h2>
      <p class="ac_sec_sub">Elige la forma más cómoda para hacer llegar tus comentarios</p>
    </div>
    <div class="fb_canales">
      ${CANALES.map(c => `
        <a href="${c.url}" class="${c.url.startsWith('/') ? 'nv_item' : ''} fb_canal wi_fadeUp" style="--cc:${c.color}" ${!c.url.startsWith('/') ? 'target="_blank"' : ''}>
          <div class="fb_canal_ico" style="background:${c.bg};color:${c.txt}"><i class="fab ${c.ico}"></i> <i class="fas ${c.ico}"></i></div>
          <div class="fb_canal_info">
            <strong>${c.tit}</strong>
            <span>${c.desc}</span>
          </div>
          <div class="fb_canal_cta" style="color:${c.color}">${c.cta} <i class="fas fa-arrow-right"></i></div>
        </a>`).join('')}
    </div>
  </section>

  <section class="ac_sec ac_sec_alt">
    <div class="ac_sec_head">
      <div class="ac_sec_badge"><i class="fas fa-layer-group"></i> Categorías</div>
      <h2 class="ac_sec_tit">¿De qué trata <span class="ac_grad">tu mensaje?</span></h2>
      <p class="ac_sec_sub">Así puedes enfocar mejor tus ideas al escribirnos</p>
    </div>
    <div class="ac_feat_grid">
      ${CATS.map(c => `
        <div class="ac_feat_card wi_fadeUp" style="--sc:${c.color}">
          <div class="ac_feat_ico"><i class="fas ${c.ico}"></i></div>
          <h3>${c.tit}</h3><p>${c.desc}</p>
        </div>`).join('')}
    </div>
  </section>

</div></main>`;

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

let _obs = null;
export const init = () => {
  _obs = new IntersectionObserver(
    (e) => e.forEach(x => { if (x.isIntersecting) x.target.classList.add('visible'); }),
    { threshold: 0.1 }
  );
  document.querySelectorAll('.wi_fadeUp').forEach(el => { _obs.observe(el); });

  // Interceptar navegación SPA en links internos
  onDoc('click', '.nv_item', function (e) {
    const href = this.getAttribute('href');
    if (href && href.startsWith('/')) {
      e.preventDefault();
      import('../../rutas.js').then(m => m.rutas.navigate(href));
    }
  });

  console.log(`💬 ${app} Feedback cargado`);
};

export const cleanup = () => {
  _obs?.disconnect?.(); _obs = null;
  offDoc();
};

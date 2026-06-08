import './acerca.css';
import './terminos.css';
import { app, version } from '../../wii.js';
import { year } from '../../widev.js';

const TIPOS = [
  {
    ico: 'fa-shield-halved', color: '#0EBEFF', tag: 'Esencial',
    tit: 'Autenticación y Sesión',
    desc: 'Necesarias para mantener tu cuenta conectada y sincronizar tus datos.',
    items: [
      'Almacena el estado de sesión y el token seguro de Firebase Auth.',
      'Asegura que solo tú puedas ver y modificar tus cumpleaños guardados.',
      'Permite el inicio de sesión rápido sin volver a pedir tus credenciales constantemente.'
    ],
  },
  {
    ico: 'fa-hard-drive', color: '#29C72E', tag: 'Caché Local',
    tit: 'Tema Estético y Rendimiento',
    desc: 'Datos locales guardados en tu navegador para agilizar la interfaz visual y reducir consumo de datos.',
    items: [
      'Guarda tu tema de color preferido (por defecto el tema "Oro").',
      'Mantiene una memoria caché rápida para avatares, fotos de eventos y lectura del blog de ideas.',
      'Registra tu configuración de notificaciones y la vista preferida del calendario.'
    ],
  },
];

const PASOS = [
  { ico: 'fa-chrome',           color: '#0EBEFF', tit: 'Chrome / Edge',   desc: 'Configuración → Privacidad y seguridad → Cookies y otros datos de sitios' },
  { ico: 'fa-firefox-browser',  color: '#FF5C69', tit: 'Firefox',         desc: 'Opciones → Privacidad y seguridad → Cookies y datos del sitio' },
  { ico: 'fa-safari',           color: '#29C72E', tit: 'Safari',          desc: 'Preferencias → Privacidad → Gestionar datos de sitios web' },
  { ico: 'fa-mobile-screen',    color: '#7000FF', tit: 'Móvil (Android/iOS)', desc: 'Configuración del navegador → Privacidad → Borrar datos de navegación' },
];

export const render = () => `
<main id="wimain">
<div class="ac_wrap tm_wrap">
  <section class="ac_hero tm_hero">
    <div class="ac_hero_orb ac_orb1"></div><div class="ac_hero_orb ac_orb2"></div><div class="ac_hero_orb ac_orb3"></div>
    <div class="ac_hero_body">
      <div class="ac_hero_badge"><i class="fas fa-cookie-bite"></i> Seguridad e Integridad</div>
      <h1 class="ac_hero_tit">Uso de<br><span class="ac_grad">Datos Locales</span></h1>
      <p class="ac_hero_sub">Te explicamos cómo usamos el almacenamiento local y la caché técnica de tu dispositivo para garantizar el funcionamiento rápido de <strong>${app}</strong>.</p>
      <div class="tm_hero_chips">
        <span class="tm_chip"><i class="fas fa-bolt"></i> Carga rápida</span>
        <span class="tm_chip"><i class="fas fa-user-shield"></i> Sesión Segura</span>
        <span class="tm_chip"><i class="fas fa-lock"></i> Caché Local</span>
      </div>
      <div class="tm_last_upd"><i class="fas fa-calendar-check"></i> Última actualización: ${year()} · Versión ${version}</div>
    </div>
  </section>

  <section class="ac_sec">
    <div class="ac_sec_head">
      <div class="ac_sec_badge"><i class="fas fa-list-check"></i> Almacenamiento</div>
      <h2 class="ac_sec_tit">Almacenamiento <span class="ac_grad">técnico</span></h2>
      <p class="ac_sec_sub">Toda la información reside de manera local o encriptada a través de Firebase para proteger tu cuenta.</p>
    </div>
    <div class="ck_grid">
      ${TIPOS.map(t => `
        <div class="ck_card wi_fadeUp">
          <div class="ck_card_top">
            <div class="tm_sec_ico" style="--tc:${t.color}"><i class="fas ${t.ico}"></i></div>
            <span class="ck_tag" style="background:color-mix(in srgb,${t.color} 15%,transparent);color:${t.color}">${t.tag}</span>
          </div>
          <h3 class="ck_tit">${t.tit}</h3>
          <p class="ck_desc">${t.desc}</p>
          <ul class="tm_list">${t.items.map(i => `<li><i class="fas fa-check"></i>${i}</li>`).join('')}</ul>
        </div>`).join('')}
    </div>
  </section>

  <section class="ac_sec ac_sec_alt">
    <div class="ac_sec_head">
      <div class="ac_sec_badge"><i class="fas fa-sliders"></i> Control</div>
      <h2 class="ac_sec_tit">Cómo <span class="ac_grad">gestionar</span> la caché</h2>
      <p class="ac_sec_sub">Puedes limpiar el almacenamiento de tu navegador si tienes problemas de carga o deseas forzar el cierre de sesión.</p>
    </div>
    <div class="ac_feat_grid">
      ${PASOS.map(p => `
        <div class="ac_feat_card wi_fadeUp" style="--sc:${p.color}">
          <div class="ac_feat_ico"><i class="fab ${p.ico}"></i></div>
          <h3>${p.tit}</h3><p>${p.desc}</p>
        </div>`).join('')}
    </div>
    <div class="tm_alert" style="max-width:800px;margin:6vh auto 0">
      <i class="fas fa-triangle-exclamation"></i>
      <p>Limpiar el almacenamiento local del navegador cerrará tu sesión activa, restablecerá el tema estético a la configuración por defecto y forzará la descarga de fotos de tus contactos la próxima vez que ingreses.</p>
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

  onDoc('click', '.tm_nav', function (e) {
    e.preventDefault();
    import('../../rutas.js').then(m => m.rutas.navigate(this.getAttribute('href')));
  });

  console.log(`🍪 ${app} Cookies cargada`);
  window.__WIREADY__ = true;
};

export const cleanup = () => {
  _obs?.disconnect?.(); _obs = null;
  offDoc();
};

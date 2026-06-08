import { app, lanzamiento, by, linkme, version } from './wii.js';
import { savels, getls } from './widev.js';

export { footer };
function footer(){
  const ahora = new Date();
  return `
  <footer class="foo">
    <div class="foo_inner">
      <div class="foo_left">
        <div class="foo_brand">
          <span class="foo_app"><a href="/">${app}</a></span>
          <span class="foo_ver">${version}</span>
        </div>
        <div class="foo_links">
          <a href="/acerca"   class="foo_link nv_item" data-page="acerca"  ><i class="fas fa-circle-info"></i> Acerca</a>
          <a href="/terminos"   class="foo_link nv_item" data-page="terminos"  ><i class="fas fa-file-contract"></i> Términos</a> 
          <a href="/cookies"    class="foo_link nv_item" data-page="cookies"   ><i class="fas fa-cookie-bite"></i> Cookies</a>
          <a href="/privacidad" class="foo_link nv_item" data-page="privacidad"><i class="fas fa-lock"></i> Privacidad</a>
          <a href="/feedback"   class="foo_link nv_item" data-page="feedback"  ><i class="fas fa-comment-dots"></i> Feedback</a>
          <a href="/contacto"   class="foo_link nv_item" data-page="contacto"  ><i class="fas fa-envelope"></i> Contacto</a>
        </div>
      </div>
      <div class="foo_right">
        <span>Creado con <i class="fas fa-heart" style="color:var(--mco);"></i> by <a href="${linkme}" target="_blank"><strong>${by}</strong></a> ${lanzamiento} - ${ahora.getFullYear()}</span>
      </div>
    </div>
  </footer>
  `;
}

if (!document.querySelector('.foo')) {
  document.body.insertAdjacentHTML('beforeend', footer());
}

if (!document.getElementById('wi_bg_style')) {
  const style = document.createElement('style');
  style.id = 'wi_bg_style';
  style.textContent = `:root{--bgim:url("${import.meta.env.BASE_URL}wpuntos.svg")}body{background: var(--bgim), var(--bg)}`;
  document.head.appendChild(style);
}

// ── BANNER COOKIES ────────────────────────────────────────────────────────────
const CK_KEY = 'cookies';

const cerrarBanner = (val) => {
  savels(CK_KEY, val);
  const cookiesEl = document.getElementById('cookies');
  if (cookiesEl) {
    cookiesEl.classList.remove('cookies_show');
    setTimeout(() => cookiesEl.remove(), 150);
  }
};

// Event listeners for cookies consent with native pointerdown delegation
document.addEventListener('pointerdown', (e) => {
  if (e.target.closest('#ck_aceptar')) {
    cerrarBanner(true);
  } else if (e.target.closest('#ck_rechazar')) {
    cerrarBanner(false);
  }
});

if (!getls(CK_KEY)) {
  const cookiesEl = document.getElementById('cookies');
  if (!cookiesEl) {
    document.body.insertAdjacentHTML('beforeend', `
<div class="cookiess" id="cookies" role="dialog" aria-live="polite" aria-label="Consentimiento de Cookies">
    <p class="cookiess_txt"><i class="fas fa-cookie-bite cookiess_ico"></i>Usamos almacenamiento local para guardar tus preferencias de tema y configuración de privacidad de forma segura.
    <a class="cookiess_link nv_item" href="/cookies">Más info</a></p>
    <div class="cookiess_btns"><button class="cookiess_aceptar" id="ck_aceptar"><i class="fas fa-check"></i> Entendido</button>
    <button class="cookiess_rechazar" id="ck_rechazar">Cerrar</button></div>
  </div>`);
  }
  setTimeout(() => {
    const el = document.getElementById('cookies');
    if (el) el.classList.add('cookies_show');
  }, 800);
} else {
  const cookiesEl = document.getElementById('cookies');
  if (cookiesEl) cookiesEl.remove();
}
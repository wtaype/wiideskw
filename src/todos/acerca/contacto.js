import './acerca.css';
import './contacto.css';
import { app } from '../../wii.js';
import { Notificacion, wiSpin, wiVista, wicopy, wiSmart } from '../../widev.js';

// ── Configuración EmailJS ──────────────────────────────────────────────────────
const EJS = {
  pub: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  sid: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  tid: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
};
wiSmart({
  js: [() => import('https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js')],
});

// ── Datos de contacto interno ─────────────────────────────────────────────────
const INFO = [
  { ico: 'fa-envelope',     color: '#0EBEFF', label: 'Email Soporte', value: 'wilder.taype@hotmail.com', copiable: true  },
  { ico: 'fa-users',        color: '#FF5C69', label: 'Comunidad', value: 'Soporte Comunitario GitHub', copiable: false },
  { ico: 'fa-clock',        color: '#29C72E', label: 'Atención Técnica', value: 'Lunes a Viernes (Respuesta en 24h)', copiable: false },
];

const ASUNTOS = [
  'Preguntar sobre planes (Free, Pro, Vip)',
  'Reportar problema con inicio de sesión o cuenta',
  'Sugerir una canción para la app',
  'Sugerir una idea de regalo o artículo para el blog',
  'Soporte general con CumpleWii',
  'Otro motivo de contacto',
];

const FAQ = [
  { q: '¿Respondemos todos los mensajes?', r: 'Sí. Cada mensaje que recibimos se lee y responde de forma personal por el equipo.' },
  { q: '¿CumpleWii sigue siendo gratis?', r: 'Sí. El plan base de CumpleWii es y será gratuito, buscamos mantener la app accesible para todos.' },
  { q: '¿Tus mensajes son confidenciales?', r: 'Absolutamente. Solo los revisa el equipo de soporte de CumpleWii y no se comparten con terceros bajo ninguna circunstancia.' },
  { q: '¿El formulario interno vendrá después?', r: 'Por ahora preferimos usar correo directo y GitHub Issues para mantener la seguridad, simplicidad y rapidez en las respuestas.' },
];

const MAX_CHARS = 500;

// ── Anti-spam: timestamp del último envío (localStorage) ──────────────────────
const SPAM_KEY  = 'wi_ct_last';
const SPAM_WAIT = 60 * 1000; // 1 minuto entre envíos

const puedeEnviar = () => {
  const last = parseInt(localStorage.getItem(SPAM_KEY) || '0', 10);
  return Date.now() - last > SPAM_WAIT;
};
const marcarEnvio = () => localStorage.setItem(SPAM_KEY, String(Date.now()));

// ── Estado ─────────────────────────────────────────────────────────────────────
let _obs = [];

// ── Render ─────────────────────────────────────────────────────────────────────
export const render = () => `
<main id="wimain">
<div class="ac_wrap ct_wrap">

  <!-- ══ HERO ══ -->
  <section class="ac_hero ct_hero">
    <div class="ac_hero_orb ac_orb1"></div>
    <div class="ac_hero_orb ac_orb2"></div>
    <div class="ac_hero_orb ac_orb3"></div>
    <div class="ac_hero_body">
      <div class="ac_hero_badge"><i class="fas fa-headset"></i> Estamos para ti</div>
      <h1 class="ac_hero_tit">Soporte y<br><span class="ac_grad">Contacto 💌</span></h1>
      <p class="ac_hero_sub">
        Si tienes una duda, una sugerencia o solo quieres saludar, 
        <strong>aquí tienes los caminos más directos hacia nosotros.</strong>
      </p>
      <div class="tm_hero_chips">
        <span class="tm_chip"><i class="fas fa-clock"></i> Respuesta rápida</span>
        <span class="tm_chip"><i class="fas fa-shield-halved"></i> 100% Seguro</span>
        <span class="tm_chip"><i class="fas fa-heart"></i> Atención Personal</span>
      </div>
    </div>
  </section>

  <!-- ══ GRID: FORM + INFO ══ -->
  <section class="ac_sec ct_sec">
    <div class="ct_grid">

      <!-- Formulario -->
      <div class="ct_form_wrap">
        <div class="ac_sec_head" style="text-align:left;margin-bottom:4vh">
          <div class="ac_sec_badge"><i class="fas fa-comment-dots"></i> Escríbenos</div>
          <h2 class="ac_sec_tit">Enviar <span class="ac_grad">un mensaje</span></h2>
        </div>
        <form id="ctForm" class="ct_form" novalidate autocomplete="off">
          <!-- Honeypot anti-bot (invisible) -->
          <input type="text" name="ct_honey" id="ct_honey" tabindex="-1" aria-hidden="true" style="position:absolute;left:-9999px;opacity:0">

          <div class="ct_field">
            <label for="ct_nombre"><i class="fas fa-user"></i> Tu Nombre</label>
            <input type="text" id="ct_nombre" name="from_name" placeholder="Ingresa tu nombre o alias" required maxlength="80">
          </div>
          <div class="ct_field">
            <label for="ct_email"><i class="fas fa-envelope"></i> Correo Electrónico</label>
            <input type="email" id="ct_email" name="email" placeholder="ejemplo@correo.com" required maxlength="120">
          </div>
          <div class="ct_field">
            <label for="ct_asunto"><i class="fas fa-tag"></i> Motivo</label>
            <select id="ct_asunto" name="asunto" required>
              <option value="">Selecciona un motivo</option>
              ${ASUNTOS.map(a => `<option value="${a}">${a}</option>`).join('')}
            </select>
          </div>
          <div class="ct_field">
            <label for="ct_mensaje"><i class="fas fa-comment-dots"></i> Detalles de tu mensaje</label>
            <textarea id="ct_mensaje" name="message" rows="6" placeholder="Escribe aquí tu duda, sugerencia o comentario..." required maxlength="${MAX_CHARS}"></textarea>
            <div class="ct_chars"><span id="ct_count">0</span> / ${MAX_CHARS}</div>
          </div>

          <div class="ct_actions">
            <button type="submit" class="ac_btn_p ct_btn_submit" id="ct_submit">
              <i class="fas fa-paper-plane"></i> <span>Enviar Mensaje</span>
            </button>
            <button type="reset" class="ac_btn_s">
              <i class="fas fa-redo"></i> <span>Limpiar</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Info -->
      <div class="ct_info_wrap">
        <div class="ct_info_card wi_fadeUp">
          <h3><i class="fas fa-address-card"></i> Contacto Directo</h3>
          <div class="ct_info_items">
            ${INFO.map(it => `
              <div class="ct_info_item">
                <div class="ct_info_ico" style="background:color-mix(in srgb,${it.color} 15%,transparent);color:${it.color}">
                  <i class="fas ${it.ico}"></i>
                </div>
                <div class="ct_info_data">
                  <span class="ct_info_label">${it.label}</span>
                  <span class="ct_info_value">${it.value}</span>
                </div>
                ${it.copiable ? `<button class="ct_copy" data-copy="${it.value}" title="Copiar"><i class="fas fa-copy"></i></button>` : ''}
              </div>`).join('')}
          </div>
        </div>

        <a href="https://github.com/wtaype/CumpleWii/issues" target="_blank" class="ct_info_card wi_fadeUp" style="margin-top:3vh; text-decoration:none; display:block; border-color:var(--mco);">
          <h3><i class="fab fa-github"></i> GitHub Issues</h3>
          <div style="font-size:0.8rem; line-height:1.6; padding:12px; color:var(--tx2);">
            Si prefieres un seguimiento técnico, puedes reportar errores o pedir nuevas funciones directamente en nuestro repositorio oficial de GitHub.
          </div>
        </a>
      </div>

    </div>
  </section>

  <!-- ══ FAQ ══ -->
  <section class="ac_sec ac_sec_alt">
    <div class="ac_sec_head">
      <div class="ac_sec_badge"><i class="fas fa-circle-question"></i> Respuestas Rápidas</div>
      <h2 class="ac_sec_tit">Preguntas <span class="ac_grad">Frecuentes</span></h2>
    </div>
    <div class="ct_faq">
      ${FAQ.map((f, i) => `
        <div class="ct_faq_item wi_fadeUp" id="faq_${i}">
          <div class="ct_faq_q">
            <i class="fas fa-circle-question"></i>
            <h3>${f.q}</h3>
            <i class="fas fa-chevron-down ct_faq_arr"></i>
          </div>
          <div class="ct_faq_a"><p>${f.r}</p></div>
        </div>`).join('')}
    </div>
  </section>

</div></main>`;

// ============================================================
// ⚡ EVENT DELEGATION SYSTEM & ANIMATIONS
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

// Vanilla slideUp/slideDown utility functions to replace jQuery animation
const slideUp = (el, duration = 280) => {
  el.style.height = el.offsetHeight + 'px';
  el.style.transition = `height ${duration}ms ease, padding ${duration}ms ease, margin ${duration}ms ease`;
  el.offsetHeight; // force repaint
  el.style.height = '0';
  el.style.paddingTop = '0';
  el.style.paddingBottom = '0';
  el.style.marginTop = '0';
  el.style.marginBottom = '0';
  el.style.overflow = 'hidden';
  setTimeout(() => {
    el.style.display = 'none';
    el.style.removeProperty('height');
    el.style.removeProperty('padding-top');
    el.style.removeProperty('padding-bottom');
    el.style.removeProperty('margin-top');
    el.style.removeProperty('margin-bottom');
    el.style.removeProperty('overflow');
    el.style.removeProperty('transition');
  }, duration);
};

const slideDown = (el, duration = 280) => {
  el.style.display = 'block';
  el.style.overflow = 'hidden';
  const styles = window.getComputedStyle(el);
  const paddingTop = styles.paddingTop;
  const paddingBottom = styles.paddingBottom;
  const marginTop = styles.marginTop;
  const marginBottom = styles.marginBottom;
  const height = el.offsetHeight;
  
  el.style.height = '0';
  el.style.paddingTop = '0';
  el.style.paddingBottom = '0';
  el.style.marginTop = '0';
  el.style.marginBottom = '0';
  el.offsetHeight; // force repaint
  
  el.style.transition = `height ${duration}ms ease, padding ${duration}ms ease, margin ${duration}ms ease`;
  el.style.height = height + 'px';
  el.style.paddingTop = paddingTop;
  el.style.paddingBottom = paddingBottom;
  el.style.marginTop = marginTop;
  el.style.marginBottom = marginBottom;
  
  setTimeout(() => {
    el.style.removeProperty('height');
    el.style.removeProperty('padding-top');
    el.style.removeProperty('padding-bottom');
    el.style.removeProperty('margin-top');
    el.style.removeProperty('margin-bottom');
    el.style.removeProperty('overflow');
    el.style.removeProperty('transition');
  }, duration);
};

// ── Init ──────────────────────────────────────────────────────────────────────
export const init = () => {
  // Contador de caracteres
  onDoc('input', '#ct_mensaje', function () {
    const v = this.value;
    if (v.length > MAX_CHARS) this.value = v.slice(0, MAX_CHARS);
    const ctCount = document.getElementById('ct_count');
    if (ctCount) ctCount.textContent = Math.min(this.value.length, MAX_CHARS);
  });

  // Reset → limpiar contador
  onDoc('reset', '#ctForm', () => {
    setTimeout(() => {
      const ctCount = document.getElementById('ct_count');
      if (ctCount) ctCount.textContent = '0';
    }, 10);
  });

  // Envío del formulario
  onDoc('submit', '#ctForm', async function (e) {
    e.preventDefault();

    // honeypot
    const honey = document.getElementById('ct_honey');
    if (honey && honey.value) return;

    if (!puedeEnviar()) {
      Notificacion('Espera un momento antes de enviar otro mensaje.', 'warning');
      return;
    }

    const nombreEl = document.getElementById('ct_nombre');
    const emailEl = document.getElementById('ct_email');
    const asuntoEl = document.getElementById('ct_asunto');
    const mensajeEl = document.getElementById('ct_mensaje');

    const nombre   = nombreEl ? nombreEl.value.trim() : '';
    const email    = emailEl ? emailEl.value.trim() : '';
    const asunto   = asuntoEl ? asuntoEl.value : '';
    const mensaje  = mensajeEl ? mensajeEl.value.trim() : '';

    if (nombre.length < 3)                                return Notificacion('El nombre debe tener al menos 3 caracteres.', 'error');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))       return Notificacion('Ingresa un email válido.', 'error');
    if (!asunto)                                          return Notificacion('Selecciona una incidencia.', 'error');
    if (mensaje.length < 10)                              return Notificacion('El mensaje debe tener al menos 10 caracteres.', 'error');

    const btn = document.getElementById('ct_submit');
    wiSpin(btn, true, 'Enviando…');

    try {
      if (typeof window.emailjs === 'undefined') {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
          script.onload = resolve;
          script.onerror = () => reject(new Error('No se pudo cargar EmailJS'));
          document.head.appendChild(script);
        });
      }
      
      window.emailjs.init(EJS.pub);

      await window.emailjs.send(EJS.sid, EJS.tid, {
        nombre:   nombre,
        email:    email,
        telefono: 'N/A',
        asunto:   asunto,
        mensaje:  mensaje,
        app_name: app,
      });

      marcarEnvio();
      Notificacion('¡Mensaje enviado al equipo de CumpleWii! Te responderemos pronto. 💌', 'success', 4500);
      this.reset();
      const ctCount = document.getElementById('ct_count');
      if (ctCount) ctCount.textContent = '0';
    } catch (err) {
      console.error('[contacto] EmailJS error:', err);
      Notificacion('No se pudo enviar el mensaje. Revisa tu conexión o intenta más tarde.', 'error');
    } finally {
      wiSpin(btn, false, 'Enviar Mensaje');
    }
  });

  // Copiar datos de contacto
  onDoc('click', '.ct_copy', function () {
    wicopy(this.getAttribute('data-copy'), this, '¡Copiado!');
  });

  // FAQ acordeón
  onDoc('click', '.ct_faq_q', function () {
    const item = this.closest('.ct_faq_item');
    if (!item) return;
    const isOpen = item.classList.contains('active');
    
    // Close all items
    document.querySelectorAll('.ct_faq_item').forEach(el => {
      el.classList.remove('active');
      const ans = el.querySelector('.ct_faq_a');
      if (ans && ans.style.display !== 'none' && window.getComputedStyle(ans).display !== 'none') {
        slideUp(ans, 280);
      }
    });
    document.querySelectorAll('.ct_faq_arr').forEach(el => el.classList.remove('rotated'));
    
    if (!isOpen) {
      item.classList.add('active');
      const ans = item.querySelector('.ct_faq_a');
      if (ans) {
        slideDown(ans, 280);
      }
      const arr = item.querySelector('.ct_faq_arr');
      if (arr) {
        arr.classList.add('rotated');
      }
    }
  });

  _obs.push(wiVista('.wi_fadeUp', (el) => el.classList.add('visible')));
  _obs.push(wiVista('.ct_faq_item', (el, i) => setTimeout(() => el.classList.add('visible'), i * 80)));

  console.log(`📩 ${app} Contacto cargado`);
  window.__WIREADY__ = true;
};

// ── Cleanup ───────────────────────────────────────────────────────────────────
export const cleanup = () => {
  offDoc();
  _obs.forEach(o => o?.disconnect?.()); _obs = [];
};

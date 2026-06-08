import './acerca.css';
import { app, version, by, linkme, icon } from '../../wii.js';
import { year, wiTip, wicopy } from '../../widev.js';

// ============================================================
// 🎨 RENDER
// ============================================================
export const render = () => `
<main id="wimain">
<div class="ac_wrap">

  <!-- ══ HERO ══ -->
  <section class="ac_hero">
    <div class="ac_hero_orb ac_orb1"></div>
    <div class="ac_hero_orb ac_orb2"></div>
    <div class="ac_hero_orb ac_orb3"></div>
    <div class="ac_hero_body">
      <div class="ac_hero_logo" style="border:none; border-radius: 20px;">
        <img src="/smile.avif" alt="${app}" loading="lazy" style="border-radius:20px;">
      </div>
      <div class="ac_hero_badge"><i class="fas fa-cake-candles"></i> Cumpleaños, cariño y memoria</div>
      <h1 class="ac_hero_tit">${app}</h1>
      <p class="ac_hero_sub">
        CumpleWii te ayuda a recordar cumpleaños, organizar fechas importantes y celebrar a tu gente a tiempo, 
        con una experience <strong>rápida, cálida y privada.</strong>
      </p>
      <div class="ac_hero_stats">
          <div class="ac_stat" style="--sc:#0EBEFF">
            <i class="fas fa-gift" style="color:#0EBEFF"></i>
            <strong>Free</strong>
            <span>Plan inicial</span>
          </div>
          <div class="ac_stat" style="--sc:#FF5C69">
            <i class="fas fa-user-shield" style="color:#FF5C69"></i>
            <strong>100%</strong>
            <span>Privado</span>
          </div>
          <div class="ac_stat" style="--sc:#29C72E">
            <i class="fas fa-bell" style="color:#29C72E"></i>
            <strong>2</strong>
            <span>Avisos base</span>
          </div>
          <div class="ac_stat" style="--sc:#7000FF">
            <i class="fas fa-rocket" style="color:#7000FF"></i>
            <strong>2026</strong>
            <span>App moderna</span>
          </div>
      </div>
      <div class="ac_hero_btns">
        <a href="/inicio" class="ac_btn_p nv_item" data-page="inicio"><i class="fas fa-arrow-right"></i> Ir al Inicio</a>
        <button class="ac_btn_s" id="ac_compartir"><i class="fas fa-share-nodes"></i> Compartir App</button>
      </div>
      <div class="ac_hero_scroll"><i class="fas fa-chevron-down"></i></div>
    </div>
  </section>

  <!-- ══ NUESTRA HISTORIA / PROPÓSITO ══ -->
  <section class="ac_sec">
    <div class="ac_sec_head">
      <div class="ac_sec_badge"><i class="fas fa-circle-info"></i> El propósito</div>
      <h2 class="ac_sec_tit">Por qué <span class="ac_grad">${app}</span></h2>
    </div>
    <div class="ac_historia wi_fadeUp">
      <p><strong>${app}</strong> nace para que ninguna fecha especial se pierda entre el trabajo, los mensajes y la prisa diaria. Guardas cumpleaños, relación, notas, ideas de regalo, foto y color; la app te ayuda a recordar con tiempo y con cariño.</p>
      
      <p>El foco es claro: cumpleaños personales, recordatorios locales útiles, música de celebración, blog con ideas positivas y una experiencia premium diseñada en tonos oro/champagne pensada para la comodidad visual y el rápido acceso.</p>
      
      <p>Nuestra plataforma usa tecnologías modernas y Firebase para iniciar sesión, sincronizar tu perfil y resguardar tus datos. No vendemos tu información y preferimos ser transparentes con cada función y notificación que activamos en tu dispositivo.</p>

      <p>CumpleWii crece con cada evento guardado, buscando siempre ser la herramienta más sencilla para celebrar y honrar la vida de los que te importan.</p>

      <div class="ac_firma">
        <strong>Con cariño, ${by}</strong>
        <span>Diseño y Desarrollo · ${app}</span>
      </div>
    </div>
  </section>

  <!-- ══ BENEFICIOS ══ -->
  <section class="ac_sec ac_sec_alt">
    <div class="ac_sec_head">
      <div class="ac_sec_badge"><i class="fas fa-star"></i> Ventajas</div>
      <h2 class="ac_sec_tit">Beneficios pensados para una app <span class="ac_grad">útil y bonita</span></h2>
      <p class="ac_sec_sub">Desarrollado para que recordar fechas sea un proceso fácil y seguro</p>
    </div>
    <div class="ac_feat_grid">
      
        <div class="ac_feat_card wi_fadeUp ac_color_cielo">
          <div class="ac_feat_ico"><i class="fas fa-book-open"></i></div>
          <h3>Fechas bajo control</h3>
          <p>Ordena cumpleaños por cercanía, busca rápido por mes y abre detalles completos sin perder nunca el contexto visual.</p>
        </div>
        <div class="ac_feat_card wi_fadeUp ac_color_dulce">
          <div class="ac_feat_ico"><i class="fas fa-heart"></i></div>
          <h3>Recordatorios útiles</h3>
          <p>Avisos programados automáticamente: te notificamos dos días antes y el mismo día, pensados para darte tiempo a actuar y comprar un detalle.</p>
        </div>
        <div class="ac_feat_card wi_fadeUp ac_color_paz">
          <div class="ac_feat_ico"><i class="fas fa-lightbulb"></i></div>
          <h3>Ideas y música</h3>
          <p>Reproduce música de celebración de fondo y consulta el blog con artículos sobre decoración, mensajes inspiradores y regalos creativos.</p>
        </div>
        <div class="ac_feat_card wi_fadeUp ac_color_mora">
          <div class="ac_feat_ico"><i class="fas fa-spa"></i></div>
          <h3>Diseño confiable</h3>
          <p>Una interfaz de usuario luminosa, fluida, animada y premium, diseñada en vidrio esmerilado para que registrarse se sienta natural y moderno.</p>
        </div>
    </div>
  </section>

  <!-- ══ CÓMO FUNCIONA ══ -->
  <section class="ac_sec">
    <div class="ac_sec_head">
      <div class="ac_sec_badge"><i class="fas fa-circle-play"></i> Cómo empezar</div>
      <h2 class="ac_sec_tit">Tres pasos sencillos para <span class="ac_grad">celebrar mejor</span></h2>
    </div>
    <div class="ac_pasos">
      
        <div class="ac_paso wi_fadeUp">
          <div class="ac_paso_num">1</div>
          <div class="ac_paso_ico"><i class="fab fa-google"></i></div>
          <h3>Inicia Sesión</h3>
          <p>Accede de forma segura con tu cuenta de Google o Email y completa tu perfil.</p>
        </div>
        <div class="ac_paso_sep"><i class="fas fa-chevron-right"></i></div>
        <div class="ac_paso wi_fadeUp">
          <div class="ac_paso_num">2</div>
          <div class="ac_paso_ico"><i class="fas fa-user-plus"></i></div>
          <h3>Agrega Fechas</h3>
          <p>Ingresa cumpleaños importantes con foto, color, notas y nivel de cercanía.</p>
        </div>
        <div class="ac_paso_sep"><i class="fas fa-chevron-right"></i></div>
        <div class="ac_paso wi_fadeUp">
          <div class="ac_paso_num">3</div>
          <div class="ac_paso_ico"><i class="fas fa-champagne-glasses"></i></div>
          <h3>Celebra</h3>
          <p>Consulta "Cumples" o recibe las notificaciones previas para que nunca olvides a alguien especial.</p>
        </div>
        
    </div>
  </section>

  <!-- ══ TESTIMONIOS ══ -->
  <section class="ac_sec ac_sec_alt">
    <div class="ac_sec_head">
      <div class="ac_sec_badge"><i class="fas fa-comments"></i> Opiniones de la comunidad</div>
      <h2 class="ac_sec_tit">Qué opinan <span class="ac_grad">los usuarios</span></h2>
      <p class="ac_sec_sub">Testimonios reales sobre cómo ${app} ha facilitado sus vidas</p>
    </div>
    <div class="ac_test_grid">
      
        <div class="ac_test_card wi_fadeUp">
          <div class="ac_test_stars"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></div>
          <p class="ac_test_txt">"Antes solía olvidarme de los cumpleaños importantes o felicitaba un día después. CumpleWii me notifica exactamente con tiempo para preparar un regalo. Me encanta el diseño dorado que tiene."</p>
          <div class="ac_test_autor">
            <span class="ac_test_avatar">🎁</span>
            <div><strong>Claudia M.</strong><span>Usuaria de CumpleWii</span></div>
          </div>
        </div>
        <div class="ac_test_card wi_fadeUp">
          <div class="ac_test_stars"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></div>
          <p class="ac_test_txt">"La función de notas es espectacular. Puedo apuntar si alguien es intolerante a algo o si mencionó un perfume que le gustaba meses atrás, ¡y al llegar su día tengo el regalo perfecto anotado!"</p>
          <div class="ac_test_autor">
            <span class="ac_test_avatar">✨</span>
            <div><strong>Fernando T.</strong><span>Planificador Familiar</span></div>
          </div>
        </div>
        <div class="ac_test_card wi_fadeUp">
          <div class="ac_test_stars"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></div>
          <p class="ac_test_txt">"Me encantan los artículos cortos del blog de ideas dentro de la app. A veces no sé qué regalar a compañeros de trabajo, y la app siempre me salva. ¡Súper rápida además!"</p>
          <div class="ac_test_autor">
            <span class="ac_test_avatar">🎊</span>
            <div><strong>Sonia P.</strong><span>Usuaria Recurrente</span></div>
          </div>
        </div>
    </div>
  </section>

  <!-- ══ MÓDULOS ══ -->
  <section class="ac_sec">
    <div class="ac_sec_head">
      <div class="ac_sec_badge"><i class="fas fa-layer-group"></i> Secciones Informativas</div>
      <h2 class="ac_sec_tit">Explora más <span class="ac_grad">de ${app}</span></h2>
      <p class="ac_sec_sub">Conoce al detalle el funcionamiento, políticas y canales de contacto</p>
    </div>
    <div class="ac_modulos_grid">
      
        <a href="/descubre" class="ac_modulo_card wi_fadeUp nv_item" data-page="descubre" style="--mc:#0EBEFF">
          <div class="ac_modulo_ico"><i class="fas fa-compass"></i></div>
          <div class="ac_modulo_info">
            <strong>Descubre Funciones</strong>
            <span>Características Bento de la app</span>
          </div>
          <div class="ac_modulo_arr"><i class="fas fa-arrow-right"></i></div>
        </a>
        <a href="/privacidad" class="ac_modulo_card wi_fadeUp nv_item" data-page="privacidad" style="--mc:#FF5C69">
          <div class="ac_modulo_ico"><i class="fas fa-user-lock"></i></div>
          <div class="ac_modulo_info">
            <strong>Privacidad</strong>
            <span>Uso de datos transparente</span>
          </div>
          <div class="ac_modulo_arr"><i class="fas fa-arrow-right"></i></div>
        </a>
        <a href="/contacto" class="ac_modulo_card wi_fadeUp nv_item" data-page="contacto" style="--mc:#29C72E">
          <div class="ac_modulo_ico"><i class="fas fa-headset"></i></div>
          <div class="ac_modulo_info">
            <strong>Soporte e Incidencias</strong>
            <span>Reportar fallos y contacto</span>
          </div>
          <div class="ac_modulo_arr"><i class="fas fa-arrow-right"></i></div>
        </a>
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

// ============================================================
// ⚡ INIT
// ============================================================
export const init = () => {
  // Animación de entrada para los elementos wi_fadeUp
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.wi_fadeUp').forEach(el => {
    observer.observe(el);
  });

  // Compartir
  onDoc('click', '#ac_compartir', function (e) {
    const url = window.location.origin;
    if (navigator.share) {
      navigator.share({ title: app, text: `🎉 Organiza tus cumpleaños y celebraciones de forma veloz, segura y premium con ${app}. ¡Pruébalo!`, url }).catch(() => {});
    } else {
      wicopy(url, this, '¡Link copiado!');
    }
  });

  // Interceptar botones internos SPA
  onDoc('click', '.nv_item', function (e) {
    const href = this.getAttribute('href');
    if (href && href.startsWith('/')) {
      e.preventDefault();
      import('../../rutas.js').then(m => m.rutas.navigate(href));
    }
  });

  // Tooltips
  if (window.wiInitTips) window.wiInitTips();

  console.log(`🛡️ ${app} Acerca actualizado`);
  window.__WIREADY__ = true;
};

export const cleanup = () => {
  offDoc();
};
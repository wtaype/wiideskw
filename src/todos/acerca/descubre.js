import './descubre.css';
import { app } from '../../wii.js';
import { showi } from '../../widev.js';
import { rutas } from '../../rutas.js';

export const render = () => `
<div class="dc_wrap">
  <div class="dc_hero" data-showi="80">
    <div class="dc_badge"><i class="fas fa-compass"></i> Descubre ${app}</div>
    <h1 class="dc_title">Tecnología y Cariño<br><span class="dc_grad">Siguiente Generación</span></h1>
    <p class="dc_desc">Explora la funcionalidad avanzada de CumpleWii. Una herramienta premium, fluida y privada, diseñada para celebrar los momentos que importan.</p>
  </div>
  
  <div class="dc_bento" data-showi="60">
    <!-- Carta 1: Inicio Inteligente (Grande) -->
    <div class="dc_card dc_c_large">
      <div class="dc_card_body">
        <div class="dc_icon" style="color:#0EBEFF; background:rgba(14,190,255,0.1);"><i class="fas fa-compass"></i></div>
        <div class="dc_info">
          <h3>Inicio Inteligente</h3>
          <p>Mira los cumpleaños de hoy, los próximos eventos de la semana y un resumen rápido sin perder tiempo. La app calcula los días faltantes para que organices todo con antelación.</p>
        </div>
      </div>
      <div class="dc_visual">
        <div class="dc_browser_mockup">
          <div class="dc_bm_header">
            <div class="dc_bm_dots"><span></span><span></span><span></span></div>
            <div class="dc_bm_url"><i class="fas fa-lock"></i> cumplewii.web.app</div>
          </div>
          <div class="dc_bm_body" style="background:#FFF9C4; display:flex; align-items:center; justify-content:center; color:#FFB300; font-size:4rem;">
            <i class="fas fa-cake-candles"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Carta 2: Cumples organizados -->
    <div class="dc_card">
      <div class="dc_icon" style="color:#29C72E; background:rgba(41,199,46,0.1);"><i class="fas fa-users"></i></div>
      <div class="dc_info">
        <h3>Cumples organizados</h3>
        <p>Guarda nombre, relación, fecha exacta, notas privadas, foto y color de tarjeta para tener todos los detalles importantes a la mano.</p>
      </div>
      <div class="dc_visual">
        <div class="dc_stats_box" style="gap:10px;">
          <div class="dc_stat_row"><span>Mamá:</span> <strong>20 Jun</strong></div>
          <div class="dc_stat_row"><span>Mejor Amigo:</span> <strong style="color:var(--mco);">14 Ago</strong></div>
          <div class="dc_stat_row"><span>Sobrino:</span> <strong style="color:#FF5C69;">02 Dic</strong></div>
        </div>
      </div>
    </div>

    <!-- Carta 3: Privacidad primero -->
    <div class="dc_card">
      <div class="dc_icon" style="color:#FF5C69; background:rgba(255,92,105,0.1);"><i class="fas fa-heart"></i></div>
      <div class="dc_info">
        <h3>Privacidad primero</h3>
        <p>Tu cuenta, tus fechas y tus notas se guardan con transparencia total y sincronización cifrada mediante Firebase.</p>
      </div>
      <div class="dc_visual" style="display:flex; justify-content:center; align-items:center; height:100%;">
        <div style="font-size: 5rem; color: #FF5C69; opacity: 0.8;"><i class="fas fa-shield-heart"></i></div>
      </div>
    </div>

    <!-- Carta 4: Calendario por meses (Grande) -->
    <div class="dc_card dc_c_large">
      <div class="dc_card_body">
        <div class="dc_icon" style="color:#7000FF; background:rgba(112,0,255,0.1);"><i class="fas fa-book-open"></i></div>
        <div class="dc_info">
          <h3>Calendario por meses</h3>
          <p>Revisa cada mes en una vista de calendario interactivo. Toca un día marcado con cumpleaños y mira instantáneamente los detalles de quién cumple sin cargar nuevas páginas.</p>
        </div>
      </div>
      <div class="dc_visual" style="display:flex; justify-content:center; align-items:center; padding:20px;">
        <div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:10px; width:100%; color:#ccc;">
          <div style="text-align:center;">L</div><div style="text-align:center;">M</div><div style="text-align:center;">M</div><div style="text-align:center;">J</div><div style="text-align:center;">V</div><div style="text-align:center;">S</div><div style="text-align:center;">D</div>
          <div style="text-align:center; padding:10px; background:#f0f0f0; border-radius:50%;">1</div>
          <div style="text-align:center; padding:10px; background:#f0f0f0; border-radius:50%;">2</div>
          <div style="text-align:center; padding:10px; background:#FFD54F; color:#fff; border-radius:50%; box-shadow:0 0 10px rgba(255,213,79,0.5);">3</div>
          <div style="text-align:center; padding:10px; background:#f0f0f0; border-radius:50%;">4</div>
        </div>
      </div>
    </div>

    <!-- Carta 5: Música de Cumpleaños -->
    <div class="dc_card">
      <div class="dc_icon" style="color:#FFDA34; background:rgba(255,218,52,0.1);"><i class="fas fa-headphones"></i></div>
      <div class="dc_info">
        <h3>Música de cumpleaños</h3>
        <p>Reproduce canciones felices, marca favoritas y acompaña cada celebración con un reproductor de audio integrado.</p>
      </div>
      <div class="dc_visual" style="display:flex; justify-content:center; align-items:center;">
        <div style="font-size: 4rem; color: #FFDA34;"><i class="fas fa-music"></i></div>
      </div>
    </div>

    <!-- Carta 6: Blog de Ideas (Grande) -->
    <div class="dc_card dc_c_large">
      <div class="dc_card_body">
        <div class="dc_icon" style="color:#FF8F00; background:rgba(255,143,0,0.1);"><i class="fas fa-bullhorn"></i></div>
        <div class="dc_info">
          <h3>Blog de Ideas</h3>
          <p>Encuentra inspiración para regalos perfectos, mensajes de felicitación, ideas de decoración y detalles creativos para sorprender a tu gente especial.</p>
        </div>
      </div>
      <div class="dc_visual" style="display:flex; justify-content:center; align-items:center;">
         <div style="font-size: 5rem; color: #FF8F00; opacity:0.8;"><i class="fas fa-lightbulb"></i></div>
      </div>
    </div>
  </div>

  <div class="dc_cta" data-showi="80">
    <a href="/inicio" class="dc_cta_btn nv_item" data-page="inicio"><i class="fas fa-arrow-right"></i> Ir al Inicio de la App</a>
  </div>
</div>
`;

const handleNavigation = (e) => {
  const item = e.target.closest('.nv_item');
  if (item) {
    const href = item.getAttribute('href');
    if (href && href.startsWith('/')) {
      e.preventDefault();
      rutas.navigate(href);
    }
  }
};

export const init = () => {
  showi('[data-showi]');

  document.addEventListener('click', handleNavigation);

  console.log(`🧭 ${app} Descubre cargado`);
  window.__WIREADY__ = true;
};

export const cleanup = () => {
  document.removeEventListener('click', handleNavigation);
};
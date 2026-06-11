// usuarios/smile/hero.js — Componente de cabecera de bienvenida
export const render = (usuarioNombre) => {
  const nombreParaMostrar = usuarioNombre || 'Usuario';
  return `
    <!-- HERO BANNER -->
    <header class="wd_hero">
      <div class="wd_hero_glow"></div>
      <div class="wd_hero_content">
        <div class="wd_welcome">
          <h1>¡Hola, <span>${nombreParaMostrar}</span>!</h1>
          <p>Bienvenido al Centro de Control de Wiidesk. Gestiona tus equipos locales y remotos.</p>
        </div>
        <div>
          <span class="wd_badge wd_badge_active"><i class="fa-solid fa-shield-halved"></i> Host Activo</span>
        </div>
      </div>
    </header>
  `;
};

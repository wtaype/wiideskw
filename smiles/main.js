import { wiSmart } from './widev.js';
import { rutas } from './rutas.js';

// ── RUTAS ──────────────────────────────────────────────────────────────────
rutas.init();

// ── HEADER + FOOTER lazy ───────────────────────────────────────────────────
import('./header.js');
import('./footer.js');

// ── FONTS lazy (carga tras primera interacción del usuario) ────────────────
wiSmart({
  css: [
    'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap',
  ],
});

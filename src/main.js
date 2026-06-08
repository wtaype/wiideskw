import { getls, wiSmart } from './widev.js';
import { rutas } from './rutas.js';

// ── RUTAS PROFESIONAL DE ACUERDO A ROLES  ─────────────────────────────
rutas.registerAll(() => getls('wiSmile')?.rol);

rutas.register('/', (isPre = false) => {
  const u = getls('wiSmile');
  if (u && !isPre) setTimeout(() => rutas.navigate(({usuario: '/smile', editor: '/nuevo', gestor: '/gestor', admin: '/admin'})[u.rol]||'/smile'), 0);
  return rutas.inicio();
});
rutas.init();
import('./header.js');
import('./footer.js')

wiSmart({
css: [
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap',
  'https://fonts.googleapis.com/css2?family=Rubik:wght@300..900&display=swap',
],
});

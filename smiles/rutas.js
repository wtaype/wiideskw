import { wiFade, wiPath } from './widev.js';
import * as inicioMod from './views/inicio.js';

const RUTAS = [
  { path: '/inicio',     page: 'inicio'     },
  { path: '/transmitir', page: 'transmitir' },
  { path: '/config',     page: 'config'     },
  { path: '/acerca',     page: 'acerca'     },
];

// Vite glob - mapea todos los módulos de vistas en build time
const MODS = import.meta.glob('./views/*.js');

class WiRutas {
  constructor() {
    this.cache = { '/inicio': inicioMod };
    this.modActual = null;
    this.cargand = false;
    this.HOME = 'inicio';
    this.main = '#wimain';
    this.pathActual = null;
  }

  async prefetch(ruta) {
    const norm = wiPath.limpiar(ruta) === '/' ? '/inicio' : wiPath.limpiar(ruta);
    if (this.cache[norm]) return;
    const r = RUTAS.find(r => r.path === norm);
    if (!r) return;
    try {
      this.cache[norm] = await MODS[`./views/${r.page}.js`]();
    } catch { /* silent */ }
  }

  async navigate(ruta, historial = true) {
    if (this.cargand) return;
    this.cargand = true;
    const norm = wiPath.limpiar(ruta) === '/' ? '/inicio' : wiPath.limpiar(ruta);

    try {
      this.modActual?.cleanup?.();
      const r = RUTAS.find(r => r.path === norm);
      const page = r?.page ?? 'inicio';
      const mod = this.cache[norm] ?? await (MODS[`./views/${page}.js`] ?? MODS['./views/inicio.js'])();
      this.cache[norm] = mod;

      const html = await mod.render();
      this.marcarNav(norm);
      window.dispatchEvent(new CustomEvent('winavigate', { detail: { norm } }));
      await wiFade(this.main, html);
      mod.init?.();

      if (historial) wiPath.poner(norm === '/inicio' ? '/' : norm, document.title);
      this.pathActual = norm;
      this.modActual = mod;
    } catch (err) {
      console.error('[ruta]', err);
    } finally {
      this.cargand = false;
    }
  }

  marcarNav(norm) {
    const pag = norm.slice(1) || this.HOME;
    document.querySelectorAll('.nv_item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll(`.nv_item[data-page="${pag}"]`).forEach(el => el.classList.add('active'));
  }

  init() {
    this.marcarNav(wiPath.actual === '/' ? '/inicio' : wiPath.limpiar(wiPath.actual));

    document.addEventListener('click', (e) => {
      const item = e.target.closest('.nv_item[data-page]');
      if (!item) return;
      e.preventDefault();
      const pag = item.dataset.page;
      this.navigate(pag === this.HOME ? '/' : `/${pag}`);
    });

    document.addEventListener('mouseenter', (e) => {
      const item = e.target.closest('.nv_item[data-page]');
      if (!item) return;
      const pag = item.dataset.page;
      this.prefetch(pag === this.HOME ? '/' : `/${pag}`);
    }, true);

    window.addEventListener('popstate', (e) => {
      const ruta = e.state?.ruta || wiPath.actual;
      const norm = wiPath.limpiar(ruta) === '/' ? '/inicio' : wiPath.limpiar(ruta);
      if (norm === this.pathActual) return;
      this.navigate(ruta, false);
    });

    this.navigate(wiPath.actual, false);
  }
}

export const rutas = new WiRutas();

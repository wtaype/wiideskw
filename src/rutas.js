import { app, titulo, descri, keywii, linkweb } from './wii.js';
import { Notificacion, wiPath, wiFade } from './widev.js';
import * as inicioMod from './todos/inicio.js';

export const rolPage = { usuario: '/smile', editor: '/smile', gestor: '/gestor', admin: '/admin' };

const COMUN = [
  { href: '/acerca', ico: 'fa-circle-info', txt: 'Acerca' }
];

let svgg = ' <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>' 

export const NAV = {
  todos: {
    nvleft:  [
      { href: '/', ico: 'fa-house', txt: 'Bienvenido' },
      ...COMUN],
      nvright: [
      { isBtn: true, cls: 'loginpc', ico: '', txt: `${svgg} Continuar con Google` },
    ],
  },
  usuario: {
    nvleft: [
      { href: '/smile',     ico: 'fa-house',            txt: 'Dashboard' },
      { href: '/pc2pc',     ico: 'fa-laptop',           txt: 'PC a PC' },
      { href: '/pc2movil',  ico: 'fa-mobile-alt',       txt: 'PC a Móvil' },
      { href: '/pc2web',    ico: 'fa-globe',            txt: 'PC a Web' },
      { href: '/movil2pc',  ico: 'fa-mobile-alt',       txt: 'Móvil a PC' },
      { href: '/lab',   ico: 'fa-microscope',       txt: 'Lab Firestore' },
      { href: '/lab1',  ico: 'fa-microscope',       txt: 'Lab 1 RTDB' },
      ...COMUN,
    ],
    nvright: [
      { href: '/notas',     ico: 'fa-book-open',        txt: 'Notas' },
      { isPerfil: true }, { isSalir: true },
    ],
  },
  editor: {
    nvleft:  [],
    nvright: [],
  },
  gestor: {
    nvleft: [
      { href: '/gestor',     ico: 'fa-house',           txt: 'Dashboard'    },
      ...COMUN,
    ],
    nvright: [
      { isPerfil: true }, { isSalir: true },
    ],
  },
  admin: {
    nvleft: [
      { href: '/admin',    ico: 'fa-globe',   txt: 'Plataforma' },
      { href: '/usuarios', ico: 'fa-users',   txt: 'Usuarios'   },
      ...COMUN,
    ],
    nvright: [
      { href: '/notas',    ico: 'fa-book-open', txt: 'Notas'      },
      { isPerfil: true }, { isSalir: true },
    ],
  },
  verificar: {
    nvleft:  [],
    nvright: [],
  },
};

export const RUTAS = [
  { path: '/inicio',   area: 'todos/' },
  { path: '/acerca',     area: 'todos/acerca/' },
  { path: '/descubre',   area: 'todos/acerca/' },
  { path: '/terminos',   area: 'todos/acerca/' },
  { path: '/cookies',    area: 'todos/acerca/' },
  { path: '/privacidad', area: 'todos/acerca/' },
  { path: '/feedback',   area: 'todos/acerca/' },
  { path: '/contacto',   area: 'todos/acerca/' },
  { path: '/lab',    area: 'usuarios/', roles: ['usuario','editor','gestor','admin'] },
  { path: '/lab1',   area: 'usuarios/', roles: ['usuario','editor','gestor','admin'] },
  { path: '/smile',    area: 'usuarios/', roles: ['usuario','editor','gestor','admin'] },
  { path: '/notas',    area: 'usuarios/', roles: ['usuario','editor','gestor','admin'] },
  { path: '/perfil',   area: 'usuarios/', roles: ['usuario','editor','gestor','admin'] },
  { path: '/mensajes', area: 'usuarios/', roles: ['usuario','editor','gestor','admin'] },
  { path: '/pc2pc',    area: 'usuarios/', roles: ['usuario','editor','gestor','admin'] },
  { path: '/pc2movil', area: 'usuarios/', roles: ['usuario','editor','gestor','admin'] },
  { path: '/pc2web',   area: 'usuarios/', roles: ['usuario','editor','gestor','admin'] },
  { path: '/movil2pc', area: 'usuarios/', roles: ['usuario','editor','gestor','admin'] },
  { path: '/gestor',   area: 'gestor/',  roles: ['gestor','admin'] },
  { path: '/admin',    area: 'admin/',   roles: ['admin']          },
  { path: '/usuarios', area: 'admin/',   roles: ['admin']          },
  { path: '/verificar',area: 'admin/verificar/', roles: ['admin']   },
];

const MODS = import.meta.glob([
  './{todos,usuarios,gestor,admin}/**/*.js',
  '!./todos/inicio.js'
]);
const rutasMod = (area, page) => MODS[`./${area}${page}.js`];

class WiRutas {
  constructor() {
    this.rutas     = {};
    this.cache     = { '/inicio': inicioMod };
    this.modActual = null;
    this.cargand   = false;
    this.HOME      = 'inicio';
    this.main      = '#wimain';
    this.pathActual = null;
    this.isFirstLoad = true;
  }

  register(path, fn) { this.rutas[path] = fn; }
  inicio() { return Promise.resolve(inicioMod); }

  registerAll(getRol) {
    const pub = {}, priv = {};

    RUTAS.forEach(({ path, area, roles = null, mod }) => {
      if (path === '/inicio') {
        pub[path] = () => this.inicio();
        return;
      }
      const page = mod ?? path.split('/').pop();
      const imp  = rutasMod(area, page);
      if (!imp) { console.warn(`[ruta] no encontrado: ${area}${page}.js`); return; }
      roles === null ? (pub[path] = imp) : (priv[path] ??= []).push({ roles, imp });
    });

    const noAuth = () => Promise.resolve({
      render: () => '',
      init:   () => setTimeout(() => this.navigate('/'), 0),
    });

    new Set([...Object.keys(pub), ...Object.keys(priv)]).forEach(path => {
      const pubImp   = pub[path];
      const privList = priv[path] || [];
      const resolve  = () => { const rol = getRol?.() || null; return privList.find(e => e.roles.includes(rol)); };

      if (!privList.length)  return this.register(path, pubImp);
      if (!pubImp)           return this.register(path, () => { const e = resolve(); return e ? e.imp() : noAuth(); });
      this.register(path, () => { const e = resolve(); return e ? e.imp() : pubImp(); });
    });
  }

  async prefetch(ruta) {
    const norm = wiPath.limpiar(ruta) === '/' ? `/${this.HOME}` : wiPath.limpiar(ruta);
    if (this.cache[norm] || !this.rutas[norm]) return;
    try {
      // Guardar la promesa inmediatamente para evitar importaciones duplicadas concurrentes
      this.cache[norm] = this.rutas[norm]();
      const mod = await this.cache[norm];
      this.cache[norm] = mod; // Guardar el módulo ya resuelto
      console.log(`⚡ Listo ${norm.replace('/', '')}`);
    } catch (err) {
      delete this.cache[norm]; // Limpiar la caché si falla para permitir reintentos
      console.warn('[ruta] prefetch falló:', norm, err);
    }
  }

  async navigate(ruta, historial = true) {
    if (this.cargand) return;
    this.cargand = true;
    const norm = wiPath.limpiar(ruta) === '/' ? `/${this.HOME}` : wiPath.limpiar(ruta);

    if (norm === '/login') {
      this.cargand = false;
      return this.navigate('/', true);
    }

    if (['/admin', '/usuarios', '/paginas'].includes(norm)) {
      const { getls } = await import('./widev.js');
      const wi = getls('wiSmile'), go = r => (this.cargand = false, this.navigate(r, true));
      const dest = !wi || wi.rol !== 'admin' ? '/' : wi.estado !== 'activo' ? '/registrado' : !sessionStorage.getItem('vault_unlocked') ? '/verificar' : null;
      if (dest) return go(dest);
    }

    try {
      this.modActual?.cleanup?.();
      const cargar  = this.rutas[norm] ?? rutasMod('todos/', '404');
      const mod = this.cache[norm] ?? await cargar();

      const [html] = await Promise.all([mod.render?.()]);
      
      document.body.classList.remove('is-public-profile');
      this.marcarNav(norm);
      window.dispatchEvent(new CustomEvent('winavigate', { detail: { norm } }));

      const mainEl = document.querySelector(this.main);
      const esHydration = this.isFirstLoad
        && mainEl
        && mainEl.children.length > 0
        && !window.__WIREADY__
        && norm === `/${this.HOME}`;
        
      if (esHydration) {
        this.isFirstLoad = false;
      } else {
        await wiFade(this.main, html);
      }
      this.isFirstLoad = false;

      window.scrollTo(0, 0);
      mod.init?.();

      if (historial) wiPath.poner(norm === `/${this.HOME}` ? '/' : norm, document.title);
      this.pathActual = norm;
      this.modActual = mod;
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) return location.reload();
      Notificacion('Error en la ruta');
      console.error('[ruta] navigate:', err);
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
    this.marcarNav(wiPath.actual === '/' ? `/${this.HOME}` : wiPath.limpiar(wiPath.actual));

    document.addEventListener('click', (e) => {
      const item = e.target.closest('.nv_item');
      if (item) {
        e.preventDefault();
        const pag = item.dataset.page;
        this.navigate(pag === this.HOME ? '/' : `/${pag}`);
      }
    });

    const prefetchHandler = (e) => {
      const item = e.target.closest('.nv_item[data-page]');
      if (item) {
        const pag = item.dataset.page;
        this.prefetch(pag === this.HOME ? '/' : `/${pag}`);
      }
    };
    document.addEventListener('mouseover', prefetchHandler, { passive: true });
    document.addEventListener('touchstart', prefetchHandler, { passive: true });

    window.addEventListener('popstate', (e) => {
      const ruta = e.state?.ruta || wiPath.actual;
      const norm = wiPath.limpiar(ruta) === '/' ? `/${this.HOME}` : wiPath.limpiar(ruta);
      if (norm === this.pathActual) return;
      this.navigate(ruta, false);
    });
    this.navigate(wiPath.actual, false);
  }
}

export const rutas = new WiRutas();

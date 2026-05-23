import { app, icon } from './wii.js';
import { rutas } from './rutas.js';

const NAV = [
  { href: '/inicio',     page: 'inicio',     ico: 'fa-house',       txt: 'Inicio'        },
  { href: '/transmitir', page: 'transmitir', ico: 'fa-desktop',     txt: 'Transmitir'    },
  { href: '/config',     page: 'config',     ico: 'fa-sliders',     txt: 'Configuración' },
  { href: '/acerca',     page: 'acerca',     ico: 'fa-circle-info', txt: 'Acerca'        },
];

const LOGO = `<a href="/"><i class="fa-solid ${icon}"></i> ${app}</a>`;

const buildNav = (items) => items.map(i =>
  `<a href="${i.href}" class="nv_item" data-page="${i.page}"><i class="fas ${i.ico}"></i> <span>${i.txt}</span></a>`
).join('');

const renderHeader = () => {
  const nav = buildNav(NAV);
  const wilogo = document.querySelector('.wilogo');
  if (wilogo) wilogo.innerHTML = LOGO;
  const winav = document.querySelector('.winav');
  if (winav) winav.innerHTML = nav;
  const nv_right = document.querySelector('.nv_right');
  if (nv_right) nv_right.innerHTML = `
    <div class="wii_status_dot" id="srv_dot" title="Servidor apagado" style="
      width:10px;height:10px;border-radius:50%;background:var(--tx3);
      box-shadow:0 0 0 2px var(--bg);margin-right:.5rem;transition:all .4s;
      display:inline-block;vertical-align:middle;
    "></div>
    <span id="srv_status_txt" style="font-size:var(--fz_s4);color:var(--tx3);margin-right:.5rem">Apagado</span>
  `;
  const movil_nav = document.querySelector('.movil_nav');
  if (movil_nav) movil_nav.innerHTML = nav;
};

// Mobile drawer
if (!document.querySelector('.movil_drawer')) {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="movil_overlay"></div>
    <nav class="movil_drawer" role="navigation" aria-label="Menú">
      <button class="movil_close" aria-label="Cerrar"><i class="fas fa-times"></i></button>
      <div class="movil_logo">${LOGO}</div>
      <div class="movil_nav"></div>
    </nav>`);
}

document.addEventListener('click', e => {
  if (e.target.closest('.wimenu')) document.body.classList.add('movil_open');
  if (e.target.closest('.movil_close, .movil_overlay')) document.body.classList.remove('movil_open');
});
document.addEventListener('click', e => {
  if (e.target.closest('.movil_nav .nv_item')) document.body.classList.remove('movil_open');
});

renderHeader();
window.addEventListener('winavigate', () => renderHeader());

// Export function to update server status dot from other modules
export const setServerStatus = (online) => {
  const dot = document.getElementById('srv_dot');
  const txt = document.getElementById('srv_status_txt');
  if (dot) {
    dot.style.background = online ? 'var(--success)' : 'var(--tx3)';
    dot.style.boxShadow = online ? '0 0 0 3px rgba(60,215,65,.25), 0 0 8px var(--success)' : '0 0 0 2px var(--bg)';
  }
  if (txt) {
    txt.textContent = online ? 'Activo' : 'Apagado';
    txt.style.color = online ? 'var(--success)' : 'var(--tx3)';
  }
};
window.setServerStatus = setServerStatus;

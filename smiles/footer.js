import { app, version, by, linkme, lanzamiento } from './wii.js';

const ahora = new Date().getFullYear();
const html = `
  <footer class="foo">
    <div class="foo_inner">
      <div class="foo_left">
        <div class="foo_brand">
          <span class="foo_app">${app}</span>
          <span class="foo_ver">${version}</span>
        </div>
        <div class="foo_links">
          <a href="/acerca"     class="foo_link nv_item" data-page="acerca"    ><i class="fas fa-circle-info"></i> Acerca</a>
          <a href="/config"     class="foo_link nv_item" data-page="config"    ><i class="fas fa-sliders"></i> Config</a>
          <a href="/transmitir" class="foo_link nv_item" data-page="transmitir"><i class="fas fa-desktop"></i> Transmitir</a>
        </div>
      </div>
      <div class="foo_right">
        <span>Creado con <i class="fas fa-heart" style="color:var(--mco)"></i> por
          <a href="${linkme}" target="_blank"><strong>${by}</strong></a>
          ${lanzamiento}${ahora > lanzamiento ? ' — ' + ahora : ''}
        </span>
      </div>
    </div>
  </footer>`;

if (!document.querySelector('.foo')) {
  document.body.insertAdjacentHTML('beforeend', html);
}

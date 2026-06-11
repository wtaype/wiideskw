// usuarios/smile.js — Controlador y Orquestador Principal del Dashboard
import './smile.css';
import { getls } from '../widev.js';
import { app } from '../wii.js';
import { rutas } from '../rutas.js';
import * as hero from './smile/hero.js';
import * as local from './smile/local.js';
import * as remotos from './smile/remotos.js';

const obtenerUsuario = () => getls('wiSmile') || null;

export const render = () => {
  const user = obtenerUsuario();
  if (!user) {
    setTimeout(() => rutas.navigate('/login'), 0);
    return '';
  }

  const primerNombre = user.nombre || user.usuario || 'Usuario';

  return `
    <div class="wd_dash">
      
      <!-- HERO BANNER (Cabecera de bienvenida) -->
      ${hero.render(primerNombre)}

      <!-- GRID PRINCIPAL DE PANELES -->
      <div class="wd_grid">
        
        <!-- COLUMNA IZQUIERDA: ESTE EQUIPO (Host Local) -->
        ${local.render()}

        <!-- COLUMNA DERECHA: EQUIPOS REMOTOS -->
        ${remotos.render()}

      </div>

    </div>
  `;
};

export const init = async () => {
  const user = obtenerUsuario();
  if (!user) return setTimeout(() => rutas.navigate('/login'), 100);

  const uid = user.userId || user.uid;

  // Inicializar componentes secundarios
  await local.init(uid, user);
  await remotos.init(uid, user);

  console.log(`🏜️ Centro de Control Modular de ${app} cargado.`);
  window.__WIREADY__ = true;
};

export const cleanup = () => {
  local.cleanup();
  remotos.cleanup();
};

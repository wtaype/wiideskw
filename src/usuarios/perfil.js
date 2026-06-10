import './perfil.css';
import { db } from '../firebase.js';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getls, savels, wiDate } from '../widev.js';
import { rutas } from '../rutas.js';
import { linkweb } from '../wii.js';

const wi = () => getls('wiSmile') || {};

const abrirNavegador = (url) => {
  const hasGlobalTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;
  const esTauri = hasGlobalTauri || (typeof window !== 'undefined' && (
    window.__TAURI_INTERNALS__ !== undefined || 
    navigator.userAgent.includes('WebView2') ||
    window.origin?.includes("tauri") || 
    location.protocol === 'tauri:'
  ));

  if (esTauri && hasGlobalTauri) {
    if (window.__TAURI__.core && typeof window.__TAURI__.core.invoke === 'function') {
      window.__TAURI__.core.invoke('abrir_navegador', { url }).catch((err) => {
        console.error(err);
        window.open(url, '_blank');
      });
      return;
    } else if (typeof window.__TAURI__.invoke === 'function') {
      window.__TAURI__.invoke('abrir_navegador', { url }).catch((err) => {
        console.error(err);
        window.open(url, '_blank');
      });
      return;
    }
  }
  window.open(url, '_blank');
};

export const render = () => {
  const u = wi();
  if (!u.email) { location.replace('/'); return ''; }
  
  const nombre    = u.nombre    || '';
  const apellidos = u.apellidos || '';
  const usuario   = u.usuario   || '';
  const email     = u.email     || '';
  const rol       = u.rol       || 'smile';
  const plan      = u.plan      || 'free';
  const estado    = u.estado    || 'activo';
  const avatar    = u.avatar    || '';
  const fechaNacimiento = u.fechaNacimiento || '';
  const pais      = u.pais      || '';
  const genero    = u.genero    || '';
  const gustos    = u.gustos    || '';
  const bio       = u.bio       || '';
  const tsCreacion = u.creacion || u.creado;
  const creado    = tsCreacion ? wiDate(null).get(tsCreacion, 'local') : 'Desconocido';

  const tsActividad = u.ultActividad;
  const actividad = tsActividad ? wiDate(null).get(tsActividad, 'local') : 'Recién activo';
  const activo = u.activo !== false;
  const estadoColor = estado === 'activo' ? 'var(--success)' : 'var(--error)';

  let fechaNacimientoStr = '';
  if (fechaNacimiento) {
    try {
      const dateObj = fechaNacimiento.toDate ? fechaNacimiento.toDate() : new Date(fechaNacimiento);
      if (!isNaN(dateObj.getTime())) {
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        fechaNacimientoStr = `${yyyy}-${mm}-${dd}`;
      }
    } catch (e) {
      console.warn('Error formatting birthdate:', e);
    }
  }

  const defaultAvatar = '/smile.avif';
  const imagen = avatar || defaultAvatar;

  return `
  <div class="prf_wrap">

    <div class="prf_hero">
      <div class="prf_av_wrap">
        <img src="${imagen}" alt="${nombre}" class="prf_av" onerror="this.src='/smile.avif'">
        <div class="prf_av_ring"></div>
      </div>
      <div class="prf_hero_info">
        <h1 class="prf_fullname">${nombre} ${apellidos}</h1>
        <p class="prf_username"><i class="fas fa-at"></i> ${usuario}</p>
        <span class="prf_rol_chip"><i class="fas fa-crown"></i> Plan ${plan.toUpperCase()}</span>
      </div>
    </div>

    <div class="prf_banner_card">
      <div class="prf_banner_icon"><i class="fas fa-shield-halved"></i></div>
      <div class="prf_banner_body">
        <h3>Edición de Perfil en la Web</h3>
        <p>Para garantizar la seguridad de tus datos y credenciales, la edición del perfil y el cambio de contraseña se gestionan de forma segura desde nuestra consola web.</p>
      </div>
      <button id="btn_ir_web" class="prf_btn_web"><i class="fas fa-external-link-alt"></i> Ir a la consola web</button>
    </div>

    <div class="prf_grid">

      <div class="prf_card">
        <h2 class="prf_card_tit"><i class="fas fa-address-card"></i> Datos personales</h2>
        
        <div class="prf_row">
          <span class="prf_lbl"><i class="fas fa-user"></i> Nombres</span>
          <span class="prf_val">${nombre}</span>
        </div>
        <div class="prf_row">
          <span class="prf_lbl"><i class="fas fa-user"></i> Apellidos</span>
          <span class="prf_val">${apellidos}</span>
        </div>
        <div class="prf_row">
          <span class="prf_lbl"><i class="fas fa-calendar-day"></i> Nacimiento</span>
          <span class="prf_val">${fechaNacimientoStr || 'No especificada'}</span>
        </div>
        <div class="prf_row">
          <span class="prf_lbl"><i class="fas fa-venus-mars"></i> Género</span>
          <span class="prf_val">${genero || 'No especificado'}</span>
        </div>
        <div class="prf_row">
          <span class="prf_lbl"><i class="fas fa-map-marker-alt"></i> País</span>
          <span class="prf_val">${pais || 'No especificado'}</span>
        </div>
        <div class="prf_row">
          <span class="prf_lbl"><i class="fas fa-heart"></i> Intereses</span>
          <span class="prf_val">${gustos || 'No especificados'}</span>
        </div>
        <div class="prf_row" style="flex-direction: column; align-items: flex-start; gap: 0.8vh;">
          <span class="prf_lbl"><i class="fas fa-comment-alt"></i> Biografía</span>
          <span class="prf_val" style="text-align: left; white-space: normal; overflow: visible; text-overflow: clip; width: 100%; font-weight: normal; color: var(--tx2); line-height: 1.4; padding-left: 2.5vh;">${bio || 'Sin biografía.'}</span>
        </div>
      </div>

      <div class="prf_col_right">
        <div class="prf_card">
          <h2 class="prf_card_tit"><i class="fas fa-info-circle"></i> Datos de cuenta</h2>
          <div class="prf_row">
            <span class="prf_lbl"><i class="fas fa-envelope"></i> Email</span>
            <span class="prf_val em">${email}</span>
          </div>
          <div class="prf_row">
            <span class="prf_lbl"><i class="fas fa-crown"></i> Plan</span>
            <span class="prf_val" style="color:var(--mco); text-transform:uppercase;">${plan}</span>
          </div>
          <div class="prf_row">
            <span class="prf_lbl"><i class="fas fa-signal"></i> Estado</span>
            <span class="prf_val" style="color:${estadoColor}">${estado}</span>
          </div>
          <div class="prf_row">
            <span class="prf_lbl"><i class="fas fa-toggle-on"></i> Activo</span>
            <span class="prf_val" style="color:${activo ? 'var(--success)' : 'var(--error)'}; font-weight: bold;">${activo ? 'Sí' : 'No'}</span>
          </div>
          <div class="prf_row">
            <span class="prf_lbl"><i class="fas fa-calendar-alt"></i> Registro</span>
            <span class="prf_val">${creado}</span>
          </div>
          <div class="prf_row">
            <span class="prf_lbl"><i class="fas fa-history"></i> Actividad</span>
            <span class="prf_val">${actividad}</span>
          </div>
          <div class="prf_row">
            <span class="prf_lbl"><i class="fas fa-user-tag"></i> Rol</span>
            <span class="prf_val" style="text-transform:capitalize;">${rol}</span>
          </div>
        </div>
      </div>

    </div>
  </div>`;
};

let docListeners = [];
const onDoc = (type, selector, handler) => {
  const wrapper = (e) => {
    const target = e.target.closest(selector);
    if (target) {
      handler.call(target, e);
    }
  };
  document.addEventListener(type, wrapper);
  docListeners.push({ type, wrapper });
};

export const init = async () => {
  cleanup();

  const uLocal = wi();
  if (!uLocal.email) return rutas.navigate('/');

  // Sincronizar datos con Firestore al cargar para tener lo último
  try {
    const uSnap = await getDoc(doc(db, 'smiles', uLocal.usuario));
    if (uSnap.exists()) {
      const d = uSnap.data();
      const cleanData = { ...d };

      if (cleanData.fechaNacimiento) {
        try {
          const dateObj = cleanData.fechaNacimiento.toDate ? cleanData.fechaNacimiento.toDate() : new Date(cleanData.fechaNacimiento);
          cleanData.fechaNacimiento = !isNaN(dateObj.getTime()) ? dateObj.toISOString() : '';
        } catch { cleanData.fechaNacimiento = ''; }
      }
      if (cleanData.creacion && cleanData.creacion.toDate) {
        cleanData.creacion = cleanData.creacion.toDate().getTime();
      }
      if (cleanData.creado && cleanData.creado.toDate) {
        cleanData.creado = cleanData.creado.toDate().getTime();
      }
      if (cleanData.ultActividad && cleanData.ultActividad.toDate) {
        cleanData.ultActividad = cleanData.ultActividad.toDate().getTime();
      } else if (cleanData.ultActividad) {
        cleanData.ultActividad = new Date(cleanData.ultActividad).getTime();
      }

      const uNuevo = { ...uLocal, ...cleanData };
      const actualJson = JSON.stringify(uLocal);
      const nuevoJson = JSON.stringify(uNuevo);
      
      if (actualJson !== nuevoJson) {
        savels('wiSmile', uNuevo, 24);
        rutas.navigate('/perfil', false);
        return;
      }
    }

    const regRef = doc(db, 'registros', uLocal.usuario);
    const regSnap = await getDoc(regRef);
    if (!regSnap.exists()) {
      await setDoc(regRef, {
        usuario: uLocal.usuario,
        email: uLocal.email,
        uid: uLocal.uid,
        creado: uLocal.creado || serverTimestamp()
      });
    }
  } catch (e) {
    console.warn('Sync Firestore perfil/registros error:', e);
  }
  
  onDoc('click', '#btn_ir_web', function () {
    abrirNavegador(`${linkweb}/perfil`);
  });
};

export const cleanup = () => {
  docListeners.forEach(({ type, wrapper }) => {
    document.removeEventListener(type, wrapper);
  });
  docListeners = [];
};

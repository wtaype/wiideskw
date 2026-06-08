import './perfil.css';
import { auth, db } from '../firebase.js';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getls, savels, Mensaje, wiTip, wiDate } from '../widev.js';
import { rutas } from '../rutas.js';

const wi = () => getls('wiSmile') || {};

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
  const tema      = (u.tema     || 'Por defecto').split('|')[0];
  const uid       = u.uid       || '';
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

    <div class="prf_grid">

      <div class="prf_card">
        <h2 class="prf_card_tit"><i class="fas fa-user-edit"></i> Editar perfil</h2>
        
        <div class="prf_form_2col">
          <div class="prf_form_grp">
            <label>Nombres</label>
            <input id="prf_nombre" value="${nombre}" placeholder="Tus nombres">
          </div>
          <div class="prf_form_grp">
            <label>Apellidos</label>
            <input id="prf_apellidos" value="${apellidos}" placeholder="Tus apellidos">
          </div>
        </div>
        
        <label>Enlace del Avatar (URL)</label>
        <input id="prf_avatar" value="${avatar}" placeholder="https://tu-foto.com/imagen.jpg">
        
        <div class="prf_form_2col">
          <div class="prf_form_grp">
            <label>Fecha de Nacimiento</label>
            <input type="date" id="prf_nacimiento" value="${fechaNacimientoStr}">
          </div>
          <div class="prf_form_grp">
            <label>Género</label>
            <select id="prf_genero">
              <option value="" disabled ${!genero ? 'selected' : ''}>Selecciona tu género</option>
              <option value="Masculino" ${genero === 'Masculino' ? 'selected' : ''}>Masculino</option>
              <option value="Femenino" ${genero === 'Femenino' ? 'selected' : ''}>Femenino</option>
              <option value="Otro" ${genero === 'Otro' ? 'selected' : ''}>Otro</option>
              <option value="Prefiero no decirlo" ${genero === 'Prefiero no decirlo' ? 'selected' : ''}>Prefiero no decirlo</option>
            </select>
          </div>
        </div>

        <div class="prf_form_2col">
          <div class="prf_form_grp">
            <label>País</label>
            <input id="prf_pais" value="${pais}" placeholder="Ej. Perú, México, España...">
          </div>
          <div class="prf_form_grp">
            <label>Gustos o intereses</label>
            <input id="prf_gustos" value="${gustos}" placeholder="Ej. Fútbol, leer, viajar...">
          </div>
        </div>
        
        <label>Biografía</label>
        <textarea id="prf_bio" rows="3" placeholder="Cuéntanos un poco sobre ti...">${bio}</textarea>

        <button id="prf_guardar" class="prf_btn"><i class="fas fa-save"></i> Guardar cambios</button>
      </div>

      <div class="prf_col_right">
        <div class="prf_card">
          <h2 class="prf_card_tit"><i class="fas fa-lock"></i> Actualizar contraseña</h2>
          <label>Nueva contraseña</label>
          <input type="password" id="prf_pass" placeholder="Ingresa tu nueva contraseña">
          <label>Confirmar contraseña</label>
          <input type="password" id="prf_pass_conf" placeholder="Confirma tu nueva contraseña">
          <button id="prf_guardar_pass" class="prf_btn"><i class="fas fa-key"></i> Actualizar contraseña</button>
        </div>

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

  // Sincronizar datos con Firestore al cargar para tener lo último y backfill
  try {
    const uSnap = await getDoc(doc(db, 'smiles', uLocal.usuario));
    if (uSnap.exists()) {
      const d = uSnap.data();
      const cleanData = { ...d };

      // Convertir a formatos JSON serializables idénticos a los del localStorage
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
  
  onDoc('click', '#prf_guardar', async function () {
    const u = wi();
    const nacimientoEl = document.getElementById('prf_nacimiento');
    const rawNacimiento = nacimientoEl ? nacimientoEl.value : '';
    let nacimientoTS = '';
    if (rawNacimiento) {
      const [yyyy, mm, dd] = rawNacimiento.split('-').map(Number);
      nacimientoTS = new Date(yyyy, mm - 1, dd, 12, 0, 0);
    }

    const nombreEl = document.getElementById('prf_nombre');
    const apellidosEl = document.getElementById('prf_apellidos');
    const avatarEl = document.getElementById('prf_avatar');
    const paisEl = document.getElementById('prf_pais');
    const generoEl = document.getElementById('prf_genero');
    const gustosEl = document.getElementById('prf_gustos');
    const bioEl = document.getElementById('prf_bio');

    const nombreVal = nombreEl ? nombreEl.value.trim() : '';
    const apellidosVal = apellidosEl ? apellidosEl.value.trim() : '';
    const avatarVal = avatarEl ? avatarEl.value.trim() : '';
    const paisVal = paisEl ? paisEl.value.trim() : '';
    const generoVal = generoEl ? generoEl.value : '';
    const gustosVal = gustosEl ? gustosEl.value.trim() : '';
    const bioVal = bioEl ? bioEl.value.trim() : '';

    const updates = {
      nombre: nombreVal,
      apellidos: apellidosVal,
      avatar: avatarVal,
      fechaNacimiento: nacimientoTS,
      pais: paisVal,
      genero: generoVal,
      gustos: gustosVal,
      bio: bioVal,
      ultActividad: serverTimestamp()
    };

    if (!updates.nombre) return wiTip(nombreEl, 'Ingresa tu nombre', 'error');

    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    try {
      await updateDoc(doc(db, 'smiles', u.usuario), updates);
      
      await setDoc(doc(db, 'registros', u.usuario), {
        usuario: u.usuario,
        email: u.email,
        uid: u.uid,
        actualizado: serverTimestamp()
      }, { merge: true });

      savels('wiSmile', { 
        ...u, 
        ...updates, 
        fechaNacimiento: nacimientoTS ? nacimientoTS.toISOString() : '',
        ultActividad: Date.now() 
      }, 24);
      
      const fullnameEl = document.querySelector('.prf_fullname');
      if (fullnameEl) fullnameEl.textContent = `${updates.nombre} ${updates.apellidos}`;
      
      const avEl = document.querySelector('.prf_av');
      if (avEl) {
        avEl.src = updates.avatar || '/smile.avif';
      }
      
      Mensaje('Perfil actualizado ✅', 'success');
      
      // Volver a cargar para actualizar todos los campos estáticos
      setTimeout(() => rutas.navigate('/perfil', false), 1000);
    } catch (e) {
      console.error(e);
      Mensaje('Error al guardar', 'error');
    } finally {
      this.disabled = false;
      this.innerHTML = '<i class="fas fa-save"></i> Guardar cambios';
    }
  });

  onDoc('click', '#prf_guardar_pass', async function () {
    const passEl = document.getElementById('prf_pass');
    const passConfEl = document.getElementById('prf_pass_conf');
    const p1 = passEl ? passEl.value : '';
    const p2 = passConfEl ? passConfEl.value : '';
    
    if (!p1 || p1.length < 6) return wiTip(passEl, 'Mínimo 6 caracteres', 'error');
    if (p1 !== p2) return wiTip(passConfEl, 'Las contraseñas no coinciden', 'error');
    
    if (!auth.currentUser) return Mensaje('Sesión expirada. Por favor recarga', 'error');
    
    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
    try {
      await updatePassword(auth.currentUser, p1);
      if (passEl) passEl.value = '';
      if (passConfEl) passConfEl.value = '';
      Mensaje('Contraseña actualizada correctamente ✅', 'success');
    } catch (e) {
      console.error(e);
      if (e.code === 'auth/requires-recent-login') {
        Mensaje('Por seguridad, cierra sesión y vuelve a ingresar para cambiar la contraseña.', 'error');
      } else {
        Mensaje('Error al actualizar contraseña', 'error');
      }
    } finally {
      this.disabled = false;
      this.innerHTML = '<i class="fas fa-key"></i> Actualizar contraseña';
    }
  });
};

export const cleanup = () => {
  docListeners.forEach(({ type, wrapper }) => {
    document.removeEventListener(type, wrapper);
  });
  docListeners = [];
};

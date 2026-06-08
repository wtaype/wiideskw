import './login.css';
import { auth, db } from '../firebase.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile,
         sendEmailVerification, sendPasswordResetEmail, signOut, GoogleAuthProvider, signInWithPopup, deleteUser } from 'firebase/auth';
import { setDoc, getDoc, getDocs, doc, collection, query, where, serverTimestamp, limit, writeBatch } from 'firebase/firestore';
import { wiTip, Mensaje, savels, getls, wiSpin, wiAuth, abrirModal, cerrarTodos, wiRateLimit } from '../widev.js';
import { rutas, rolPage } from '../rutas.js';
import { app, linkweb } from '../wii.js';

// ── CONFIG ───────────────────────────────────────────────────────────────────
let rolPublico = 'usuario';
let avatarMain = linkweb+'/smile.avif';
let _googleUser = null; // Variable privada para almacenar sesión temporal de Google SSO

const err = {
  'auth/email-already-in-use': 'Email ya registrado',
  'auth/weak-password': 'Contraseña débil (mín. 6)',
  'auth/invalid-credential': 'Contraseña incorrecta',
  'auth/invalid-email': 'Email no válido',
  'auth/missing-email': 'Usuario no registrado',
  'auth/too-many-requests': 'Demasiados intentos'
};

// ── SANITIZACIÓN ESTRICTA ──────────────────────────────────
const sanName  = v => v.replace(/[<>="'`;/\\$}{]/g, '').replace(/\s+/g, ' ').trim();
const sanEmail = v => v.replace(/[<>="'`;/\\$}{ ]/g, '').toLowerCase().trim();
const sanUser  = v => v.toLowerCase().replace(/[^a-z0-9_-]/g, '').trim();

const reglas = {
  regEmail:     [sanEmail, v => /^[\w.-]+@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(v) || 'Email inválido'],
  regUsuario:   [sanUser,  v => v.length >= 4 || 'Mínimo 4 caracteres'],
  regNombre:    [sanName,  v => v.length > 0 || 'Ingresa tu nombre'],
  regApellidos: [sanName,  v => v.length > 0 || 'Ingresa tus apellidos'],
  regPassword:  [v => v,   v => v.length >= 6 || 'Mínimo 6 caracteres'],
  regPassword1: [v => v,   v => {
    const pwd = document.getElementById('regPassword');
    return v === (pwd ? pwd.value : '') || 'No coinciden';
  }]
};

// ── HELPERS ──────────────────────────────────────────────────────────────────
const campo = (ico, tipo, id, place, ojo = false) =>
  `<div class="wilg_grupo"><i class="fas fa-${ico}"></i><input type="${tipo}" id="${id}" placeholder="${place}" autocomplete="off">${ojo ? '<i class="fas fa-eye wilg_ojo"></i>' : ''}</div>`;

// ── TEMPLATES ────────────────────────────────────────────────────────────────
const tpl = {
  login: () => `
    <div class="wilg_head">
      <div class="wilg_logo"><img src="/smile.avif" alt="${app}"></div>
      <h2>Bienvenido</h2><p>Inicia sesión en tu cuenta</p>
    </div>
    <button type="button" class="wilg_btn_google" id="btnGoogle"><img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google"> Continuar con Google</button>
    <div class="wilg_or"><span>o usa tu email</span></div>
    ${campo('envelope', 'text', 'email', 'Email o usuario')}
    ${campo('lock', 'password', 'password', 'Contraseña', true)}
    <button type="button" id="Login" class="wilg_btn inactivo" disabled><i class="fas fa-sign-in-alt"></i> Iniciar Sesión</button>
    <div class="wilg_links">
      <span class="wilg_rec"><i class="fas fa-key"></i> ¿Olvidaste tu contraseña?</span>
      <span class="wilg_reg">Crear cuenta <i class="fas fa-arrow-right"></i></span>
    </div>`,

  registrar: () => `
    <div class="wilg_head">
      <div class="wilg_logo"><img src="/smile.avif" alt="${app}"></div>
      <h2>Crear Cuenta</h2><p>Únete a la comunidad</p>
    </div>
    <button type="button" class="wilg_btn_google" id="btnGoogle"><img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google"> Continuar con Google</button>
    <div class="wilg_or"><span>o usa tu email</span></div>
    <div class="wilg_grid">
      ${[['envelope', 'email', 'regEmail', 'Email'], ['user', 'text', 'regUsuario', 'Usuario'],
          ['user-tie', 'text', 'regNombre', 'Nombre'], ['user-tie', 'text', 'regApellidos', 'Apellidos']]
        .map(([i, t, id, p]) => campo(i, t, id, p)).join('')}
      ${campo('lock', 'password', 'regPassword', 'Contraseña', true)}
      ${campo('lock', 'password', 'regPassword1', 'Confirmar contraseña', true)}
    </div>
    <div class="wilg_check">
      <label><input type="checkbox" id="regTerminos">
      <span>Acepto los <a href="/terminos" target="_blank">términos y condiciones</a></span></label>
    </div>
    <button type="button" id="Registrar" class="wilg_btn inactivo" disabled><i class="fas fa-user-plus"></i> Registrarme</button>
    <div class="wilg_links"><span class="wilg_log"><i class="fas fa-arrow-left"></i> Ya tengo cuenta</span></div>`,

  restablecer: () => `
    <div class="wilg_head">
      <div class="wilg_logo wilg_logo_sm"><img src="/smile.avif" alt="${app}"></div>
      <h2>Recuperar</h2><p>Te enviaremos un enlace a tu email</p>
    </div>
    ${campo('envelope', 'text', 'recEmail', 'Email o usuario')}
    <button type="button" id="Recuperar" class="wilg_btn"><i class="fas fa-paper-plane"></i> Enviar enlace</button>
    <div class="wilg_links"><span class="wilg_log"><i class="fas fa-arrow-left"></i> Volver</span></div>`,

  username: () => `
    <div class="wilg_head">
      <div class="wilg_logo"><img src="/smile.avif" alt="${app}"></div>
      <h2>¡Casi listo!</h2><p>Completa tus datos de acceso</p>
    </div>
    ${campo('user', 'text', 'regUsuario', 'Ingresa un usuario (ej: marcos)')}
    <div class="wilg_check" style="margin-top: 1.5vh;">
      <label><input type="checkbox" id="regTerminos">
      <span>Acepto los <a href="/terminos" target="_blank">términos y condiciones</a></span></label>
    </div>
    <button type="button" id="CompletarGoogle" class="wilg_btn inactivo" disabled style="margin-top: 1.5vh;"><i class="fas fa-rocket"></i> Completar Registro</button>
  `
};

// ── DISPLAY & INITIALIZATION ────────────────────────────────────────────────
const modalHTML = (vista, cls = '') =>
  `<div id="wilg_modal" class="wiModal wilg_mod ${cls}"><div class="modalBody"><button class="modalX">&times;</button><form id="liForm">${tpl[vista]()}</form></div></div>`;

const toggleModal = (vista, isNew = false) => {
  if (isNew) {
    const old = document.getElementById('wilg_modal');
    if (old) old.remove();
    const cls = vista === 'registrar' ? 'wilg_mod_reg' : '';
    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHTML(vista, cls);
    const modalEl = wrapper.firstElementChild;
    if (modalEl) { document.body.appendChild(modalEl); abrirModal('wilg_modal'); }
  } else {
    const modalEl = document.getElementById('wilg_modal');
    if (modalEl) modalEl.classList.toggle('wilg_mod_reg', vista === 'registrar');
    const form = document.getElementById('liForm');
    if (form) { form.innerHTML = tpl[vista](); form.setAttribute('data-vista', vista); }
  }
  setTimeout(() => setupFormState(vista), 50);
};

export const render = () => `<div class="wilg_wrap"><div class="wilg_card"><form id="liForm"></form></div></div>`;

export const init = () => {
  const wi = wiAuth.user;
  if (wi) return setTimeout(() => rutas.navigate(rolPage[wi.rol] || '/'), 0);
  mostrar('login');
};

const mostrar = v => {
  const form = document.getElementById('liForm');
  if (form) { form.innerHTML = tpl[v](); form.setAttribute('data-vista', v); }
  setTimeout(() => setupFormState(v), 30);
};

const swap = v => esModal() ? toggleModal(v) : mostrar(v);

// ── HELPERS & VALIDATION ENGINE ──────────────────────────────────────────────
const val     = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
const esModal = ()  => document.querySelector('#wilg_modal.active') !== null;
const tema    = t   => {
  if (!t) return;
  const [n, c] = t.split('|');
  document.documentElement.dataset.theme = n;
  const meta = document.querySelector('meta[name="theme-color"]') || document.head.appendChild(Object.assign(document.createElement('meta'), { name: 'theme-color' }));
  meta.setAttribute('content', c);
};

const entrar = wi => {
  wiAuth.login(wi, 7, ['wiSmart', 'cookiesPrivacidad']);
  if (wi?.tema) { localStorage.wiTema = wi.tema; tema(wi.tema); }
  if (esModal()) cerrarTodos();
  Mensaje(`<i class="fa-solid fa-hand-wave"></i> Bienvenido ${wi?.nombre || ''}`, 'success');
  setDoc(doc(db, 'smiles', wi.usuario), { ultActividad: serverTimestamp() }, { merge: true }).catch(console.error);
  if (auth.currentUser && auth.currentUser.displayName !== wi.usuario) {
    updateProfile(auth.currentUser, { displayName: wi.usuario })
      .then(() => auth.currentUser.getIdToken(true))
      .catch(console.error);
  }
  setTimeout(() => { rutas.navigate(rolPage[wi?.rol] || '/'); }, 1000);
};

const accion = async (btn, txt, fn) => {
  wiSpin(btn, true, txt);
  try { await fn(); } catch(e) { Mensaje(err[e.code] || e.message, 'error'); }
  finally { wiSpin(btn, false); }
};

// Resuelve email buscando en la colección de registros
const fetchUser = async input => {
  if (input.includes('@')) return { email: input };
  const snap = await getDoc(doc(db, 'registros', input));
  if (!snap.exists()) throw new Error('Usuario no encontrado');
  return { email: snap.data().email };
};

const checkLoginBtn = () => {
  const loginBtn = document.getElementById('Login');
  if (loginBtn) {
    const ok = val('email').length > 0 && val('password').length >= 6;
    loginBtn.classList.toggle('inactivo', !ok);
    loginBtn.disabled = !ok;
  }
};

const setupFormState = v => {
  const firstInput = document.querySelector('#liForm input');
  if (firstInput) firstInput.focus();
  ['regEmail', 'regUsuario', 'regNombre', 'regApellidos', 'regPassword', 'regPassword1'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = ''; el.dataset.ok = 'false'; }
  });
  if (v === 'login') {
    const loginBtn = document.getElementById('Login');
    if (loginBtn) { loginBtn.classList.add('inactivo'); loginBtn.disabled = true; }
    requestAnimationFrame(checkLoginBtn);
  }
  if (v === 'registrar') {
    const regBtn = document.getElementById('Registrar');
    if (regBtn) { regBtn.classList.add('inactivo'); regBtn.disabled = true; }
  }
  if (v === 'username') {
    const compBtn = document.getElementById('CompletarGoogle');
    if (compBtn) { compBtn.classList.add('inactivo'); compBtn.disabled = true; }
  }
};

let vTimeout = null;
const checkField = async (el, forzarTip = false) => {
  const id = el.id, value = el.value.trim();
  if (!value) return;

  const rule = reglas[id];
  if (rule) {
    const [trans, vld] = rule;
    const v = trans(value); el.value = v;
    const r = vld(v);
    if (r !== true) {
      if (forzarTip) { wiTip(el, r, 'error', 2500); el.dataset.ok = 'false'; }
      return;
    }
  }

  let ok = true;
  if (id === 'regEmail') {
    const rl = wiRateLimit('regValidacion', 7);
    if (!rl.ok) {
      el.dataset.ok = 'false';
      wiTip(el, `Demasiados intentos. Espera ${rl.min} min`, 'error', 2500);
      return;
    }
    rl.fail();
    const snap = await getDocs(query(collection(db, 'registros'), where('email', '==', value), limit(1)));
    ok = snap.empty;
    wiTip(el, ok ? 'Email disponible <i class="fa-solid fa-check-circle"></i>' : 'Email no disponible', ok ? 'success' : 'error', 2500);
  } else if (id === 'regUsuario') {
    if (value.includes('@')) {
      el.dataset.ok = 'false';
      if (forzarTip) wiTip(el, 'No puede contener @', 'error', 2500);
      return;
    }
    const rl = wiRateLimit('regValidacion', 5);
    if (!rl.ok) {
      el.dataset.ok = 'false';
      wiTip(el, `Demasiados intentos. Espera ${rl.min} min`, 'error', 2500);
      return;
    }
    rl.fail();
    const existe = (await getDoc(doc(db, 'registros', value))).exists();
    ok = !existe;
    wiTip(el, ok ? 'Usuario disponible <i class="fa-solid fa-check-circle"></i>' : 'Usuario no disponible', ok ? 'success' : 'error', 2500);
  } else if (id === 'regNombre' || id === 'regApellidos') {
    ok = value.length > 0;
  } else if (id === 'regPassword') {
    ok = value.length >= 6;
  } else if (id === 'regPassword1') {
    const p1El = document.getElementById('regPassword');
    const p1 = p1El ? p1El.value : '';
    ok = value.length >= 6 && value === p1;
    if (ok) wiTip(el, 'Contraseñas coinciden <i class="fa-solid fa-check-circle"></i>', 'success', 2500);
    else if (p1 && value !== p1 && forzarTip) wiTip(el, 'No coinciden', 'error', 2500);
  }

  el.dataset.ok = ok ? 'true' : 'false';
};

// ── AUXILIAR ATÓMICO CON PATRÓN DE ROLLBACK DE LA NASA 🚀 ─────────────────────
const crearPerfilAtomico = async (user, wi, esCorreo = false) => {
  const batch = writeBatch(db);
  batch.set(doc(db, 'smiles', wi.usuario), wi);
  batch.set(doc(db, 'registros', wi.usuario), { usuario: wi.usuario, email: wi.email, uid: wi.uid, creado: serverTimestamp() });

  try {
    // 1. Escribir en base de datos en un lote único
    await batch.commit();

    // 2. Actualizar perfiles de Auth y enviar verificación si corresponde
    if (esCorreo) {
      await Promise.all([
        updateProfile(user, { displayName: wi.usuario, photoURL: wi.avatar }),
        sendEmailVerification(user)
      ]);
    } else {
      await updateProfile(user, { displayName: wi.usuario });
      await user.getIdToken(true);
    }
  } catch (dbErr) {
    // Si la base de datos falla y creamos una cuenta de correo nueva, revertimos Firebase Auth
    if (esCorreo && user) {
      try {
        await deleteUser(user);
        console.warn("🚀 NASA Rollback: Cuenta de Auth eliminada debido a fallo en Firestore.");
      } catch (authErr) {
        console.error("Error crítico durante rollback de Auth:", authErr);
      }
    }
    throw dbErr;
  }
};

// ── EVENTOS (DELEGACIÓN DE EVENTOS VANILLA) ──────────────────────────────────
if (typeof window !== 'undefined') {
  document.addEventListener('submit', e => {
    if (!(e.target instanceof Element)) return;
    if (e.target.closest('#liForm')) e.preventDefault();
  });

  document.addEventListener('click', async e => {
    const target = e.target;
    if (!(target instanceof Element)) return;

    // 1. Mostrar/ocultar contraseña (ojo)
    const ojo = target.closest('.wilg_ojo');
    if (ojo) {
      const input = ojo.previousElementSibling;
      if (input) {
        input.setAttribute('type', input.getAttribute('type') === 'password' ? 'text' : 'password');
        ojo.classList.toggle('fa-eye');
        ojo.classList.toggle('fa-eye-slash');
      }
      return;
    }

    // 2. Intercambio de vistas
    if (target.closest('.wilg_reg')) return swap('registrar');
    if (target.closest('.wilg_rec')) return swap('restablecer');
    if (target.closest('.wilg_log')) return swap('login');

    // 3. Google SSO
    const btnGoogle = target.closest('#btnGoogle');
    if (btnGoogle) {
      e.preventDefault();
      if (btnGoogle.dataset.busy === 'true') return;
      btnGoogle.dataset.busy = 'true';
      const prevHtml = btnGoogle.innerHTML;
      btnGoogle.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Conectando...';
      try {
        const provider = new GoogleAuthProvider();
        const res = await signInWithPopup(auth, provider);
        const user = res.user;

        // Comprobación de UID en registros
        const regSnap = await getDocs(query(collection(db, 'registros'), where('uid', '==', user.uid), limit(1)));
        if (!regSnap.empty) {
          const wiSnap = await getDoc(doc(db, 'smiles', regSnap.docs[0].data().usuario));
          const wi = wiSnap.exists() ? wiSnap.data() : null;
          if (!wi || wi.estado === 'pendiente') {
            await signOut(auth);
            if (esModal()) cerrarTodos();
            rutas.navigate('/registrado');
            return;
          }
          entrar(wi);
        } else {
          // Comprobar si el email ya existe en registros
          const emailSnap = await getDocs(query(collection(db, 'registros'), where('email', '==', user.email), limit(1)));
          if (!emailSnap.empty) throw new Error('El email ya está registrado. Por favor, ingresa con tu contraseña.');
          _googleUser = user;
          swap('username');
        }
      } catch (errCode) {
        if (errCode.code !== 'auth/popup-closed-by-user' && errCode.code !== 'auth/cancelled-popup-request') {
          Mensaje(err[errCode.code] || errCode.message, 'error');
        }
        btnGoogle.innerHTML = prevHtml;
        btnGoogle.dataset.busy = 'false';
      }
      return;
    }

    // 4. Completar registro Google (Secuencial: smiles -> registros)
    const btnCG = target.closest('#CompletarGoogle');
    if (btnCG) {
      e.preventDefault();
      const termEl = document.getElementById('regTerminos');
      if (termEl && !termEl.checked) return wiTip(termEl, 'Acepta los términos', 'error', 2500);
      const u = val('regUsuario');
      const uEl = document.getElementById('regUsuario');
      if (!u || uEl?.dataset.ok !== 'true') return wiTip(uEl, 'Verifica el usuario', 'error', 2500);
      const user = _googleUser;
      if (!user) return Mensaje('Error de sesión con Google. Intenta de nuevo.', 'error');

      btnCG.dataset.busy = 'true';
      try {
        await accion(btnCG, 'Finalizando', async () => {
          const partes = user.displayName ? user.displayName.split(' ') : ['Usuario', ''];
          const wi = {
            usuario: u,
            email: user.email,
            nombre: partes[0],
            apellidos: partes.slice(1).join(' ') || '',
            rol: rolPublico,
            activo: true,
            estado: 'activo',
            uid: user.uid,
            terminos: true,
            terminosFecha: serverTimestamp(),
            tema: localStorage.wiTema || 'Oro|#FFC107',
            avatar: user.photoURL || avatarMain,
            plan: 'free',
            segmento: 'general',
            bio: '',
            limites: { maxDia: 10, dia: true },
            verificado: false,
            registradoCon: 'google',
            creado: serverTimestamp()
          };
          await crearPerfilAtomico(user, wi, false);
          _googleUser = null; // Limpiar referencia privada tras registro exitoso
          entrar(wi);
        });
      } finally {
        btnCG.dataset.busy = 'false';
      }
      return;
    }

    // 5. Iniciar Sesión Ordinaria
    const btnLogin = target.closest('#Login');
    if (btnLogin) {
      e.preventDefault();
      await accion(btnLogin, 'Iniciando', async () => {
        const input = val('email'), pass = val('password');
        const { email } = await fetchUser(input);
        await signInWithEmailAndPassword(auth, email, pass);
        const displayName = auth.currentUser?.displayName;
        if (!displayName) throw new Error('Perfil incompleto. Contacta soporte.');
        const wiSnap = await getDoc(doc(db, 'smiles', displayName));
        if (!wiSnap.exists()) throw new Error('Perfil no encontrado en la base de datos.');
        const wi = wiSnap.data();
        if (wi?.estado === 'pendiente') {
          await signOut(auth);
          if (esModal()) cerrarTodos();
          rutas.navigate('/registrado');
          return;
        }
        entrar(wi);
      });
      return;
    }

    // 6. Registrar Cuenta Nueva por Correo
    const btnReg = target.closest('#Registrar');
    if (btnReg) {
      e.preventDefault();
      const termEl = document.getElementById('regTerminos');
      const userEl = document.getElementById('regUsuario');
      const emailEl = document.getElementById('regEmail');
      if (termEl && !termEl.checked) return wiTip(termEl, 'Acepta los términos', 'error', 2500);
      if (userEl?.dataset.ok !== 'true') return wiTip(userEl, 'Verifica el usuario', 'error', 2500);
      if (emailEl?.dataset.ok !== 'true') return wiTip(emailEl, 'Verifica el email', 'error', 2500);

      btnReg.dataset.busy = 'true';
      try {
        await accion(btnReg, 'Registrando', async () => {
          const d = { email: val('regEmail'), usuario: val('regUsuario'), nombre: val('regNombre'), apellidos: val('regApellidos'), password: val('regPassword') };
          const { user } = await createUserWithEmailAndPassword(auth, d.email, d.password);
          const wi = {
            usuario: d.usuario,
            email: d.email,
            nombre: d.nombre,
            apellidos: d.apellidos,
            rol: rolPublico,
            activo: true,
            estado: 'activo',
            uid: user.uid,
            terminos: true,
            terminosFecha: serverTimestamp(),
            tema: localStorage.wiTema || 'Oro|#FFC107',
            avatar: avatarMain,
            plan: 'free',
            segmento: 'general',
            bio: '',
            limites: { maxDia: 10, dia: true },
            verificado: false,
            registradoCon: 'correo',
            creado: serverTimestamp()
          };
          await crearPerfilAtomico(user, wi, true);
          entrar(wi);
        });
      } finally {
        btnReg.dataset.busy = 'false';
      }
      return;
    }

    // 7. Enviar Enlace de Restablecimiento
    const btnRec = target.closest('#Recuperar');
    if (btnRec) {
      e.preventDefault();
      const emailVal = val('recEmail');
      if (!emailVal) return wiTip(btnRec, 'Ingresa tu email o usuario', 'error', 2500);
      await accion(btnRec, 'Enviando', async () => {
        const { email } = await fetchUser(emailVal);
        await sendPasswordResetEmail(auth, email);
        Mensaje('<i class="fa-solid fa-check-circle"></i> Email enviado, revisa tu bandeja', 'success');
        setTimeout(() => swap('login'), 2000);
      });
      return;
    }

    // 8. Cambiar Tema
    if (target.closest('.tema')) {
      const wi = getls('wiSmile'); if (!wi?.usuario) return;
      setTimeout(async () => {
        const t = localStorage.wiTema; if (!t) return;
        try {
          await setDoc(doc(db, 'smiles', wi.usuario), { tema: t, actualizado: serverTimestamp() }, { merge: true });
          savels('wiSmile', { ...wi, tema: t }, 7);
          Mensaje(`Tema ${t.split('|')[0]} guardado <i class="fas fa-check-circle"></i>`, 'success');
        } catch (errCode) { console.error('tema:', errCode); }
      }, 0);
      return;
    }
  });

  // Manejo de focos secuenciales
  document.addEventListener('focus', e => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (target.closest('#liForm input')) {
      const list = ['regEmail', 'regUsuario', 'regNombre', 'regApellidos', 'regPassword', 'regPassword1'];
      const idx = list.indexOf(target.id);
      if (idx <= 0) return;
      for (let i = 0; i < idx; i++) {
        const prev = document.getElementById(list[i]);
        if (prev && prev.getAttribute('data-ok') !== 'true') { prev.focus(); break; }
      }
    }
  }, true);

  // Listener change unificado para validación e inputs
  document.addEventListener('change', e => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (target.id === 'regTerminos') {
      const ok = target.checked;
      ['Registrar', 'CompletarGoogle'].forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) { btn.classList.toggle('inactivo', !ok); btn.disabled = !ok; }
      });
    }
    if (target.closest('#liForm input')) {
      checkField(target, true);
      if (target.id === 'email' || target.id === 'password') checkLoginBtn();
    }
  });

  // Envío al presionar Enter
  document.addEventListener('keyup', e => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (e.key === 'Enter' && target.closest('#liForm input')) {
      checkField(target, true);
      if (target.id === 'password') document.getElementById('Login')?.click();
      if (target.id === 'regPassword1') {
        const regBtn = document.getElementById('Registrar');
        if (regBtn && !regBtn.disabled) regBtn.click();
      }
      if (target.id === 'recEmail') document.getElementById('Recuperar')?.click();
    }
  });

  // Entrada de datos saneada e inicio de validaciones
  document.addEventListener('input', e => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (target.closest('#liForm input')) {
      const id = target.id, raw = target.value;
      const clean = id.includes('Email') || id === 'email' ? raw.replace(/[<>="'`;/\\$}{ ]/g, '').toLowerCase()
                  : id.includes('Usuario') ? raw.toLowerCase().replace(/[^a-z0-9_-]/g, '')
                  : id.includes('Nombre') || id.includes('Apellidos') ? raw.replace(/[<>="'`;/\\$}{]/g, '') : raw;
      target.value = clean;

      if (id === 'email' || id === 'password') checkLoginBtn();

      if (!target.value.trim()) {
        target.dataset.ok = 'false';
        const list = ['regEmail', 'regUsuario', 'regNombre', 'regApellidos', 'regPassword', 'regPassword1'];
        const idx = list.indexOf(id);
        if (idx !== -1) {
          for (let i = idx + 1; i < list.length; i++) {
            const next = document.getElementById(list[i]);
            if (next) { next.value = ''; next.dataset.ok = 'false'; }
          }
          const term = document.getElementById('regTerminos');
          if (term) term.checked = false;
          ['Registrar', 'CompletarGoogle'].forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) { btn.classList.add('inactivo'); btn.disabled = true; }
          });
        }
        return;
      }

      const rule = reglas[id];
      const ok = !rule || rule[1](rule[0](target.value.trim())) === true;
      if (ok) {
        if (vTimeout) clearTimeout(vTimeout);
        vTimeout = setTimeout(() => checkField(target), 400);
      }
    }
  });
}

// ── AUTH MODAL ───────────────────────────────────────────────────────────────
export const abrirLogin = (tipo = 'login') => {
  toggleModal(tipo === 'registrar' ? 'registrar' : 'login', true);
};

export const salir = async (keep = []) => {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('vault_unlocked');
  }
  try { await signOut(auth); } catch(e) { console.error('signOut:', e); }
  const keysToKeep = Array.from(new Set(['wiTema', 'cookiesPrivacidad', ...keep]));
  wiAuth.logout(keysToKeep);
};

export const cleanup = () => {};
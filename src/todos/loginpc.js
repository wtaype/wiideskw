import { auth, db } from '../firebase.js';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, getDocs, collection, query, where, limit } from 'firebase/firestore';
import { wiAuth } from '../widev.js';
import { rutas, rolPage } from '../rutas.js';

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.loginpc');
  if (btn) {
    e.preventDefault();
    e.stopPropagation();
    
    if (btn.dataset.busy === 'true') return;
    btn.dataset.busy = 'true';
    
    const originalHtml = btn.innerHTML;
    btn.style.opacity = '0.6';
    btn.style.pointerEvents = 'none';
    
    const spinner = '<i class="fas fa-circle-notch fa-spin"></i> ';
    const span = btn.querySelector('span');
    if (span) {
      span.innerHTML = spinner + span.innerHTML;
    } else {
      btn.innerHTML = spinner + btn.innerHTML;
    }

    setTimeout(() => {
      if (btn && btn.dataset.busy === 'true') {
        btn.dataset.busy = 'false';
        btn.style.opacity = '';
        btn.style.pointerEvents = '';
        btn.innerHTML = originalHtml;
      }
    }, 20000);
    
    const authUrl = 'https://wiidesk.web.app/loginpc';
    
    try {
      const { Mensaje } = await import('../widev.js');
      Mensaje('<i class="fas fa-external-link-alt"></i> Redirigiendo al navegador...', 'info');
    } catch (err) {
      console.error(err);
    }
    
    const hasGlobalTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;
    const esTauri = hasGlobalTauri || (typeof window !== 'undefined' && (
      window.__TAURI_INTERNALS__ !== undefined || 
      navigator.userAgent.includes('WebView2') ||
      window.origin?.includes("tauri") || 
      location.protocol === 'tauri:'
    ));

    if (esTauri) {
      if (hasGlobalTauri) {
        if (window.__TAURI__.core && typeof window.__TAURI__.core.invoke === 'function') {
          window.__TAURI__.core.invoke('abrir_navegador', { url: authUrl }).catch((err) => {
            console.error(err);
            window.open(authUrl, '_blank');
          });
        } else if (typeof window.__TAURI__.invoke === 'function') {
          window.__TAURI__.invoke('abrir_navegador', { url: authUrl }).catch((err) => {
            console.error(err);
            window.open(authUrl, '_blank');
          });
        } else {
          window.open(authUrl, '_blank');
        }
      } else {
        window.open(authUrl, '_blank');
      }
    } else {
      window.open(authUrl, '_blank');
    }
  }
}, { capture: true });

if (typeof window !== 'undefined' && window.__TAURI__ && window.__TAURI__.event) {
  window.__TAURI__.event.listen('deep-link://new-url', (event) => {
    const urls = event.payload;
    if (urls && urls.length > 0) {
      procesarUrlAuth(urls[0]);
    }
  });
}

function procesarUrlAuth(url) {
  try {
    const searchIdx = url.indexOf('?');
    if (searchIdx === -1) return;
    const queryStr = url.slice(searchIdx + 1);
    const params = new URLSearchParams(queryStr);
    const idToken = params.get('idToken');
    const accessToken = params.get('accessToken');
    if (idToken && accessToken) {
      loginConTokens(idToken, accessToken);
    }
  } catch (err) {
    console.error(err);
  }
}

async function loginConTokens(idToken, accessToken) {
  try {
    const credential = GoogleAuthProvider.credential(idToken, accessToken);
    const userCredential = await signInWithCredential(auth, credential);
    const user = userCredential.user;

    let usuarioKey = null;
    try {
      const q = query(collection(db, 'registros'), where('uid', '==', user.uid), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        usuarioKey = snap.docs[0].data().usuario;
      }
    } catch (err) {
      console.warn('[LoginPC] Error al consultar el username en registros:', err);
    }

    if (!usuarioKey) {
      usuarioKey = user.displayName;
    }

    if (usuarioKey) {
      const wiSnap = await getDoc(doc(db, 'smiles', usuarioKey));
      if (wiSnap.exists()) {
        const wi = { ...wiSnap.data(), usuario: usuarioKey };
        wiAuth.login(wi, 7, ['wiSmart', 'cookiesPrivacidad']);
        
        const { Mensaje } = await import('../widev.js');
        Mensaje('<i class="fas fa-check-circle"></i> Conectado con éxito', 'success');
        
        setTimeout(() => {
          rutas.navigate(rolPage[wi?.rol] || '/');
        }, 500);
      }
    }
  } catch (error) {
    console.error(error);
  }
}
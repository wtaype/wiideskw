document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.loginpc');
  if (btn) {
    e.preventDefault();
    e.stopPropagation();
    
    const authUrl = 'https://wiidesk.web.app/login?port=TEST';
    
    try {
      const { Mensaje } = await import('../widev.js');
      Mensaje('<i class="fas fa-external-link-alt"></i> Redirigiendo al navegador...', 'info');
    } catch (err) {
      console.error(err);
    }
    
    const hasGlobalTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;
    console.log('--- [FRONTEND] Botón google clickeado. window.__TAURI__ definido:', hasGlobalTauri);
    
    const esTauri = hasGlobalTauri || (typeof window !== 'undefined' && (
      window.__TAURI_INTERNALS__ !== undefined || 
      navigator.userAgent.includes('WebView2') ||
      window.origin?.includes("tauri") || 
      location.protocol === 'tauri:'
    ));

    if (esTauri) {
      if (hasGlobalTauri) {
        if (window.__TAURI__.core && typeof window.__TAURI__.core.invoke === 'function') {
          console.log('--- [FRONTEND] Invocando abrir_navegador via core.invoke ---');
          window.__TAURI__.core.invoke('abrir_navegador', { url: authUrl }).catch((err) => {
            console.error('--- [FRONTEND] Error invoke:', err);
            window.open(authUrl, '_blank');
          });
        } else if (typeof window.__TAURI__.invoke === 'function') {
          console.log('--- [FRONTEND] Invocando abrir_navegador via invoke antiguo ---');
          window.__TAURI__.invoke('abrir_navegador', { url: authUrl }).catch((err) => {
            console.error('--- [FRONTEND] Error invoke:', err);
            window.open(authUrl, '_blank');
          });
        } else {
          console.warn('--- [FRONTEND] window.__TAURI__ definido pero no invoke ---');
          window.open(authUrl, '_blank');
        }
      } else {
        console.warn('--- [FRONTEND] esTauri=true pero window.__TAURI__ no está definido (posible falta de withGlobalTauri en tauri.conf.json) ---');
        window.open(authUrl, '_blank');
      }
    } else {
      window.open(authUrl, '_blank');
    }
  }
}, { capture: true });
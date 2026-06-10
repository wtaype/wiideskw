import { app, descri, keywii, linkweb } from './wii.js';

// Inject basic variables and transition animations globally if not present
if (typeof document !== 'undefined' && !document.getElementById('wi-global-vars-css')) {
  const style = document.createElement('style');
  style.id = 'wi-global-vars-css';
  style.textContent = `
    :root {
      --success: #3cd741;
      --error: #ff3849;
      --warning: #ffa726;
      --info: #00a8e6;
    }
  `;
  document.head.appendChild(style);
}

// Helper: SEO Dinámico
const setTag  = (id, val) => { const el = document.getElementById(id); if (el) el.setAttribute('content', val); };
const setHref = (id, val) => { const el = document.getElementById(id); if (el) el.setAttribute('href', val); };

// ── 1. SEO DINÁMICO: setMeta ─────────────────────────────────
export const setMeta = ({ title, desc, keywords, img, path, type = 'WebSite', datePublished = null } = {}) => {
  const t = title ?? `${app} — ${descri}`;
  const d = desc  ?? `${descri}`;
  const k = keywords ?? keywii;
  const i = img   ?? `${linkweb}/poster.webp`;
  const p = path  ?? '/';
  const url = `${linkweb}${p}`;

  document.title = t;
  setTag('wi_desc', d);
  setTag('wi_keywords', k);
  setHref('wi_canonical', url);

  setTag('wi_og_title', t);
  setTag('wi_og_desc', d);
  setTag('wi_og_url', url);
  setTag('wi_og_img', i);

  setTag('wi_tw_title', t);
  setTag('wi_tw_desc', d);
  setTag('wi_tw_img', i);

  // Schema Dinámico
  const oldSchema = document.getElementById('wi_schema_art');
  if (oldSchema) oldSchema.remove();
  if (type === 'Article') {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'wi_schema_art';
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": t,
      "image": i,
      "datePublished": datePublished ? new Date(datePublished).toISOString() : new Date().toISOString(),
      "author": { "@type": "Person", "name": "Wilder Taype" }
    });
    document.head.appendChild(script);
  }
};

// ── 2. OBSERVER v13: wiVista ─────────────────────────────────
export const wiVista = (sel, fn, { stagger = 0, anim = '', threshold = 0.1, once = true, root = null, onExit = null, delay = 0 } = {}) => {
  const els = [...document.querySelectorAll(sel)];
  if (!els.length) return null;
  const obs = new IntersectionObserver(es => es.forEach(e => {
    const i = els.indexOf(e.target);
    if (e.isIntersecting) {
      setTimeout(() => {
        if (anim) e.target.classList.add('wi_visible');
        fn?.(e.target, i);
      }, delay + stagger * i);
      if (once) obs.unobserve(e.target);
    } else onExit?.(e.target, i);
  }), { rootMargin: '20px', threshold, root });
  els.forEach(el => {
    if (anim) el.classList.add(anim);
    obs.observe(el);
  });
  return obs;
};

// ── 3. HEROWI V10 SEO FRIENDLY: herowi ───────────────────────
export const herowi = (() => {
  let init = 0;
  return (sel = '[data-herowi]', defSt = 45) => {
    if (!init) {
      const style = document.createElement('style');
      style.textContent = `
        @keyframes hwi_fade {
          from { opacity: 0; transform: translateY(3vh); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hwi { animation: hwi_fade 0.8s cubic-bezier(0.4, 0, 0.2, 1) backwards; }
      `;
      document.head.appendChild(style);
      init = 1;
    }
    const _resolve = (t) => typeof t === 'string' ? [...document.querySelectorAll(t)] : [t];
    const targetNodes = typeof sel === 'string' ? [...document.querySelectorAll(sel)] : [].concat(sel).flatMap(_resolve);
    targetNodes.forEach((t) => {
      const els = (t.hasAttribute('data-herowi') && t.children.length ? [...t.children] : [t]).filter((e) => !e.dataset.hi);
      if (els.length) {
        const st = parseInt(t.dataset.herowi) || defSt;
        els.forEach((e, i) => {
          const delay = Math.min(i * st, 800); // Cap delay for SEO speed
          e.style.animationDelay = `${delay}ms`;
          e.classList.add('hwi');
          e.dataset.hi = '1';
        });
      }
    });
  };
})();

// ── 4. SHOWI V14 PRO COMPACTO: showi ─────────────────────────
export const showi = (() => {
  let ini = 0;
  return (sel = '[data-showi]', dSt = 45) => {
    if (!ini) {
      const style = document.createElement('style');
      style.textContent = `.swi{opacity:0;transform:translateY(3vh);transition:all .7s cubic-bezier(.4,0,.2,1)}`;
      document.head.appendChild(style);
      ini = 1;
    }
    let n = 0;
    let id;
    const o = new IntersectionObserver(es => {
      es.filter(e => e.isIntersecting).forEach(e => {
        const t = e.target;
        o.unobserve(t);
        setTimeout(() => {
          t.style.opacity = '1';
          t.style.transform = 'translateY(0)';
          setTimeout(() => {
            t.classList.remove('swi');
            // Mantener las propiedades finales explícitas para evitar que se desvanezca si el CSS base lo oculta
          }, 750);
        }, n++ * (parseInt(t.dataset.st || '') || dSt));
      });
      clearTimeout(id);
      id = setTimeout(() => n = 0, 100);
    });
    const targetNodes = [].concat(sel).flatMap(s => typeof s === 'string' ? [...document.querySelectorAll(s)] : s);
    targetNodes.forEach((p) => {
      (p.hasAttribute('data-showi') && p.children.length ? [...p.children] : [p]).filter((e) => !e.dataset.i).forEach((e) => {
        e.dataset.i = '1';
        e.dataset.st = parseInt(p.dataset?.showi || '') || dSt;
        e.classList.add('swi');
        o.observe(e);
      });
    });
  };
})();

// ── 5. CARGANDO: wiSpin ──────────────────────────────────────
export const wiSpin = (btn, act = true, txt = '') => {
  const el = typeof btn === 'string' ? document.querySelector(btn) : btn;
  if (!el) return;
  if (act) {
    const texto = txt || el.textContent?.trim() || '';
    el.setAttribute('data-txt', texto);
    el.disabled = true;
    el.innerHTML = `${texto} <i class="fas fa-spinner fa-spin"></i>`;
  } else {
    el.disabled = false;
    el.textContent = el.getAttribute('data-txt') || txt || 'Continuar';
  }
};

// ── 6. SCROLL SPY: wiScroll ──────────────────────────────────
export const wiScroll = (ids, navSel, opts = {}) => {
  const { margin = '-20% 0px -70% 0px', cls = 'active' } = opts;
  const obs = new IntersectionObserver(
    es => es.filter(e => e.isIntersecting).forEach(e => {
      document.querySelectorAll(navSel).forEach(el => el.classList.remove(cls));
      const activeEl = document.querySelector(`${navSel}[href="#${e.target.id}"]`);
      if (activeEl) activeEl.classList.add(cls);
    }),
    { rootMargin: margin }
  );
  ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
  return obs;
};

// ── 7. CACHE LOCAL STORAGE: savels, getls, removels ──────────
export function savels(clave, valor, horas = 24) {
  try {
    if (typeof localStorage === 'undefined') return false;
    if (!clave || typeof clave !== 'string') return false;
    localStorage.setItem(clave, JSON.stringify({ value: valor, expiry: Date.now() + horas * 3600000 }));
    return true;
  } catch(e) { console.error('esv:', e); return false; }
}

export function getls(clave) {
  try {
    if (typeof localStorage === 'undefined') return null;
    if (!clave || typeof clave !== 'string') return null;
    const item = localStorage.getItem(clave);
    if (!item) return null;
    const parsed = JSON.parse(item);
    if (!parsed || Date.now() > parsed.expiry) {
      localStorage.removeItem(clave);
      return null;
    }
    return parsed.value;
  } catch(e) { console.error('egt:', e); if (typeof localStorage !== 'undefined') localStorage.removeItem(clave); return null; }
}

export function removels(...claves) {
  if (typeof localStorage === 'undefined') return;
  claves.flat().flatMap(c => typeof c === 'string' ? c.split(/[,\s]+/).filter(Boolean) : c)
    .forEach(clave => localStorage.removeItem(clave));
}
removels.except = (keep = []) => {
  if (typeof localStorage === 'undefined') return;
  const saved = keep.map(k => [k, localStorage.getItem(k)]);
  localStorage.clear();
  saved.forEach(([k, v]) => v !== null && localStorage.setItem(k, v));
};

// ── 8. AUTH SIGNAL: wiAuth ───────────────────────────────────
const bus = new Set();
export const wiAuth = {
  get user() { return getls('wiSmile'); },
  on(fn) { bus.add(fn); const u = this.user; if (u) fn(u); return () => bus.delete(fn); },
  emit(wi) { bus.forEach(fn => { try { fn(wi); } catch(e) { console.error('wiAuth:', e); } }); },
  login(wi, h = 144, keep = []) { removels.except(['wiTema', 'cookiesPrivacidad', ...keep]); savels('wiSmile', wi, h); this.emit(wi); },
  logout(keep = []) { removels.except(['wiTema', 'cookiesPrivacidad', ...keep]); this.emit(null); }
};

// ── 9. CARGA INTELIGENTE: wiSmart ────────────────────────────
export const wiSmart = (() => {
  const ok = new Set();
  let opt = null;
  const run = () => {
    if (!opt) return;
    Object.entries(opt).forEach(([t, v]) => [].concat(v).forEach(it => {
      const k = `${t}:${it}`;
      t === 'css' ? !document.querySelector(`link[href="${it}"]`) && document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: it }))
        : t === 'js' && typeof it === 'string' ? !document.querySelector(`script[src="${it}"]`) && document.head.appendChild(Object.assign(document.createElement('script'), { src: it, async: true, crossOrigin: 'anonymous' }))
        : typeof it === 'function' && !ok.has(k) && (ok.add(k), it().catch?.(e => console.error('wiSmart:', e)));
    }));
    savels('wiSmart', 1);
  };
  const init = (o) => {
    if (o) opt = o;
    if (getls('wiSmart')) return run();
    const trigger = () => {
      run();
      ['touchstart', 'scroll', 'click', 'mousemove'].forEach(ev => document.removeEventListener(ev, trigger));
    };
    ['touchstart', 'scroll', 'click', 'mousemove'].forEach(ev => document.addEventListener(ev, trigger, { once: true }));
  };
  return init;
})();

// ── 10. SALUDO DE HORA: Saludar ──────────────────────────────
export const Saludar = () => {
  const hrs = new Date().getHours();
  return hrs >= 5 && hrs < 12 ? 'Buenos días, ' : hrs >= 12 && hrs < 18 ? 'Buenas tardes, ' : 'Buenas noches, ';
};

// ── 11. NOTIFICACIONES BANNER: Notificacion ──────────────────
export function Notificacion(msg, tipo = 'error', tiempo = 3000) {
  const ico = {success:'fa-check-circle',error:'fa-times-circle',warning:'fa-exclamation-triangle',info:'fa-info-circle'}[tipo] || 'fa-info-circle';
  let container = document.getElementById('notificationsContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notificationsContainer';
    Object.assign(container.style, {
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      zIndex: '9999',
      display: 'flex',
      flexDirection: 'column',
      gap: '.5rem'
    });
    document.body.appendChild(container);
  }
  const notif = document.createElement('div');
  notif.className = `notification notif-${tipo}`;
  Object.assign(notif.style, {
    background: 'var(--wb, #fff)',
    borderLeft: `4px solid var(--${tipo})`,
    boxShadow: '0 4px 12px rgba(0,0,0,.1)',
    borderRadius: '8px',
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '.5rem',
    opacity: '0',
    transform: 'translateX(20px)',
    transition: 'all .3s ease'
  });
  
  notif.innerHTML = `
    <i class="fas ${ico}" style="color:var(--${tipo}); font-size:1.2rem;"></i>
    <span style="flex:1;color:var(--tx, #000);font-size:var(--fz_m1, 0.95rem);font-weight:500;">${msg}</span>
    <button style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--tx2, #666);margin-left:.5rem;line-height:1;">&times;</button>
  `;
  container.appendChild(notif);

  requestAnimationFrame(() => {
    notif.style.opacity = '1';
    notif.style.transform = 'translateX(0)';
  });

  const cerrar = () => {
    notif.style.opacity = '0';
    notif.style.transform = 'translateX(20px)';
    setTimeout(() => notif.remove(), 300);
  };

  notif.querySelector('button')?.addEventListener('click', cerrar);
  setTimeout(cerrar, tiempo);
}

// ── 12. MENSAJE FLOTANTE: Mensaje ────────────────────────────
export function Mensaje(msg, tipo = 'success') {
  document.querySelectorAll('.alert-box').forEach(el => el.remove());
  const ico = {success:'fa-circle-check',error:'fa-circle-exclamation',warning:'fa-exclamation-triangle',info:'fa-info-circle'}[tipo] || 'fa-info-circle';
  const alerta = document.createElement('div');
  alerta.className = 'alert-box';
  Object.assign(alerta.style, {
    position: 'fixed',
    top: '20px',
    left: '50%',
    padding: '15px 20px',
    borderRadius: '8px',
    background: 'var(--wb, #fff)',
    color: `var(--${tipo})`,
    borderLeft: `4px solid var(--${tipo})`,
    boxShadow: '0 4px 12px rgba(0,0,0,.1)',
    zIndex: '10500',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: '300px',
    maxWidth: '90%',
    opacity: '0',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    transform: 'translate(-50%, -20px)'
  });
  
  alerta.innerHTML = `
    <i class="fas ${ico}" style="font-size:1.4rem;"></i>
    <span style="font-size:var(--fz_m2, 1rem);font-weight:500;">${msg}</span>
  `;
  document.body.appendChild(alerta);

  requestAnimationFrame(() => {
    alerta.style.opacity = '1';
    alerta.style.transform = 'translate(-50%, 0)';
  });

  setTimeout(() => {
    alerta.style.opacity = '0';
    alerta.style.transform = 'translate(-50%, -20px)';
    setTimeout(() => alerta.remove(), 300);
  }, 3000);
}

// ── 13. TOOLTIP ENGINE: wiTip ────────────────────────────────
export function wiTip(elmOrTxt, txt, tipo = 'top', tiempo = 1800) {
  if (!wiTip.CSS) {
    const style = document.createElement('style');
    style.id = 'wiTip-css';
    style.textContent = '.wiTip{position:fixed;color:var(--txa);z-index:99999;padding:.8vh 1.2vh;border-radius:.6vh;font-size:var(--fz_s4);font-weight:500;max-width:25vh;box-shadow:0 .4vh 1.2vh rgba(0,0,0,.2);opacity:0;transform:translateY(-.3vh);transition:all .2s cubic-bezier(.4,0,.2,1);pointer-events:none;backdrop-filter:blur(.4vh)}.wiTip.show{opacity:1;transform:translateY(0)}.wiTip::after{content:"";position:absolute;top:100%;left:50%;margin-left:-.6vh;border:.6vh solid transparent;border-top-color:inherit}';
    document.head.appendChild(style);

    let t;
    document.addEventListener('mouseenter', (e) => {
      const target = e.target.closest?.('[data-witip]');
      if (target) {
        clearTimeout(t);
        wiTip.ver(target, target.getAttribute('data-witip') || '', target.getAttribute('data-wtipo') || 'top', Number(target.getAttribute('data-wtiempo')) || 1800);
      }
    }, true);

    document.addEventListener('mouseleave', (e) => {
      const target = e.target.closest?.('[data-witip]');
      if (target) {
        const tips = document.querySelectorAll('.wiTip');
        tips.forEach(tip => tip.classList.remove('show'));
        clearTimeout(t);
        t = setTimeout(() => tips.forEach(tip => tip.remove()), 200);
      }
    }, true);

    wiTip.CSS = true;
  }
  if (!elmOrTxt) return;
  if (typeof elmOrTxt === 'string' && !txt) return `data-witip="${elmOrTxt}" data-wtipo="${tipo}" data-wtiempo="${tiempo}"`;
  return wiTip.ver(elmOrTxt, txt || '', tipo, tiempo), elmOrTxt;
}
wiTip.ver = (elm, txt, tipo, tiempo) => {
  const el = typeof elm === 'string' ? document.querySelector(elm) : elm;
  if (!el) return;
  document.querySelectorAll('.wiTip').forEach(tip => tip.remove());
  const c = {success:'var(--success)',error:'var(--error)',warning:'var(--warning)',info:'var(--info)'}[tipo] || 'var(--mco)';
  const tip = document.createElement('div');
  tip.className = 'wiTip';
  Object.assign(tip.style, {
    background: c,
    borderTopColor: c
  });
  tip.innerHTML = `<span>${txt}</span>`;
  document.body.appendChild(tip);

  const rect = el.getBoundingClientRect();
  const tipW = tip.offsetWidth;
  const tipH = tip.offsetHeight;
  Object.assign(tip.style, {
    left: `${Math.max(8, Math.min(rect.left + rect.width/2 - tipW/2, window.innerWidth - tipW - 8))}px`,
    top: `${rect.top - tipH - 8}px`
  });

  requestAnimationFrame(() => {
    tip.classList.add('show');
    if (tiempo > 0) {
      setTimeout(() => {
        tip.classList.remove('show');
        setTimeout(() => tip.remove(), 200);
      }, tiempo);
    }
  });
};
wiTip.CSS = false;

// ── 14. SISTEMA IP & GEO: wiIp ───────────────────────────────
export const wiIp = (geo) => {
  return fetch('https://ipinfo.io/json?token='+import.meta.env.VITE_WIIP,)
    .then(r => r.json())
    .then(data => {
      const ua = navigator.userAgent;
      const [lat, lng] = (data.loc || '0,0').split(',').map(Number);
      const ipData = {
        ip: data.ip, city: data.city, region: data.region, country: data.country, postal: data.postal, lat, lng,
        browser: /Edg/i.test(ua) ? 'Edge' : /Chrome/i.test(ua) ? 'Chrome' : /Firefox/i.test(ua) ? 'Firefox' : /Safari/i.test(ua) && !/Chrome/i.test(ua) ? 'Safari' : 'Otro',
        os: /Windows/i.test(ua) ? 'Windows' : /Android/i.test(ua) ? 'Android' : /iPhone|iPad/i.test(ua) ? 'iOS' : /Mac/i.test(ua) ? 'macOS' : 'Linux',
        device: /Mobile|Android|iPhone|iPad/i.test(ua) ? 'Móvil' : /Tablet|iPad/i.test(ua) ? 'Tablet' : 'Escritorio',
        screen: `${screen.width}×${screen.height}`, language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, utcOffset: new Date().getTimezoneOffset() / -60, online: navigator.onLine
      };
      return typeof geo === 'function' ? geo(ipData) : geo === 'ciudad' ? `${ipData.city}, ${ipData.country}` : ipData[geo];
    }).catch(() => null);
};

// ── 15. MODALES MANAGER: abrirModal, cerrarModal, cerrarTodos ─
export const abrirModal = (id) => {
  const m = document.getElementById(id);
  if (!m) return console.warn(`Modal #${id} no existe`);
  
  if (!document.getElementById('wiModalCss')) {
    const style = document.createElement('style');
    style.id = 'wiModalCss';
    style.textContent = `
      .wiModal {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, .45);
        z-index: 10000;
        justify-content: center;
        align-items: center;
        backdrop-filter: saturate(120%) blur(2px);
      }
      .wiModal.active {
        display: flex;
      }
      @keyframes mf {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .wiModal {
        animation: mf .25s ease;
      }
      body.modal-open {
        overflow: hidden;
      }
      .modalBody {
        position: relative;
        border-radius: 1.5vh;
        box-shadow: 0 10px 30px rgba(0,0,0,.25);
        background: var(--wb, #fff);
        width: 92%;
        max-width: 600px;
        max-height: 90vh;
        overflow: auto;
        animation: mp .22s ease;
        z-index: 10001;
        padding: 4vh;
      }
      @keyframes mp {
        from { transform: translateY(10px) scale(.98); opacity: .6; }
        to { transform: translateY(0) scale(1); opacity: 1; }
      }
      .modalX {
        z-index: 10002;
        background: none;
        border: none;
        color: var(--mco, #0284c7);
        font-size: 1.6rem;
        cursor: pointer;
        transition: transform .15s, opacity .15s;
        text-shadow: 0 1px 2px rgba(0,0,0,.15);
        position: absolute;
        top: 15px;
        right: 15px;
        padding: 0;
        line-height: 1;
      }
      .modalX:hover {
        transform: scale(1.1);
        opacity: .95;
      }
    `;
    document.head.appendChild(style);
  }

  m.classList.add('active');
  document.body.classList.add('modal-open');
  setTimeout(() => {
    const focusable = m.querySelector('input,select,textarea,button');
    if (focusable) focusable.focus();
  }, 20);
};

export const cerrarModal = (id) => {
  const m = document.getElementById(id);
  if (m) m.classList.remove('active');
  if (!document.querySelector('.wiModal.active')) {
    document.body.classList.remove('modal-open');
  }
};

export const cerrarTodos = () => {
  document.querySelectorAll('.wiModal').forEach(m => m.classList.remove('active'));
  document.body.classList.remove('modal-open');
};

if (typeof window !== 'undefined') {
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (target.closest('.modalX')) {
      cerrarTodos();
    } else if (target.classList.contains('wiModal') && target.classList.contains('active')) {
      cerrarTodos();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.querySelector('.wiModal.active')) {
      cerrarTodos();
    }
  });
}

// ── 16. FECHA FIREBASE: wiDate ───────────────────────────────
export const wiDate = (tm) => ({
  save: (val) => {
    if (!val) return null;
    if (val.length === 10) val = `${val}T${new Date().toTimeString().split(' ')[0]}`;
    return tm.fromDate(new Date(val));
  },
  get: (val, fmt) => {
    const sec = val?.seconds ?? (val?.type?.includes?.('timestamp') ? val.seconds : null);
    const fec = val?.toDate?.() || (sec && new Date(sec * 1000)) || (typeof val === 'number' && new Date(val * 1000));
    if (!fec) return '';
    const ajustada = new Date(fec.getTime() - fec.getTimezoneOffset() * 60000);
    if (fmt === 'full') return ajustada.toISOString().slice(0, 16);
    if (fmt === 'local') return fec.toLocaleDateString();
    return ajustada.toISOString().split('T')[0];
  }
});

// ── 17. COPIAR TEXTO: wicopy ─────────────────────────────────
export const wicopy = (txt, elm = null, msg = '¡Copiado!') => {
  const getCnt = () => {
    if (typeof txt === 'string') {
      if (txt.trim().match(/^[.#\[]/)) {
        const el = document.querySelector(txt);
        if (el) return 'value' in el ? el.value : el.textContent || '';
      }
      return txt;
    }
    if (txt instanceof HTMLElement) {
      return 'value' in txt ? txt.value : txt.textContent || '';
    }
    return String(txt ?? '');
  };
  const cnt = getCnt();
  const fin = () => elm ? wiTip(elm, msg, 'mco', 1500) : console.log(`${msg}: ${cnt}`);
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(cnt).then(fin).catch(() => {
      const t = document.createElement('textarea');
      t.value = cnt;
      Object.assign(t.style, { position: 'absolute', left: '-9999px' });
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      t.remove();
      fin();
    });
  } else {
    const t = document.createElement('textarea');
    t.value = cnt;
    Object.assign(t.style, { position: 'absolute', left: '-9999px' });
    document.body.appendChild(t);
    t.select();
    document.execCommand('copy');
    t.remove();
    fin();
  }
};

// ── 18. CLICK SUMATORIO: wiSuma ──────────────────────────────
export const wiSuma = (sel, fn, num = 5) => {
  let cont = 0;
  document.addEventListener('click', (e) => {
    const target = e.target.closest(sel);
    if (target) {
      if (++cont === num) {
        fn();
        cont = 0;
      }
    }
  });
};

// ── 19. STRING FORMATTERS: year, Mayu, Capi, mis10 ───────────
export const year = () => new Date().getFullYear();
export const Mayu = (ltr) => ltr.toUpperCase();
export const Capi = (txt = '') => txt ? txt[0].toUpperCase() + txt.slice(1) : '';
export const mis10 = (txt) => txt.length <= 10 ? txt : txt.substring(0, 10) + '...';

// ── 20. CLASES Y TIMEOUTS DOM: adrm, adtm, adup ──────────────
export const adrm = (a, b) => {
  const el = typeof a === 'string' ? document.querySelector(a) : a;
  if (!el) return;
  el.classList.add(b);
  if (el.parentNode) {
    [...el.parentNode.children].forEach(sib => {
      if (sib !== el) sib.classList.remove(b);
    });
  }
};

export const adtm = (se, cl, ti, tf) => {
  const el = typeof se === 'string' ? document.querySelector(se) : se;
  if (!el) return;
  el.textContent = ti;
  el.classList.add(cl);
  setTimeout(() => {
    el.textContent = tf;
    el.classList.remove(cl);
  }, 1800);
};

export const adup = (x, y) => {
  const el = typeof x === 'string' ? document.querySelector(x) : x;
  if (!el) return;
  el.classList.add('updating');
  el.textContent = y;
  setTimeout(() => el.classList.remove('updating'), 500);
};

// ── 21. RUTAS URL: wiPath ────────────────────────────────────
export const wiPath = {
  limpiar(ruta) {
    const base = import.meta?.env?.BASE_URL || '/';
    const guar = typeof sessionStorage !== 'undefined' ? sessionStorage.ghPath : null;
    if (guar) { sessionStorage.removeItem('ghPath'); return guar.replace(/^\/[a-zA-Z0-9_-]+(\/v\d+)?/, '') || '/'; }
    let r = base !== '/' && ruta?.startsWith(base) ? ruta.slice(base.length - 1) || '/' : ruta || '/';
    if (r !== '/' && !r.startsWith('/')) r = '/' + r;
    return r;
  },
  poner(ruta, titulo = '') {
    if (typeof history !== 'undefined') {
      history.pushState({ ruta }, titulo, ruta);
      if (titulo) document.title = titulo;
    }
  },
  params: () => typeof location !== 'undefined' ? Object.fromEntries(new URLSearchParams(location.search)) : {},
  get actual() { return typeof location !== 'undefined' ? this.limpiar(location.pathname) : '/'; }
};

// ── 22. TRANSICIÓN FADE SUAVE: wiFade ────────────────────────
export const wiFade = (() => {
  const activeFades = new WeakMap();
  return async (sel, html, dur = 50) => {
    const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (!el) return;
    
    // Incrementar e identificar la ejecución actual para prevenir colisiones asíncronas
    const runId = (activeFades.get(el) || 0) + 1;
    activeFades.set(el, runId);
    
    el.style.willChange = 'opacity';
    el.style.transition = `opacity ${dur}ms ease`;
    el.style.opacity = '0';
    
    await new Promise(r => setTimeout(r, dur));
    if (activeFades.get(el) !== runId) return; // Abortado por una navegación posterior
    
    el.innerHTML = html;
    el.style.opacity = '1';
    
    await new Promise(r => setTimeout(r, dur));
    if (activeFades.get(el) !== runId) return; // Abortado por una navegación posterior
    
    el.style.transition = '';
    el.style.willChange = '';
    activeFades.delete(el);
  };
})();

// ── 23. NOMBRES & AVATAR PARSERS: Capit, NombreApellido, getNombre, avatar ──
export const Capit = (txt = '') => txt.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

export const NombreApellido = (nombres = '') => {
  const p = nombres.trim().split(/\s+/).filter(Boolean);
  return p.length <= 1 ? Capit(nombres) : `${Capit(p[0])} ${Capit(p[p.length - 1])}`;
};

export const getNombre = (nombres = '') => Capit(nombres.trim().split(/\s+/)[0] || nombres);

export const avatar = (nombres = '') => {
  const p = nombres.trim().split(/\s+/).filter(Boolean);
  return (p[p.length - 1]?.[0] ?? p[0]?.[0] ?? 'U').toUpperCase();
};

// ── 24. FECHAS Y TIEMPO RELATIVO: fechaHoy, formatearFechaParaInput, formatearFechaHora, wiTiempo, calcMeses ──
export const fechaHoy = () => new Date().toLocaleDateString('es-PE', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

export const formatearFechaParaInput = (ts) => {
  if (!ts) return '';
  const d = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toISOString().split('T')[0];
};

export const formatearFechaHora = (ts) => {
  if (!ts) return '—';
  const d = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' })
       + ' ' + d.toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' });
};

export const wiTiempo = (ts) => {
  if (!ts) return '—';
  const diff = Date.now() - (ts?.seconds ? ts.seconds * 1000 : ts);
  const s = Math.floor(diff / 1000);
  if (s < 60)  return 'Hace un momento';
  const m = Math.floor(s / 60);
  if (m < 60)  return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `Hace ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `Hace ${d}d`;
  return formatearFechaHora(ts);
};

export const calcMeses = (desde) => {
  const h = new Date(), f = new Date(desde);
  return (h.getFullYear() - f.getFullYear()) * 12 + (h.getMonth() - f.getMonth());
};

// ── 25. AUTO-SAVE DE SESIÓN: gosave, getsave, gosaves, getsaves ──
export function gosave(tis, ele) {
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => savels(tis, ele, 168));
  }
}

export function getsave(sv, fn) {
  const mvl = getls(sv);
  if (mvl) fn(mvl);
}

export function gosaves(sel, attr, fn) {
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      document.querySelectorAll(sel).forEach(el => {
        const key = el.getAttribute(attr);
        if (key) savels(key, fn(el), 168);
      });
    });
  }
}

export function getsaves(sel, attr, fn) {
  document.querySelectorAll(sel).forEach(el => {
    const key = el.getAttribute(attr);
    if (key) {
      const val = getls(key);
      if (val) fn(el, val);
    }
  });
}

// ── 26. RATE LIMIT: wiRateLimit ──────────────────────────────
export function wiRateLimit(key, max = 5, hasta = 'dia') {
  const K = `limiteHoy_${key}`;
  let s = (() => {
    try {
      if (typeof localStorage === 'undefined') return null;
      const item = localStorage.getItem(K);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  })() ?? { n: 0, bloqueadoHasta: 0 };

  if (Date.now() < s.bloqueadoHasta) {
    const min = Math.ceil((s.bloqueadoHasta - Date.now()) / 60000);
    return { ok: false, min, fail: () => {}, reset: () => { if (typeof localStorage !== 'undefined') localStorage.removeItem(K); } };
  }
  if (s.bloqueadoHasta > 0) s = { n: 0, bloqueadoHasta: 0 };
  return {
    ok: true,
    min: 0,
    fail() {
      if (++s.n >= max) {
        const d = new Date();
        s.bloqueadoHasta = hasta === 'dia' ? (d.setHours(24, 0, 0, 0), d.getTime()) : Date.now() + hasta;
        s.n = 0;
      }
      if (typeof localStorage !== 'undefined') localStorage.setItem(K, JSON.stringify(s));
    },
    reset: () => { if (typeof localStorage !== 'undefined') localStorage.removeItem(K); }
  };
}

// SUPERFUN — Ejecución diferida en interacción (una vez por sesión/navegador)
export const superFun = (() => {
  let c = false;
  try { c = localStorage.getItem('superFun') === 'true'; } catch {}
  const run = (fn) => {
    try { fn(); } catch(e) { console.error('superFun:', e); }
    try { localStorage.setItem('superFun', 'true'); } catch {}
  };
  return (fn) => {
    if (c) {
      run(fn);
    } else {
      const trigger = () => {
        run(fn);
        ['touchstart', 'scroll', 'click', 'mousemove'].forEach(ev => document.removeEventListener(ev, trigger));
      };
      ['touchstart', 'scroll', 'click', 'mousemove'].forEach(ev => document.addEventListener(ev, trigger, { once: true }));
    }
  };
})();
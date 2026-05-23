// ── wiFade ─────────────────────────────────────────────────────────────────
export const wiFade = async (sel, html) => {
  const el = document.querySelector(sel);
  if (!el) return;
  el.style.transition = "opacity 0.15s ease";
  el.style.opacity = "0";
  await new Promise((r) => setTimeout(r, 150));
  el.innerHTML = html;
  requestAnimationFrame(() => {
    el.style.opacity = "1";
  });
};

// ── wiPath ─────────────────────────────────────────────────────────────────
export const wiPath = {
  get actual() {
    return window.location.pathname;
  },
  limpiar: (ruta) => ruta.replace(/\/+$/, "") || "/",
  poner: (ruta, title = "") => {
    if (title) document.title = title;
    history.pushState({ ruta }, "", ruta);
  },
};

// ── getLanIP ───────────────────────────────────────────────────────────────
const getLanIPWebRTC = () =>
  new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel("");
      pc.createOffer()
        .then((o) => pc.setLocalDescription(o))
        .catch(() => resolve("localhost"));
      const found = new Set();
      pc.onicecandidate = (e) => {
        if (!e?.candidate) return;
        const match = e.candidate.candidate.match(
          /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/,
        );
        if (
          match &&
          !match[1].startsWith("127") &&
          !match[1].startsWith("169")
        ) {
          found.add(match[1]);
          // prefer 192.168.x.x
          if (match[1].startsWith("192.168")) {
            pc.close();
            resolve(match[1]);
          }
        }
      };
      setTimeout(
        () => resolve(found.values().next().value || "192.168.1.x"),
        2500,
      );
    } catch {
      resolve("192.168.1.x");
    }
  });

export const getLanIP = async () => {
  if ("__TAURI__" in window) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      return await invoke("get_lan_ip");
    } catch {
      /* fallback */
    }
  }
  return getLanIPWebRTC();
};

// ── wiVista ────────────────────────────────────────────────────────────────
export const wiVista = (
  sel,
  fn,
  {
    stagger = 0,
    anim = "",
    threshold = 0.1,
    once = true,
    root = null,
    onExit = null,
    delay = 0,
  } = {},
) => {
  const els = [...document.querySelectorAll(sel)];
  if (!els.length) return null;
  const obs = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        const i = els.indexOf(e.target);
        if (e.isIntersecting) {
          setTimeout(
            () => {
              anim && e.target.classList.add("wi_visible");
              fn?.(e.target, i);
            },
            delay + stagger * i,
          );
          once && obs.unobserve(e.target);
        } else onExit?.(e.target, i);
      }),
    { rootMargin: "20px", threshold, root },
  );
  els.forEach((el) => {
    anim && el.classList.add(anim);
    obs.observe(el);
  });
  return obs;
};

// ── herowi ─────────────────────────────────────────────────────────────────
export const herowi = (() => {
  let init = 0;
  return (sel = "[data-herowi]", defSt = 45) => {
    if (!init) {
      document.head.insertAdjacentHTML(
        "beforeend",
        `<style>
        @keyframes hwi_fade { from { opacity: 0; transform: translateY(3vh); } to { opacity: 1; transform: translateY(0); } }
        .hwi { animation: hwi_fade 0.8s cubic-bezier(0.4, 0, 0.2, 1) backwards; }
      </style>`,
      );
      init = 1;
    }
    const _resolve = (t) =>
      typeof t === "string" ? [...document.querySelectorAll(t)] : [t];
    (typeof sel === "string"
      ? [...document.querySelectorAll(sel)]
      : [].concat(sel).flatMap(_resolve)
    ).forEach((t) => {
      const els = (
        t.hasAttribute("data-herowi") && t.children.length
          ? [...t.children]
          : [t]
      ).filter((e) => !e.dataset.hi);
      if (els.length) {
        const st = parseInt(t.dataset.herowi) || defSt;
        els.forEach((e, i) => {
          e.style.animationDelay = `${Math.min(i * st, 800)}ms`;
          e.classList.add("hwi");
          e.dataset.hi = 1;
        });
      }
    });
  };
})();

// ── showi ──────────────────────────────────────────────────────────────────
export const showi = (() => {
  let ini = 0;
  return (sel = "[data-showi]", dSt = 45) => {
    if (!ini) {
      document.head.insertAdjacentHTML(
        "beforeend",
        `<style>.swi{opacity:0;transform:translateY(3vh);transition:all .7s cubic-bezier(.4,0,.2,1)}</style>`,
      );
      ini = 1;
    }
    let n = 0,
      id;
    const o = new IntersectionObserver((es) => {
      es.filter((e) => e.isIntersecting).forEach((e) => {
        const t = e.target;
        o.unobserve(t);
        setTimeout(
          () => {
            t.style.opacity = 1;
            t.style.transform = "translateY(0)";
            setTimeout(() => {
              t.classList.remove("swi");
              t.style.opacity = t.style.transform = "";
            }, 750);
          },
          n++ * (t.dataset.st || dSt),
        );
      });
      clearTimeout(id);
      id = setTimeout(() => (n = 0), 100);
    });
    []
      .concat(sel)
      .flatMap((s) =>
        typeof s === "string" ? [...document.querySelectorAll(s)] : s,
      )
      .forEach((p) => {
        (p.hasAttribute("data-showi") && p.children.length
          ? [...p.children]
          : [p]
        )
          .filter((e) => !e.dataset.i)
          .forEach((e) => {
            e.dataset.i = 1;
            e.dataset.st = parseInt(p.dataset?.showi) || dSt;
            e.classList.add("swi");
            o.observe(e);
          });
      });
  };
})();

// ── wiSpin ─────────────────────────────────────────────────────────────────
export const wiSpin = (btn, act = true, txt = "") => {
  const el = typeof btn === "string" ? document.querySelector(btn) : btn;
  if (!el) return;
  if (act) {
    const texto = txt || el.textContent.trim();
    el.dataset.txt = texto;
    el.disabled = true;
    el.innerHTML = `${texto} <i class="fas fa-spinner fa-spin"></i>`;
  } else {
    el.disabled = false;
    el.textContent = el.dataset.txt || txt || "Continuar";
  }
};

// ── wiSmart ────────────────────────────────────────────────────────────────
export const wiSmart = (() => {
  const ok = new Set();
  const run = (o) => {
    Object.entries(o).forEach(([t, v]) =>
      [].concat(v).forEach((it) => {
        const k = `${t}:${it}`;
        if (ok.has(k)) return;
        ok.add(k);
        if (t === "css" && !document.querySelector(`link[href="${it}"]`)) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = it;
          document.head.appendChild(link);
        } else if (
          t === "js" &&
          typeof it === "string" &&
          !document.querySelector(`script[src="${it}"]`)
        ) {
          const s = document.createElement("script");
          s.src = it;
          s.async = true;
          document.head.appendChild(s);
        } else if (typeof it === "function") {
          it()?.catch?.((e) => console.error("wiSmart:", e));
        }
      }),
    );
  };
  let loaded = false;
  return (o) => {
    if (loaded) {
      run(o);
      return;
    }
    const handler = () => {
      loaded = true;
      run(o);
      document.removeEventListener("mousemove", handler);
    };
    document.addEventListener("mousemove", handler, { once: true });
    // Also run after 2s max (for keyboard-only users)
    setTimeout(() => {
      if (!loaded) {
        loaded = true;
        run(o);
      }
    }, 2000);
  };
})();

// ── Saludar ────────────────────────────────────────────────────────────────
export const Saludar = () => {
  const hrs = new Date().getHours();
  return hrs >= 5 && hrs < 12
    ? "Buenos días"
    : hrs >= 12 && hrs < 18
      ? "Buenas tardes"
      : "Buenas noches";
};

// ── Notificacion ───────────────────────────────────────────────────────────
export function Notificacion(msg, tipo = "error", tiempo = 3500) {
  const ico =
    {
      success: "fa-check-circle",
      error: "fa-times-circle",
      warning: "fa-exclamation-triangle",
      info: "fa-info-circle",
    }[tipo] || "fa-info-circle";
  let cont = document.getElementById("wii_notifs");
  if (!cont) {
    cont = document.createElement("div");
    cont.id = "wii_notifs";
    cont.style.cssText =
      "position:fixed;top:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:.5rem;";
    document.body.appendChild(cont);
  }
  const not = document.createElement("div");
  not.style.cssText = `background:var(--wb);border-left:4px solid var(--${tipo});box-shadow:0 4px 12px rgba(0,0,0,.15);border-radius:8px;padding:1rem 1.2rem;display:flex;align-items:center;gap:.6rem;opacity:0;transform:translateX(20px);transition:all .3s ease;min-width:260px;`;
  not.innerHTML = `<i class="fas ${ico}" style="color:var(--${tipo})"></i><span style="flex:1;color:var(--tx);font-size:var(--fz_m2)">${msg}</span><button style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--tx3);padding:0 0 0 .5rem">&times;</button>`;
  cont.appendChild(not);
  requestAnimationFrame(() => {
    not.style.opacity = "1";
    not.style.transform = "translateX(0)";
  });
  const cerrar = () => {
    not.style.opacity = "0";
    not.style.transform = "translateX(20px)";
    setTimeout(() => not.remove(), 300);
  };
  not.querySelector("button").onclick = cerrar;
  setTimeout(cerrar, tiempo);
}

// ── Mensaje ────────────────────────────────────────────────────────────────
export function Mensaje(msg, tipo = "success") {
  document.querySelectorAll(".wii_alert").forEach((el) => el.remove());
  const ico = {
    success: "fa-circle-check",
    error: "fa-circle-exclamation",
    warning: "fa-exclamation-triangle",
    info: "fa-info-circle",
  }[tipo];
  const el = document.createElement("div");
  el.className = "wii_alert";
  el.style.cssText =
    "position:fixed;top:20px;left:50%;transform:translateX(-50%);padding:12px 20px;border-radius:8px;background:var(--wb);color:var(--tx);border-left:4px solid var(--" +
    tipo +
    ");box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:10500;display:flex;align-items:center;gap:10px;min-width:300px;";
  el.innerHTML = `<i class="fas ${ico}" style="color:var(--${tipo})"></i><span>${msg}</span>`;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity .3s";
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

// ── localStorage con TTL ───────────────────────────────────────────────────
export function savels(clave, valor, horas = 24 * 365) {
  try {
    localStorage.setItem(
      clave,
      JSON.stringify({ value: valor, expiry: Date.now() + horas * 3600000 }),
    );
    return true;
  } catch (e) {
    return false;
  }
}

export function getls(clave) {
  try {
    const item = localStorage.getItem(clave);
    if (!item) return null;
    const parsed = JSON.parse(item);
    if (!parsed || Date.now() > parsed.expiry) {
      localStorage.removeItem(clave);
      return null;
    }
    return parsed.value;
  } catch (e) {
    localStorage.removeItem(clave);
    return null;
  }
}

export function removels(...claves) {
  claves
    .flat()
    .flatMap((c) =>
      typeof c === "string" ? c.split(/[,\s]+/).filter(Boolean) : c,
    )
    .forEach((clave) => localStorage.removeItem(clave));
}
removels.except = (keep = []) => {
  const saved = keep.map((k) => [k, localStorage.getItem(k)]);
  localStorage.clear();
  saved.forEach(([k, v]) => v !== null && localStorage.setItem(k, v));
};

// ── wiTip ──────────────────────────────────────────────────────────────────
export function wiTip(elmOrTxt, txt, tipo = "top", tiempo = 1800) {
  if (!wiTip._css) {
    document.head.insertAdjacentHTML(
      "beforeend",
      '<style id="wiTip-css">.wiTip{position:fixed;color:var(--txa);z-index:99999;padding:.8vh 1.2vh;border-radius:.6vh;font-size:var(--fz_s4);font-weight:500;max-width:25vh;box-shadow:0 .4vh 1.2vh rgba(0,0,0,.2);opacity:0;transform:translateY(-.3vh);transition:all .2s cubic-bezier(.4,0,.2,1);pointer-events:none;backdrop-filter:blur(.4vh)}.wiTip.show{opacity:1;transform:translateY(0)}.wiTip::after{content:"";position:absolute;top:100%;left:50%;margin-left:-.6vh;border:.6vh solid transparent;border-top-color:inherit}</style>',
    );
    let t;
    document.addEventListener(
      "mouseenter",
      (e) => {
        if (!e.target.dataset.witip) return;
        clearTimeout(t);
        wiTip._ver(
          e.target,
          e.target.dataset.witip,
          e.target.dataset.wtipo || "top",
          e.target.dataset.wtiempo || 1800,
        );
      },
      true,
    );
    document.addEventListener(
      "mouseleave",
      (e) => {
        if (!e.target.dataset.witip) return;
        document
          .querySelectorAll(".wiTip")
          .forEach((el) => el.classList.remove("show"));
        t = setTimeout(
          () =>
            document.querySelectorAll(".wiTip").forEach((el) => el.remove()),
          200,
        );
      },
      true,
    );
    wiTip._css = true;
  }
  if (typeof elmOrTxt === "string" && !txt)
    return `data-witip="${elmOrTxt}" data-wtipo="${tipo}" data-wtiempo="${tiempo}"`;
  return wiTip._ver(elmOrTxt, txt, tipo, tiempo);
}
wiTip._ver = (elm, txt, tipo, tiempo) => {
  document.querySelectorAll(".wiTip").forEach((el) => el.remove());
  const c =
    {
      success: "var(--success)",
      error: "var(--error)",
      warning: "var(--warning)",
      info: "var(--info)",
    }[tipo] || "var(--mco)";
  const tip = document.createElement("div");
  tip.className = "wiTip";
  tip.style.cssText = `background:${c};border-top-color:${c}`;
  tip.innerHTML = `<span>${txt}</span>`;
  document.body.appendChild(tip);
  const r = elm.getBoundingClientRect();
  const tipW = tip.offsetWidth,
    tipH = tip.offsetHeight;
  tip.style.left =
    Math.max(
      8,
      Math.min(r.left + r.width / 2 - tipW / 2, innerWidth - tipW - 8),
    ) + "px";
  tip.style.top = r.top - tipH - 8 + "px";
  requestAnimationFrame(() => {
    tip.classList.add("show");
    if (tiempo > 0)
      setTimeout(() => {
        tip.classList.remove("show");
        setTimeout(() => tip.remove(), 200);
      }, tiempo);
  });
};

// ── Modales ────────────────────────────────────────────────────────────────
export const abrirModal = (id) => {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.add("active");
  document.body.classList.add("modal-open");
  setTimeout(
    () => m.querySelectorAll("input,select,textarea,button")[0]?.focus(),
    20,
  );
};
export const cerrarModal = (id) => {
  const m = document.getElementById(id);
  if (m) m.classList.remove("active");
  if (!document.querySelector(".wiModal.active"))
    document.body.classList.remove("modal-open");
};
export const cerrarTodos = () => {
  document
    .querySelectorAll(".wiModal")
    .forEach((m) => m.classList.remove("active"));
  document.body.classList.remove("modal-open");
};
// Inject modal CSS once
if (!document.getElementById("wiModal_css")) {
  document.head.insertAdjacentHTML(
    "beforeend",
    `<style id="wiModal_css">
    .wiModal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:10000;justify-content:center;align-items:center;backdrop-filter:blur(2px)}
    .wiModal.active{display:flex}
    .modalBody{position:relative;border-radius:1vh;background:var(--wb);box-shadow:0 8px 32px rgba(0,0,0,.2);width:92%;max-width:540px;max-height:90vh;overflow:auto;animation:mp .22s ease;z-index:10001}
    @keyframes mp{from{transform:translateY(10px) scale(.98);opacity:.6}to{transform:none;opacity:1}}
    .modalX{position:absolute;top:12px;right:12px;background:none;border:none;color:var(--mco);font-size:1.4rem;cursor:pointer}
    body.modal-open{overflow:hidden}
  </style>`,
  );
  document.addEventListener("click", (e) => {
    if (e.target.closest(".modalX")) cerrarTodos();
  });
  document.addEventListener("click", (e) => {
    if (
      e.target.classList.contains("wiModal") &&
      e.target.classList.contains("active")
    )
      cerrarTodos();
  });
}

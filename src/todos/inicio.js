import { app, version, by } from '../wii.js';
import { wiVista, Saludar, wiTip } from '../widev.js';

// ── DATA ──────────────────────────────────────────────────────
const roles = [
  'Escritorio Remoto de Baja Latencia 💻',
  'Conexión Directa WebRTC Peer-to-Peer ⚡',
  'Encendido Local Wake-on-LAN 🔌',
  'Seguridad Avanzada con PIN Cifrado 🔐',
  'Transferencia de Archivos Ultra-Rápida 📁'
];

const stats = [
  { valor: 60,  label: 'Transmisión de Pantalla', sufijo: ' FPS' },
  { valor: 25,  label: 'Latencia Promedio de Red', sufijo: ' ms' },
  { valor: 100, label: 'Cifrado Extremo a Extremo', sufijo: '%' }
];

const features = [
  { id: 'webrtc', icon: 'fa-network-wired', color: '#00f3ff', nombre: 'Transmisión WebRTC', desc: 'Conexión directa P2P para rendimiento superior',
    items: [{ icon: 'fa-bolt', name: 'Ultra Baja Latencia', desc: 'Tiempos de respuesta de menos de 30ms en red local.' }, { icon: 'fa-shield-halved', name: 'Canal Seguro', desc: 'Transmisión de video y audio encriptada con SRTP.' }, { icon: 'fa-signal', name: 'Bitrate Dinámico', desc: 'Se adapta al ancho de banda disponible automáticamente.' }] },
  { id: 'rendimiento', icon: 'fa-gauge-high', color: '#29C72E', nombre: '60 FPS Estables', desc: 'Codificación y decodificación por hardware',
    items: [{ icon: 'fa-microchip', name: 'Aceleración GPU', desc: 'Usa la potencia de tu tarjeta gráfica (NVIDIA, AMD, Intel).' }, { icon: 'fa-video', name: 'Codificadores AV1 y H.265', desc: 'Máxima calidad de imagen con el menor consumo de datos.' }, { icon: 'fa-battery-full', name: 'Consumo Optimizado', desc: 'Batería de larga duración en clientes móviles.' }] },
  { id: 'wol', icon: 'fa-power-off', color: '#FFDA34', nombre: 'Wake-on-LAN Local', desc: 'Enciende tus computadoras a distancia',
    items: [{ icon: 'fa-wifi', name: 'Encendido Un Clic', desc: 'Manda el paquete mágico directamente desde tu celular.' }, { icon: 'fa-bed', name: 'Optimizado para Camarote', desc: 'Despierta tu laptop de oficina desde tu cama sin levantarte.' }, { icon: 'fa-check', name: 'Sin Configuración WAN', desc: 'Funciona directamente en tu subred Wi-Fi local.' }] },
  { id: 'seguridad', icon: 'fa-lock', color: '#7000FF', nombre: 'Seguridad Local', desc: 'Tus credenciales nunca tocan la nube',
    items: [{ icon: 'fa-key', name: 'PIN de 6 dígitos', desc: 'Validación local mediante desafío/respuesta criptográfico.' }, { icon: 'fa-cloud-slash', name: 'Privacidad Absoluta', desc: 'Firebase solo actúa como señalador; no almacena tus datos.' }, { icon: 'fa-user-check', name: 'Dispositivos Autorizados', desc: 'Lista blanca de equipos permitidos para conexión.' }] },
  { id: 'multiplataforma', icon: 'fa-laptop-code', color: '#0EBEFF', nombre: 'Multiplataforma', desc: 'Controla desde cualquier dispositivo',
    items: [{ icon: 'fa-windows', name: 'PC Client (Rust)', desc: 'Servidor ultraligero y rápido para Windows con Tauri v2.' }, { icon: 'fa-android', name: 'Android Client', desc: 'Visualizador nativo con controles táctiles avanzados.' }, { icon: 'fa-globe', name: 'Consola Web SPA', desc: 'Acceso y visualización directa desde cualquier navegador.' }] },
  { id: 'utilidades', icon: 'fa-folder-open', color: '#FF8F00', nombre: 'Herramientas Extra', desc: 'Funciones para el trabajo diario',
    items: [{ icon: 'fa-file-import', name: 'Transferencia de Archivos', desc: 'Envía y recibe carpetas a velocidad de red local.' }, { icon: 'fa-copy', name: 'Portapapeles Compartido', desc: 'Copia en tu PC y pega en tu celular o viceversa.' }, { icon: 'fa-keyboard', name: 'Teclado Virtual', desc: 'Diseños optimizados para móviles y atajos de sistema.' }] }
];

const beneficios = [
  { icon: 'fa-circle-check', titulo: '100% Configuración Simple', desc: 'Sin configuraciones complejas de routers ni redirección de puertos. Regístrate, vincula tu PC en dos pasos y empieza a controlar.' },
  { icon: 'fa-shield-halved', titulo: 'Conexión Segura P2P', desc: 'Tus conexiones son directas de dispositivo a dispositivo. El video y los comandos de control viajan cifrados de extremo a extremo.' },
  { icon: 'fa-bolt', titulo: 'Máxima Velocidad', desc: 'Programado sobre Rust nativo en el host y Kotlin en el celular para un rendimiento excepcional y tiempos de respuesta inmediatos.' }
];

// ── PLANTILLAS ────────────────────────────────────────────────
const tplStat = s => `
  <div class="ini_stat">
    <div class="ini_stat_n" data-target="${s.valor}" data-sufijo="${s.sufijo}">0</div>
    <div class="ini_stat_l">${s.label}</div>
  </div>`;

const tplFeature = f => `
  <div class="ini_cat_card" style="--cc:${f.color}">
    <div class="ini_cat_bar"></div>
    <div class="ini_cat_top">
      <div class="ini_cat_ico"><i class="fas ${f.icon}"></i></div>
      <div class="ini_cat_info"><h3>${f.nombre}</h3><p>${f.desc}</p></div>
    </div>
    <ul class="ini_cat_tools">
      ${f.items.map(it => `
        <li><div class="ini_tool_a">
          <i class="fas ${it.icon}"></i>
          <div><strong>${it.name}</strong><span>${it.desc}</span></div>
          <i class="fas fa-check ini_ext" style="color:var(--success)"></i>
        </div></li>`).join('')}
    </ul>
  </div>`;

const tplBeneficio = (b, i) => `
  <div class="ini_about_card" style="--d:${i * .15}s">
    <div class="ini_card_ico"><i class="fas ${b.icon}"></i></div>
    <h3>${b.titulo}</h3>
    <p>${b.desc}</p>
  </div>`;

let timerInterval;

// ── RENDER ────────────────────────────────────────────────────
export const render = () => `
<div class="ini_wrap">

  <!-- ===== HERO ===== -->
  <section class="ini_hero">
    <div class="ini_hero_content">

      <div class="ini_saludo" style="--d:0s">
        <span>${Saludar()}</span><span class="ini_wave">👋</span>
      </div>

      <h1 class="ini_titulo" style="--d:.18s">
        Controla tus Equipos en Tiempo Real con <span class="ini_grad">${app}</span>
      </h1>

      <div class="ini_roles" style="--d:.36s">
        ${roles.map((r, i) => `<span class="ini_role${i === 0 ? ' active' : ''}">${r}</span>`).join('')}
      </div>

      <p class="ini_sub" style="--d:.54s">
        La plataforma premium de acceso remoto de código abierto. Administra, enciende y controla tu PC de forma segura desde tu móvil o navegador con tecnología WebRTC P2P de ultra baja latencia.
      </p>

      <div class="ini_stats" id="in_stats" style="--d:.72s">
        ${stats.map(tplStat).join('')}
      </div>

      <div class="ini_btns" style="--d:.9s">
        <a href="/login" class="ini_btn_p"><i class="fas fa-arrow-right-to-bracket"></i> Empezar Gratis</a>
      </div>

    </div>

    <div class="ini_hero_visual">
      <div class="ini_nw_preview" style="--d:.3s; padding: 2.5vh; max-width: 340px; height: auto;">
        <div class="ini_nw_head" style="height: auto; padding: 1vh 0; display: flex; justify-content: space-between; border-bottom: 2px solid var(--brd); background: transparent;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-desktop" style="color: var(--mco); font-size: 1.4rem;"></i>
            <span style="font-weight: 800; font-size: 0.95rem; color: var(--tx);">${app} Panel</span>
          </div>
          <div style="font-size: 0.65rem; font-weight: 700; background: var(--bg5); color: var(--mco); padding: 2px 6px; border-radius: 20px;">
            ${version}
          </div>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 2vh; padding: 2.5vh 0 1vh;">
          <div class="txc" style="text-align:left;">
            <span style="font-size: 0.7rem; font-weight: 600; color: var(--tx3); text-transform: uppercase; letter-spacing: 0.5px;">PC Seleccionada</span>
            <h3 id="widget_nombre" style="font-size: 1.2rem; font-weight: 800; color: var(--mco); margin-top: 0.5vh;"><i class="fas fa-laptop"></i> Laptop Oficina</h3>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; text-align: center;">
            <div style="background: var(--bg1); padding: 6px; border-radius: 8px; border: 1px solid var(--brd);">
              <div id="wd_dias" style="font-size: 1rem; font-weight: 800; color: var(--tx);">60</div>
              <div style="font-size: 0.5rem; color: var(--tx3); font-weight: 600;">FPS</div>
            </div>
            <div style="background: var(--bg1); padding: 6px; border-radius: 8px; border: 1px solid var(--brd);">
              <div id="wd_horas" style="font-size: 1rem; font-weight: 800; color: var(--tx);">14</div>
              <div style="font-size: 0.5rem; color: var(--tx3); font-weight: 600;">MS PING</div>
            </div>
            <div style="background: var(--bg1); padding: 6px; border-radius: 8px; border: 1px solid var(--brd);">
              <div id="wd_mins" style="font-size: 1rem; font-weight: 800; color: var(--tx);">P2P</div>
              <div style="font-size: 0.5rem; color: var(--tx3); font-weight: 600;">RED</div>
            </div>
            <div style="background: var(--bg1); padding: 6px; border-radius: 8px; border: 1px solid var(--brd);">
              <div id="wd_segs" style="font-size: 1rem; font-weight: 800; color: var(--tx);">4.5</div>
              <div style="font-size: 0.5rem; color: var(--tx3); font-weight: 600;">MBPS</div>
            </div>
          </div>
          
          <div style="border-top: 1px solid var(--brd); padding-top: 2vh; display: flex; flex-direction: column; gap: 1.5vh;">
            <div style="display: flex; flex-direction: column; gap: 0.4vh;">
              <label style="font-size: 0.7rem; font-weight: 700; color: var(--tx2); text-align: left;">Probar Simulador de Conexión:</label>
              <input type="text" id="widget_input_nombre" value="Laptop Oficina" placeholder="Nombre de tu PC" style="font-size: 0.8rem; padding: 0.8vh 1.2vh; border-radius: 6px; border: 1px solid var(--brd); background: var(--inp); color: var(--tx);" />
            </div>
            <a href="/login" class="ini_btn_p" style="padding: 1vh; font-size: 0.8rem; text-align: center; border-radius: 6px;"><i class="fas fa-play"></i> Iniciar Conexión</a>
          </div>
        </div>
      </div>
      <div class="ini_ftech ini_ft1" style="--d:.5s"  ${wiTip('WebRTC')}><i class="fas fa-network-wired"></i></div>
      <div class="ini_ftech ini_ft2" style="--d:.65s" ${wiTip('Tauri Rust')}><i class="fas fa-bolt"></i></div>
      <div class="ini_ftech ini_ft3" style="--d:.8s"  ${wiTip('Ultra Rápido')}><i class="fas fa-gauge-high"></i></div>
      <div class="ini_ftech ini_ft4" style="--d:.95s" ${wiTip('Seguro')}><i class="fas fa-shield-halved"></i></div>
    </div>
  </section>

  <!-- ===== FUNCIONALIDADES ===== -->
  <section class="ini_cats_sec">
    <div class="ini_sec_head">
      <h2 class="ini_sec_tit">Los <span class="ini_grad">6 Pilares</span> de ${app}</h2>
      <div class="ini_sec_line"></div>
      <p class="ini_sec_desc">Arquitectura optimizada para control remoto en tiempo real de nivel empresarial</p>
    </div>
    <div class="ini_cats_grid">${features.map(tplFeature).join('')}</div>
  </section>

  <!-- ===== ¿POR QUÉ? ===== -->
  <section class="ini_about_sec">
    <div class="ini_sec_head">
      <h2 class="ini_sec_tit">¿Qué beneficios tienes al usar <span class="ini_grad">${app}?</span></h2>
      <div class="ini_sec_line"></div>
    </div>
    <div class="ini_about_grid">${beneficios.map(tplBeneficio).join('')}</div>
  </section>

  <!-- ===== CTA ===== -->
  <section class="ini_cta_sec">
    <div class="ini_cta_wrap">
      <i class="fas fa-desktop ini_cta_ico" style="color: var(--mco);"></i>
      <h2>Comienza a controlar tus equipos de forma remota hoy</h2>
      <p>Regístrate en segundos y descubre la fluidez de transmisión a 60 FPS sin configuraciones complejas.</p>
      <div class="ini_cta_chips">
        <a href="/login" class="ini_btn_p"><i class="fas fa-arrow-right-to-bracket"></i> Empezar Gratis</a>
      </div>
    </div>
  </section>

</div>`;

// ── INIT ──────────────────────────────────────────────────────
export const init = () => {
  let ri = 0;
  const rolesEl = document.querySelectorAll('.ini_role');
  const roleInterval = setInterval(() => { 
    rolesEl.forEach(x => x.classList.remove('active'));
    if (rolesEl.length > 0) {
      ri = (ri + 1) % rolesEl.length;
      rolesEl[ri]?.classList.add('active');
    }
  }, 2800);

  wiVista('#in_stats', () => {
    document.querySelectorAll('.ini_stat_n').forEach(el => {
      const target = +el.dataset.target;
      const suf = el.dataset.sufijo || '';
      let v = 0;
      const t = setInterval(() => {
        v += target / 50;
        if (v >= target) {
          el.textContent = target + suf;
          clearInterval(t);
        } else {
          el.textContent = Math.floor(v);
        }
      }, 28);
    });
  });

  wiVista('.ini_cat_card',   null, { anim: 'wi_fadeUp', stagger: 80  });
  wiVista('.ini_about_card', null, { anim: 'wi_fadeUp', stagger: 140 });

  const inputNombre = document.getElementById('widget_input_nombre');
  const widgetNombre = document.getElementById('widget_nombre');
  if (inputNombre && widgetNombre) {
    inputNombre.addEventListener('input', (e) => {
      const val = e.target.value.trim() || 'Laptop Oficina';
      widgetNombre.innerHTML = `<i class="fas fa-laptop"></i> ${val}`;
    });
  }

  // Simulate dynamically fluctuating values in connection widget (Ping/Bandwidth)
  const timer = () => {
    const wd_horas = document.getElementById('wd_horas');
    const wd_segs = document.getElementById('wd_segs');
    if (wd_horas) {
      // fluctuation in latency (10 - 30 ms)
      wd_horas.textContent = Math.floor(12 + Math.random() * 8);
    }
    if (wd_segs) {
      // fluctuation in network bandwidth usage (3.5 - 5.5 Mbps)
      wd_segs.textContent = (4.0 + Math.random() * 1.5).toFixed(1);
    }
  };

  timerInterval = setInterval(timer, 1500);

  window._inicio_timers = [roleInterval, timerInterval];

  console.log(`🚀 ${app} ${version} · Welcome Page OK`);
};

export const cleanup = () => {
  if (window._inicio_timers) {
    window._inicio_timers.forEach(t => clearInterval(t));
  }
  clearInterval(timerInterval);
};
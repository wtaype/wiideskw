import { savels, getls, Notificacion, Mensaje } from '../widev.js';

const defaults = {
  fps: 60,
  resolution: '1080p',
  quality: 85,
  port: 8765,
  encoder: 'auto',
  bitrate: 8000,
};

export const render = () => {
  if (!document.getElementById('css_config')) {
    document.head.insertAdjacentHTML('beforeend', `<style id="css_config">
      .cfg_wrap { padding: 2vh 0; display: flex; flex-direction: column; gap: 2vh; }
      .cfg_header { display: flex; align-items: center; justify-content: space-between; }
      .cfg_title { font-size: var(--fz_l1); font-weight: 800; color: var(--tx); display: flex; align-items: center; gap: 1vh; }
      .cfg_title i { color: var(--mco); }
      .cfg_grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2vh; }
      .cfg_section {
        background: var(--wb); border: 1px solid var(--brd); border-radius: 1.5vh;
        padding: 2.5vh; display: flex; flex-direction: column; gap: 1.8vh;
      }
      .cfg_section_title {
        font-size: var(--fz_m2); font-weight: 700; color: var(--tx);
        display: flex; align-items: center; gap: .8vh; padding-bottom: 1.2vh;
        border-bottom: 1px solid var(--brd);
      }
      .cfg_section_title i { color: var(--mco); }
      .cfg_field { display: flex; flex-direction: column; gap: .6vh; }
      .cfg_label {
        font-size: var(--fz_s4); font-weight: 600; color: var(--tx2);
        display: flex; align-items: center; justify-content: space-between;
      }
      .cfg_label span { color: var(--mco); font-family: 'Outfit', monospace; font-weight: 700; }
      .cfg_range { width: 100%; accent-color: var(--mco); }
      .cfg_options { display: flex; gap: .8vh; flex-wrap: wrap; }
      .cfg_opt {
        padding: .6vh 1.2vh; border-radius: .8vh; border: 1.5px solid var(--brd);
        background: var(--bg); color: var(--tx2); cursor: pointer; font-size: var(--fz_s4);
        font-weight: 600; transition: all var(--tr_f);
      }
      .cfg_opt:hover { border-color: var(--mco); color: var(--mco); }
      .cfg_opt.sel { background: var(--mco); color: var(--txa); border-color: var(--mco); }
      .cfg_save_row { display: flex; gap: 1vh; justify-content: flex-end; margin-top: .5vh; }
      .btn_save {
        padding: 1.2vh 3vh; background: var(--mco); color: var(--txa); border: none;
        border-radius: 1vh; font-weight: 700; font-size: var(--fz_m1); cursor: pointer;
        transition: all var(--tr_f); display: flex; align-items: center; gap: .6vh;
      }
      .btn_save:hover { filter: brightness(1.1); transform: translateY(-2px); }
      .btn_reset {
        padding: 1.2vh 2vh; background: var(--bg4); color: var(--tx2); border: 1px solid var(--brd);
        border-radius: 1vh; font-weight: 600; font-size: var(--fz_m1); cursor: pointer;
        transition: all var(--tr_f);
      }
      .btn_reset:hover { border-color: var(--error); color: var(--error); }
      @media (max-width: 900px) { .cfg_grid { grid-template-columns: 1fr; } }
    </style>`);
  }

  const cfg = {
    fps:        getls('wii_fps')        ?? defaults.fps,
    resolution: getls('wii_resolution') ?? defaults.resolution,
    quality:    getls('wii_quality')    ?? defaults.quality,
    port:       getls('wii_port')       ?? defaults.port,
    encoder:    getls('wii_encoder')    ?? defaults.encoder,
    bitrate:    getls('wii_bitrate')    ?? defaults.bitrate,
  };

  return `
  <div class="cfg_wrap">
    <div class="cfg_header">
      <h2 class="cfg_title"><i class="fas fa-sliders"></i> Configuración</h2>
    </div>

    <div class="cfg_grid" data-herowi="50">
      <!-- VIDEO -->
      <div class="cfg_section">
        <div class="cfg_section_title"><i class="fas fa-video"></i> Video</div>

        <div class="cfg_field">
          <div class="cfg_label">FPS <span id="fps_val">${cfg.fps}</span></div>
          <input type="range" class="cfg_range" id="inp_fps" min="15" max="120" step="15" value="${cfg.fps}" />
          <div class="cfg_options">
            <button class="cfg_opt${cfg.fps==15?' sel':''}" data-opt="fps" data-val="15">15</button>
            <button class="cfg_opt${cfg.fps==30?' sel':''}" data-opt="fps" data-val="30">30</button>
            <button class="cfg_opt${cfg.fps==60?' sel':''}" data-opt="fps" data-val="60">60</button>
            <button class="cfg_opt${cfg.fps==120?' sel':''}" data-opt="fps" data-val="120">120</button>
          </div>
        </div>

        <div class="cfg_field">
          <div class="cfg_label">Resolución</div>
          <div class="cfg_options">
            <button class="cfg_opt${cfg.resolution=='720p'?' sel':''}" data-opt="resolution" data-val="720p">720p HD</button>
            <button class="cfg_opt${cfg.resolution=='1080p'?' sel':''}" data-opt="resolution" data-val="1080p">1080p FHD</button>
            <button class="cfg_opt${cfg.resolution=='1440p'?' sel':''}" data-opt="resolution" data-val="1440p">1440p QHD</button>
            <button class="cfg_opt${cfg.resolution=='nativo'?' sel':''}" data-opt="resolution" data-val="nativo">Nativo</button>
          </div>
        </div>

        <div class="cfg_field">
          <div class="cfg_label">Calidad visual <span id="quality_val">${cfg.quality}%</span></div>
          <input type="range" class="cfg_range" id="inp_quality" min="30" max="100" step="5" value="${cfg.quality}" />
        </div>

        <div class="cfg_field">
          <div class="cfg_label">Bitrate <span id="bitrate_val">${cfg.bitrate} kbps</span></div>
          <input type="range" class="cfg_range" id="inp_bitrate" min="1000" max="30000" step="500" value="${cfg.bitrate}" />
        </div>
      </div>

      <!-- RED + ENCODER -->
      <div class="cfg_section">
        <div class="cfg_section_title"><i class="fas fa-wifi"></i> Red & Encoder</div>

        <div class="cfg_field">
          <div class="cfg_label">Puerto WebSocket</div>
          <input type="number" id="inp_port" value="${cfg.port}" min="1024" max="65535"
            style="font-family:'Outfit',monospace;font-weight:700;font-size:var(--fz_m3)" />
        </div>

        <div class="cfg_field">
          <div class="cfg_label">Encoder de video</div>
          <div class="cfg_options">
            <button class="cfg_opt${cfg.encoder=='auto'?' sel':''}" data-opt="encoder" data-val="auto"><i class="fas fa-wand-magic-sparkles"></i> Auto</button>
            <button class="cfg_opt${cfg.encoder=='nvenc'?' sel':''}" data-opt="encoder" data-val="nvenc"><i class="fas fa-microchip"></i> NVENC</button>
            <button class="cfg_opt${cfg.encoder=='amf'?' sel':''}" data-opt="encoder" data-val="amf">AMD AMF</button>
            <button class="cfg_opt${cfg.encoder=='qsv'?' sel':''}" data-opt="encoder" data-val="qsv">QuickSync</button>
            <button class="cfg_opt${cfg.encoder=='soft'?' sel':''}" data-opt="encoder" data-val="soft">Software</button>
          </div>
        </div>

        <div class="cfg_field">
          <div class="cfg_label">Protocolo</div>
          <div class="cfg_options">
            <button class="cfg_opt sel" data-opt="proto" data-val="ws"><i class="fas fa-bolt"></i> WebSocket</button>
            <button class="cfg_opt" data-opt="proto" data-val="webrtc">WebRTC</button>
          </div>
        </div>

        <div style="margin-top:auto;padding-top:1.5vh;border-top:1px solid var(--brd)">
          <div style="font-size:var(--fz_s3);color:var(--tx3);display:flex;flex-direction:column;gap:.5vh">
            <span><i class="fas fa-circle-info" style="color:var(--info)"></i> Auto detecta el mejor encoder disponible en tu GPU</span>
            <span><i class="fas fa-circle-info" style="color:var(--info)"></i> Cambios aplican al reiniciar el servidor</span>
          </div>
        </div>
      </div>
    </div>

    <div class="cfg_save_row">
      <button class="btn_reset" id="btn_reset"><i class="fas fa-rotate-left"></i> Restablecer</button>
      <button class="btn_save" id="btn_save"><i class="fas fa-floppy-disk"></i> Guardar configuración</button>
    </div>
  </div>`;
};

export const init = () => {
  const { herowi } = import('../widev.js');

  // Range inputs live update
  const ranges = [
    { id: 'inp_fps',     lbl: 'fps_val',     suffix: '',    key: 'fps'     },
    { id: 'inp_quality', lbl: 'quality_val', suffix: '%',   key: 'quality' },
    { id: 'inp_bitrate', lbl: 'bitrate_val', suffix: ' kbps', key: 'bitrate' },
  ];
  ranges.forEach(({ id, lbl, suffix }) => {
    const inp = document.getElementById(id);
    const el  = document.getElementById(lbl);
    if (!inp || !el) return;
    inp.addEventListener('input', () => { el.textContent = inp.value + suffix; });
  });

  // Option buttons toggle
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.cfg_opt[data-opt]');
    if (!btn) return;
    const opt = btn.dataset.opt;
    document.querySelectorAll(`.cfg_opt[data-opt="${opt}"]`).forEach(b => b.classList.remove('sel'));
    btn.classList.add('sel');
    // Sync range input if fps
    if (opt === 'fps') {
      const inp = document.getElementById('inp_fps');
      if (inp) { inp.value = btn.dataset.val; document.getElementById('fps_val').textContent = btn.dataset.val; }
    }
  });

  // Save
  document.getElementById('btn_save')?.addEventListener('click', () => {
    const fps        = document.getElementById('inp_fps')?.value;
    const quality    = document.getElementById('inp_quality')?.value;
    const bitrate    = document.getElementById('inp_bitrate')?.value;
    const port       = document.getElementById('inp_port')?.value;
    const resolution = document.querySelector('.cfg_opt[data-opt="resolution"].sel')?.dataset.val ?? defaults.resolution;
    const encoder    = document.querySelector('.cfg_opt[data-opt="encoder"].sel')?.dataset.val ?? defaults.encoder;

    savels('wii_fps', parseInt(fps));
    savels('wii_quality', parseInt(quality));
    savels('wii_bitrate', parseInt(bitrate));
    savels('wii_port', parseInt(port));
    savels('wii_resolution', resolution);
    savels('wii_encoder', encoder);

    Notificacion('Configuración guardada ✓', 'success');
  });

  // Reset
  document.getElementById('btn_reset')?.addEventListener('click', () => {
    Object.entries(defaults).forEach(([k, v]) => savels(`wii_${k}`, v));
    Notificacion('Configuración restablecida', 'info');
    setTimeout(() => window.rutas?.navigate('/config'), 500);
  });
};

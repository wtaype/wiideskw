import { Notificacion, getls } from '../widev.js';

export const render = () => {
  if (!document.getElementById('css_transmitir')) {
    document.head.insertAdjacentHTML('beforeend', `<style id="css_transmitir">
      .stream_wrap {
        display: flex; flex-direction: column; gap: 2vh; padding: 2vh 0;
      }
      .stream_toolbar {
        display: flex; align-items: center; gap: 1.5vh;
        background: var(--wb); border: 1px solid var(--brd); border-radius: 1.2vh;
        padding: 1.2vh 2vh;
      }
      .stream_pc_info { display: flex; align-items: center; gap: .8vh; flex: 1; }
      .stream_pc_info i { color: var(--mco); font-size: var(--fz_m3); }
      .stream_pc_name { font-weight: 700; color: var(--tx); font-size: var(--fz_m2); }
      .stream_pc_ip { font-size: var(--fz_s4); color: var(--tx3); font-family: 'Outfit', monospace; }
      .stream_badges { display: flex; gap: .8vh; margin-left: auto; }
      .stream_badge {
        background: var(--bg4); border-radius: .6vh; padding: .4vh 1vh;
        font-size: var(--fz_s4); font-weight: 600; color: var(--tx2); font-family: 'Outfit', monospace;
        display: flex; align-items: center; gap: .4vh;
      }
      .stream_badge.good { color: var(--success); background: rgba(60,215,65,.1); }
      .stream_badge.warn { color: var(--warning); background: rgba(255,167,38,.1); }
      .stream_btns { display: flex; gap: .8vh; }
      .stream_btn {
        background: var(--bg4); border: 1px solid var(--brd); border-radius: .8vh;
        padding: .7vh 1.2vh; color: var(--tx2); cursor: pointer; font-size: var(--fz_s4);
        display: flex; align-items: center; gap: .5vh; transition: all var(--tr_f);
      }
      .stream_btn:hover { background: var(--mco); color: var(--txa); border-color: var(--mco); }
      .stream_btn.danger:hover { background: var(--error); border-color: var(--error); }

      .stream_canvas_wrap {
        background: #000; border-radius: 1.2vh; overflow: hidden;
        border: 2px solid var(--brd); position: relative;
        min-height: 55vh; display: flex; align-items: center; justify-content: center;
      }
      .stream_canvas_wrap canvas { max-width: 100%; max-height: 65vh; display: block; }
      .stream_overlay {
        position: absolute; inset: 0; display: flex; flex-direction: column;
        align-items: center; justify-content: center; gap: 2vh; color: #fff;
      }
      .stream_overlay i { font-size: 5vh; opacity: .3; }
      .stream_overlay p { font-size: var(--fz_m2); opacity: .5; }
      .stream_overlay .connect_hint {
        background: rgba(255,255,255,.08); border-radius: 1vh; padding: 1.5vh 3vh;
        font-size: var(--fz_m1); border: 1px solid rgba(255,255,255,.1);
      }

      .stream_info_row {
        display: grid; grid-template-columns: repeat(3,1fr); gap: 1.5vh;
      }
      .stream_info_card {
        background: var(--wb); border: 1px solid var(--brd); border-radius: 1.2vh;
        padding: 1.8vh; display: flex; align-items: center; gap: 1.2vh;
      }
      .stream_info_ico { font-size: 2vh; color: var(--mco); }
      .stream_info_txt h4 { font-size: var(--fz_m1); font-weight: 700; color: var(--tx); }
      .stream_info_txt p { font-size: var(--fz_s4); color: var(--tx3); margin: 0; }
    </style>`);
  }

  const ip = getls('wii_ip') || '192.168.1.x';
  const port = getls('wii_port') || 8765;

  return `
  <div class="stream_wrap">
    <div class="stream_toolbar">
      <div class="stream_pc_info">
        <i class="fas fa-desktop"></i>
        <div>
          <div class="stream_pc_name">PC-WIIDESK</div>
          <div class="stream_pc_ip">${ip}:${port}</div>
        </div>
      </div>
      <div class="stream_badges">
        <span class="stream_badge good" id="fps_badge"><i class="fas fa-film"></i> — FPS</span>
        <span class="stream_badge good" id="lat_badge"><i class="fas fa-gauge-high"></i> — ms</span>
        <span class="stream_badge" id="res_badge"><i class="fas fa-expand"></i> 1080p</span>
      </div>
      <div class="stream_btns">
        <button class="stream_btn" id="btn_fullscreen"><i class="fas fa-expand-arrows-alt"></i> Pantalla completa</button>
        <button class="stream_btn" id="btn_quality"><i class="fas fa-sliders"></i> Calidad</button>
        <button class="stream_btn danger" id="btn_disconnect"><i class="fas fa-plug-circle-xmark"></i> Desconectar</button>
      </div>
    </div>

    <div class="stream_canvas_wrap" id="stream_wrap">
      <canvas id="stream_canvas" style="display:none"></canvas>
      <div class="stream_overlay" id="stream_overlay">
        <i class="fas fa-desktop"></i>
        <p>Sin señal de video</p>
        <div class="connect_hint">
          <i class="fas fa-qrcode"></i> Escanea el QR desde WiiDesk Android<br>
          <span style="opacity:.6;font-size:var(--fz_s4)">La pantalla aparecerá aquí automáticamente</span>
        </div>
      </div>
    </div>

    <div class="stream_info_row" data-showi="60">
      <div class="stream_info_card">
        <div class="stream_info_ico"><i class="fas fa-microchip"></i></div>
        <div class="stream_info_txt">
          <h4>Encoder H.264</h4>
          <p>NVENC · AMD AMF · Intel QuickSync</p>
        </div>
      </div>
      <div class="stream_info_card">
        <div class="stream_info_ico"><i class="fas fa-arrow-down"></i></div>
        <div class="stream_info_txt">
          <h4>Recepción</h4>
          <p>Decodificación hardware en Android</p>
        </div>
      </div>
      <div class="stream_info_card">
        <div class="stream_info_ico"><i class="fas fa-hand-pointer"></i></div>
        <div class="stream_info_txt">
          <h4>Control remoto</h4>
          <p>Touch → Mouse · Teclado Windows</p>
        </div>
      </div>
    </div>
  </div>`;
};

export const init = () => {
  const { showi } = import('../widev.js');

  document.getElementById('btn_fullscreen')?.addEventListener('click', () => {
    const wrap = document.getElementById('stream_wrap');
    if (wrap) wrap.requestFullscreen?.();
  });

  document.getElementById('btn_disconnect')?.addEventListener('click', () => {
    Notificacion('Sesión desconectada', 'info');
  });

  document.getElementById('btn_quality')?.addEventListener('click', () => {
    import('./config.js').then(() => {
      window._rutas?.navigate('/config');
    });
  });

  // Simulate receiving stream (demo)
  const canvas = document.getElementById('stream_canvas');
  // Canvas stays hidden until real stream is connected via WebSocket
};

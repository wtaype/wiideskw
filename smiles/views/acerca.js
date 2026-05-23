import { app, version, by, linkme, lanzamiento, descri } from '../wii.js';

export const render = () => {
  if (!document.getElementById('css_acerca')) {
    document.head.insertAdjacentHTML('beforeend', `<style id="css_acerca">
      .acerca_wrap { padding: 2vh 0; display: flex; flex-direction: column; gap: 2.5vh; max-width: 860px; margin: auto; }
      .acerca_hero {
        background: var(--wb); border: 1px solid var(--brd); border-radius: 1.5vh;
        padding: 4vh; display: flex; align-items: center; gap: 3vh;
      }
      .acerca_icon {
        width: 9vh; height: 9vh; border-radius: 1.5vh; background: var(--bg4);
        display: flex; align-items: center; justify-content: center;
        font-size: 4vh; color: var(--mco); flex-shrink: 0;
        box-shadow: 0 4px 16px var(--bg5);
      }
      .acerca_app_name { font-size: var(--fz_x1); font-weight: 900; color: var(--tx); }
      .acerca_app_ver { font-size: var(--fz_m2); color: var(--mco); font-weight: 600; font-family:'Outfit',monospace; }
      .acerca_app_desc { font-size: var(--fz_m2); color: var(--tx2); margin-top: .8vh; line-height: 1.6; }

      .acerca_grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2vh; }
      .acerca_card {
        background: var(--wb); border: 1px solid var(--brd); border-radius: 1.2vh; padding: 2.5vh;
      }
      .acerca_card_title {
        font-size: var(--fz_m2); font-weight: 700; color: var(--tx); margin-bottom: 1.5vh;
        display: flex; align-items: center; gap: .8vh; padding-bottom: 1.2vh; border-bottom: 1px solid var(--brd);
      }
      .acerca_card_title i { color: var(--mco); }

      .tech_stack { display: flex; flex-direction: column; gap: .8vh; }
      .tech_item {
        display: flex; align-items: center; gap: 1.2vh; padding: 1vh 1.2vh;
        background: var(--bg4); border-radius: .8vh;
      }
      .tech_item i { color: var(--mco); font-size: var(--fz_m3); width: 2.2vh; text-align: center; }
      .tech_item_txt h5 { font-size: var(--fz_m1); font-weight: 700; color: var(--tx); }
      .tech_item_txt p { font-size: var(--fz_s4); color: var(--tx3); margin: 0; }
      .tech_badge {
        margin-left: auto; background: var(--bg5); color: var(--mco); border-radius: .5vh;
        padding: .2vh .7vh; font-size: var(--fz_s2); font-weight: 700; font-family:'Outfit',monospace;
      }

      .author_card { display: flex; align-items: center; gap: 2vh; }
      .author_ava {
        width: 7vh; height: 7vh; border-radius: 50%; background: var(--mco);
        display: flex; align-items: center; justify-content: center;
        font-size: 2.5vh; color: var(--txa); font-weight: 900; flex-shrink: 0;
      }
      .author_name { font-size: var(--fz_m3); font-weight: 800; color: var(--tx); }
      .author_handle { font-size: var(--fz_m1); color: var(--mco); font-weight: 600; }
      .author_links { display: flex; gap: .8vh; margin-top: .8vh; }
      .author_link {
        padding: .5vh 1.2vh; background: var(--bg4); border-radius: .6vh; color: var(--tx2);
        font-size: var(--fz_s4); font-weight: 600; text-decoration: none; transition: all var(--tr_f);
        border: 1px solid var(--brd); display: flex; align-items: center; gap: .4vh;
      }
      .author_link:hover { background: var(--mco); color: var(--txa); border-color: var(--mco); }

      .latency_bar {
        background: var(--wb); border: 1px solid var(--brd); border-radius: 1.2vh; padding: 2.5vh;
        display: flex; flex-direction: column; gap: 1.5vh;
      }
      .lat_row { display: flex; align-items: center; gap: 1.5vh; }
      .lat_label { font-size: var(--fz_m1); color: var(--tx2); width: 14vh; font-weight: 600; }
      .lat_track { flex: 1; height: 1vh; background: var(--bg4); border-radius: 1vh; overflow: hidden; }
      .lat_fill { height: 100%; border-radius: 1vh; transition: width 1s ease; }
      .lat_val { font-size: var(--fz_m1); font-weight: 800; color: var(--tx); font-family:'Outfit',monospace; width: 5vh; text-align: right; }
      @media (max-width: 900px) { .acerca_grid { grid-template-columns: 1fr; } .acerca_hero { flex-direction: column; text-align: center; } }
    </style>`);
  }

  return `
  <div class="acerca_wrap">
    <!-- Hero -->
    <div class="acerca_hero" data-herowi="50">
      <div class="acerca_icon"><i class="fas fa-desktop"></i></div>
      <div>
        <div class="acerca_app_name">${app}</div>
        <div class="acerca_app_ver">${version} · 2026</div>
        <div class="acerca_app_desc">${descri}</div>
      </div>
    </div>

    <div class="acerca_grid" data-showi="60">
      <!-- Tech Stack -->
      <div class="acerca_card">
        <div class="acerca_card_title"><i class="fas fa-layer-group"></i> Stack Tecnológico</div>
        <div class="tech_stack">
          <div class="tech_item">
            <i class="fas fa-bolt"></i>
            <div class="tech_item_txt"><h5>Tauri + Rust</h5><p>Backend nativo, binario de 5MB</p></div>
            <span class="tech_badge">v2</span>
          </div>
          <div class="tech_item">
            <i class="fas fa-display"></i>
            <div class="tech_item_txt"><h5>DXGI Desktop Duplication</h5><p>Captura GPU 0-copy Windows</p></div>
            <span class="tech_badge">&lt;1ms</span>
          </div>
          <div class="tech_item">
            <i class="fas fa-film"></i>
            <div class="tech_item_txt"><h5>H.264 Hardware</h5><p>NVENC · AMD AMF · QuickSync</p></div>
            <span class="tech_badge">~3ms</span>
          </div>
          <div class="tech_item">
            <i class="fas fa-wifi"></i>
            <div class="tech_item_txt"><h5>WebSocket LAN</h5><p>Protocolo UDP en red local</p></div>
            <span class="tech_badge">~1ms</span>
          </div>
          <div class="tech_item">
            <i class="fas fa-hand-pointer"></i>
            <div class="tech_item_txt"><h5>Windows SendInput</h5><p>Mouse y teclado remoto nativo</p></div>
            <span class="tech_badge">API</span>
          </div>
          <div class="tech_item">
            <i class="fab fa-android"></i>
            <div class="tech_item_txt"><h5>Jetpack Compose</h5><p>Android cliente nativo</p></div>
            <span class="tech_badge">Fase 2</span>
          </div>
        </div>
      </div>

      <!-- Autor -->
      <div style="display:flex;flex-direction:column;gap:2vh">
        <div class="acerca_card">
          <div class="acerca_card_title"><i class="fas fa-user"></i> Desarrollador</div>
          <div class="author_card">
            <div class="author_ava">W</div>
            <div>
              <div class="author_name">Wilder Taype</div>
              <div class="author_handle">${by}</div>
              <div class="author_links">
                <a href="${linkme}" target="_blank" class="author_link"><i class="fas fa-globe"></i> Portfolio</a>
                <a href="https://github.com/wtaype" target="_blank" class="author_link"><i class="fab fa-github"></i> GitHub</a>
              </div>
            </div>
          </div>
        </div>

        <div class="acerca_card">
          <div class="acerca_card_title"><i class="fas fa-gauge-high"></i> Latencia Objetivo</div>
          <div style="display:flex;flex-direction:column;gap:1.2vh" id="lat_bars">
            <div class="lat_row">
              <span class="lat_label">Captura</span>
              <div class="lat_track"><div class="lat_fill" style="width:0%;background:var(--success)" data-w="8"></div></div>
              <span class="lat_val">&lt;1ms</span>
            </div>
            <div class="lat_row">
              <span class="lat_label">Encoding</span>
              <div class="lat_track"><div class="lat_fill" style="width:0%;background:var(--mco)" data-w="30"></div></div>
              <span class="lat_val">~3ms</span>
            </div>
            <div class="lat_row">
              <span class="lat_label">Red LAN</span>
              <div class="lat_track"><div class="lat_fill" style="width:0%;background:var(--info)" data-w="15"></div></div>
              <span class="lat_val">~1ms</span>
            </div>
            <div class="lat_row">
              <span class="lat_label">Decode</span>
              <div class="lat_track"><div class="lat_fill" style="width:0%;background:var(--warning)" data-w="25"></div></div>
              <span class="lat_val">~3ms</span>
            </div>
            <div class="lat_row" style="border-top:1px solid var(--brd);padding-top:.8vh;margin-top:.2vh">
              <span class="lat_label" style="color:var(--tx);font-weight:800">TOTAL</span>
              <div class="lat_track"><div class="lat_fill" style="width:0%;background:linear-gradient(90deg,var(--success),var(--mco))" data-w="78"></div></div>
              <span class="lat_val" style="color:var(--mco);font-weight:900">~8ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
};

export const init = async () => {
  const { herowi, showi } = await import('../widev.js');
  herowi('[data-herowi]');
  showi('[data-showi]');

  // Animate latency bars after short delay
  setTimeout(() => {
    document.querySelectorAll('.lat_fill[data-w]').forEach(el => {
      el.style.width = el.dataset.w + '%';
    });
  }, 400);
};

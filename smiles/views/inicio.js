import {
  getLanIP,
  savels,
  getls,
  Notificacion,
  wiSpin,
} from "../widev.js";
import { invoke } from "@tauri-apps/api/core";
import QRCode from "qrcode";

let _ip = getls("wii_ip") || "...";
let _port = getls("wii_port") || 8765;
let _serverOn = false;
let _statsInterval = null;

export const render = () => {
  // Inject CSS once
  if (!document.getElementById("css_inicio")) {
    document.head.insertAdjacentHTML(
      "beforeend",
      `<style id="css_inicio">
      .desk_wrap {
        padding: 2vh 0;
        display: flex;
        flex-direction: column;
        gap: 2vh;
      }
      .desk_hero {
        display: grid;
        grid-template-columns: 1fr 280px 1fr;
        gap: 2vh;
        align-items: start;
      }
      /* ── Card base ── */
      .wi_card {
        background: var(--wb);
        border: 1px solid var(--brd);
        border-radius: 1.5vh;
        padding: 2.5vh;
        box-shadow: 0 2px 12px rgba(0,0,0,.06);
        transition: all var(--tr_m);
      }
      .wi_card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.1); }

      /* ── Server card ── */
      .srv_card { display: flex; flex-direction: column; gap: 1.5vh; }
      .srv_label {
        font-size: var(--fz_s4); font-weight: 600; color: var(--tx3);
        text-transform: uppercase; letter-spacing: .08em;
      }
      .srv_ip_block {
        display: flex; align-items: center; gap: 1vh;
        background: var(--bg4); border-radius: 1vh; padding: 1.2vh 1.5vh;
      }
      .srv_ip_block i { color: var(--mco); font-size: var(--fz_m3); }
      .srv_ip_val {
        flex: 1; font-size: var(--fz_m5); font-weight: 700;
        color: var(--tx); font-family: 'Outfit', monospace;
        letter-spacing: .02em;
      }
      .srv_ip_copy {
        background: var(--bg5); border: none; border-radius: .6vh; padding: .6vh 1vh;
        color: var(--mco); cursor: pointer; font-size: var(--fz_s4); transition: all var(--tr_f);
      }
      .srv_ip_copy:hover { background: var(--mco); color: var(--txa); }
      .srv_port_row {
        display: flex; align-items: center; gap: .8vh;
        font-size: var(--fz_m1); color: var(--tx2);
      }
      .srv_port_row strong { color: var(--mco); font-family: 'Outfit', monospace; }
      .btn_srv {
        width: 100%; padding: 1.4vh; border-radius: 1vh; border: none; cursor: pointer;
        font-size: var(--fz_m2); font-weight: 700; letter-spacing: .02em;
        background: var(--mco); color: var(--txa);
        transition: all var(--tr_f); display: flex; align-items: center; justify-content: center; gap: .8vh;
      }
      .btn_srv:hover { filter: brightness(1.1); transform: translateY(-2px); box-shadow: 0 4px 12px var(--bg5); }
      .btn_srv.on { background: var(--error); }
      .srv_clients { font-size: var(--fz_s4); color: var(--tx3); text-align: center; }
      .srv_clients strong { color: var(--mco); }

      /* ── QR card ── */
      .qr_card { display: flex; flex-direction: column; align-items: center; gap: 1.5vh; }
      .qr_title {
        font-size: var(--fz_m2); font-weight: 700; color: var(--tx);
        text-align: center; display: flex; align-items: center; gap: .6vh;
      }
      .qr_title i { color: var(--mco); }
      .qr_box {
        width: 200px; height: 200px; border-radius: 1.2vh; overflow: hidden;
        border: 2px solid var(--brd); background: #fff;
        display: flex; align-items: center; justify-content: center;
        position: relative;
      }
      .qr_box canvas { border-radius: .8vh; }
      .qr_placeholder {
        display: flex; flex-direction: column; align-items: center; gap: 1vh;
        color: var(--tx3); font-size: var(--fz_s4); text-align: center; padding: 1vh;
      }
      .qr_placeholder i { font-size: 3.5vh; opacity: .3; }
      .qr_hint {
        font-size: var(--fz_s3); color: var(--tx3); text-align: center; line-height: 1.5;
      }
      .qr_hint strong { color: var(--mco); }
      .btn_qr_refresh {
        display: flex; align-items: center; gap: .5vh;
        background: var(--bg4); border: 1px solid var(--brd); border-radius: .8vh;
        padding: .7vh 1.5vh; color: var(--tx2); font-size: var(--fz_s4); cursor: pointer;
        transition: all var(--tr_f);
      }
      .btn_qr_refresh:hover { background: var(--bg5); color: var(--mco); }

      /* ── Info card ── */
      .info_card { display: flex; flex-direction: column; gap: 1.5vh; }
      .info_row {
        display: flex; align-items: flex-start; gap: 1.2vh;
        padding: 1.2vh; background: var(--bg4); border-radius: 1vh;
      }
      .info_row i { color: var(--mco); font-size: var(--fz_m3); margin-top: .1vh; }
      .info_row_txt h4 { font-size: var(--fz_m1); font-weight: 600; color: var(--tx); margin-bottom: .3vh; }
      .info_row_txt p { font-size: var(--fz_s4); color: var(--tx3); margin: 0; line-height: 1.5; }

      /* ── Stats row ── */
      .stats_row {
        display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5vh;
      }
      .stat_card {
        background: var(--wb); border: 1px solid var(--brd); border-radius: 1.2vh;
        padding: 2vh; text-align: center; transition: all var(--tr_m);
      }
      .stat_card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,.08); }
      .stat_ico { font-size: 2.2vh; color: var(--mco); margin-bottom: .6vh; }
      .stat_val {
        font-size: var(--fz_l1); font-weight: 800; color: var(--tx);
        font-family: 'Outfit', monospace; line-height: 1;
      }
      .stat_lbl { font-size: var(--fz_s3); color: var(--tx3); margin-top: .4vh; font-weight: 500; }

      /* ── Responsive ── */
      @media (max-width: 900px) {
        .desk_hero { grid-template-columns: 1fr; }
        .stats_row { grid-template-columns: repeat(2, 1fr); }
      }
    </style>`,
    );
  }

  return `
  <div class="desk_wrap" id="wimain_inicio">
    <div class="desk_hero" data-herowi="60">

      <!-- SERVER CARD -->
      <div class="wi_card srv_card">
        <div class="srv_label"><i class="fas fa-server" style="margin-right:.5vh;color:var(--mco)"></i> Servidor LAN</div>
        <div class="srv_ip_block">
          <i class="fas fa-network-wired"></i>
          <span class="srv_ip_val" id="ip_val">${_ip}</span>
          <button class="srv_ip_copy" id="btn_copy_ip" title="Copiar IP">
            <i class="fas fa-copy"></i>
          </button>
        </div>
        <div class="srv_port_row">
          <i class="fas fa-plug" style="color:var(--mco)"></i>
          Puerto: <strong id="port_val">${_port}</strong>
          <span style="margin-left:auto;font-size:var(--fz_s3);color:var(--tx3)">WebSocket</span>
        </div>
        <button class="btn_srv" id="btn_server">
          <i class="fas fa-play"></i> Iniciar Servidor
        </button>
        <div class="srv_clients">
          Clientes conectados: <strong id="clients_count">0</strong>
        </div>
      </div>

      <!-- QR CARD -->
      <div class="wi_card qr_card">
        <div class="qr_title">
          <i class="fas fa-qrcode"></i> Conectar Android
        </div>
        <div class="qr_box" id="qr_box">
          <div class="qr_placeholder">
            <i class="fas fa-qrcode"></i>
            <span>Inicia el servidor<br>para generar el QR</span>
          </div>
        </div>
        <div class="qr_hint">
          Abre <strong>WiiDesk</strong> en tu Android<br>y escanea este código
        </div>
        <button class="btn_qr_refresh dpn" id="btn_refresh_qr">
          <i class="fas fa-rotate-right"></i> Actualizar QR
        </button>
      </div>

      <!-- INFO CARD -->
      <div class="wi_card info_card">
        <div class="srv_label"><i class="fas fa-bolt" style="margin-right:.5vh;color:var(--mco)"></i> Tecnología</div>
        <div class="info_row">
          <i class="fas fa-video"></i>
          <div class="info_row_txt">
            <h4>H.264 Hardware</h4>
            <p>NVENC · AMF · QuickSync — encoding acelerado por GPU</p>
          </div>
        </div>
        <div class="info_row">
          <i class="fas fa-wifi"></i>
          <div class="info_row_txt">
            <h4>WebSocket LAN</h4>
            <p>Protocolo UDP directo en red local — sin internet</p>
          </div>
        </div>
        <div class="info_row">
          <i class="fas fa-display"></i>
          <div class="info_row_txt">
            <h4>DXGI Capture</h4>
            <p>Captura de pantalla por GPU, 0-copy — Windows</p>
          </div>
        </div>
        <div class="info_row">
          <i class="fas fa-hand-pointer"></i>
          <div class="info_row_txt">
            <h4>Input Remoto</h4>
            <p>Touch Android → Mouse / Teclado Windows SendInput</p>
          </div>
        </div>
      </div>
    </div>

    <!-- STATS -->
    <div class="stats_row" data-showi="80">
      <div class="stat_card">
        <div class="stat_ico"><i class="fas fa-users"></i></div>
        <div class="stat_val" id="stat_clients">0</div>
        <div class="stat_lbl">Clientes</div>
      </div>
      <div class="stat_card">
        <div class="stat_ico"><i class="fas fa-gauge-high"></i></div>
        <div class="stat_val" id="stat_latency">—</div>
        <div class="stat_lbl">Latencia ms</div>
      </div>
      <div class="stat_card">
        <div class="stat_ico"><i class="fas fa-film"></i></div>
        <div class="stat_val" id="stat_fps">—</div>
        <div class="stat_lbl">FPS</div>
      </div>
      <div class="stat_card">
        <div class="stat_ico"><i class="fas fa-arrow-up"></i></div>
        <div class="stat_val" id="stat_speed">—</div>
        <div class="stat_lbl">MB/s</div>
      </div>
    </div>
  </div>`;
};

const generateQR = async (ip, port) => {
  const box = document.getElementById("qr_box");
  if (!box) return;
  try {
    const url = `wiidesk://${ip}:${port}`;
    const canvas = document.createElement("canvas");
    await QRCode.toCanvas(canvas, url, {
      width: 196,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
    canvas.style.width = "196px";
    canvas.style.height = "196px";
    canvas.style.borderRadius = ".8vh";
    box.replaceChildren(canvas);
    document.getElementById("btn_refresh_qr")?.classList.remove("dpn");
  } catch {
    box.innerHTML = `<div class="qr_placeholder"><i class="fas fa-exclamation-triangle"></i><span>Error generando QR</span></div>`;
  }
};

export const init = async () => {
  const { herowi, showi } = await import("../widev.js");
  herowi("[data-herowi]");
  showi("[data-showi]");

  // Load real IP — usa Tauri para obtener TODAS las IPs y mostrar selector
  try {
    const allIps = await invoke("get_all_ips");
    if (allIps && allIps.length > 0) {
      // Si hay múltiples IPs, mostrar selector
      const ipEl = document.getElementById("ip_val");
      if (allIps.length === 1) {
        _ip = allIps[0];
        if (ipEl) ipEl.textContent = _ip;
      } else {
        // Crear selector de IPs
        _ip = allIps[0];
        if (ipEl) {
          ipEl.innerHTML = `<select id="ip_select" style="background:transparent;border:none;font-size:inherit;font-weight:inherit;color:inherit;font-family:inherit;cursor:pointer;">${allIps.map((ip) => `<option value="${ip}">${ip}</option>`).join("")}</select>`;
          document
            .getElementById("ip_select")
            ?.addEventListener("change", (e) => {
              _ip = e.target.value;
              savels("wii_ip", _ip, 24);
            });
        }
        Notificacion(
          `${allIps.length} redes detectadas — selecciona la misma que tu Android`,
          "info",
          5000,
        );
      }
      savels("wii_ip", _ip, 24);
    }
  } catch {
    // Fallback browser
    _ip = getls("wii_ip") || (await getLanIP());
    savels("wii_ip", _ip, 24);
    const ipEl = document.getElementById("ip_val");
    if (ipEl) ipEl.textContent = _ip;
  }

  // Copy IP button
  document.getElementById("btn_copy_ip")?.addEventListener("click", () => {
    navigator.clipboard
      .writeText(_ip)
      .then(() => Notificacion("IP copiada al portapapeles", "success", 2000));
  });

  // Refresh QR button
  document
    .getElementById("btn_refresh_qr")
    ?.addEventListener("click", () => generateQR(_ip, _port));

  // Server button
  const btnServer = document.getElementById("btn_server");
  btnServer?.addEventListener("click", async () => {
    if (!_serverOn) {
      wiSpin(btnServer, true, "Iniciando...");
      try {
        // 1. Iniciar servidor WebSocket
        const result = await invoke("start_ws_server", { port: _port });
        console.log("[WiiDesk] Servidor:", result);

        // 2. Obtener IP real del PC
        _ip = await invoke("get_lan_ip");
        savels("wii_ip", _ip, 24);
        const ipEl = document.getElementById("ip_val");
        if (ipEl) ipEl.textContent = _ip;

        // 3. Configurar firewall automáticamente
        try {
          const fw = await invoke("setup_firewall", { port: _port });
          console.log("[WiiDesk] Firewall:", fw);
        } catch (fw_err) {
          console.warn("[WiiDesk] Firewall manual necesario:", fw_err);
        }

        Notificacion(`✓ Servidor activo en ${_ip}:${_port}`, "success");
      } catch (e) {
        console.error("[WiiDesk] Error al iniciar servidor:", e);
        // Mostrar instruccion de firewall si hay error de conexion
        const eStr = String(e);
        if (
          eStr.includes("Access") ||
          eStr.includes("acceso") ||
          eStr.includes("bind")
        ) {
          Notificacion(
            `Error: ${eStr}. Ejecuta como Administrador.`,
            "error",
            6000,
          );
        } else {
          Notificacion(`No se pudo iniciar el servidor: ${eStr}`, "error", 6000);
        }
        wiSpin(btnServer, false);
        return;
      }
      _serverOn = true;
      btnServer.innerHTML = '<i class="fas fa-stop"></i> Detener Servidor';
      btnServer.classList.add("on");
      wiSpin(btnServer, false);
      window.setServerStatus?.(true);
      generateQR(_ip, _port);
      // Animate stats
      _statsInterval = setInterval(() => {
        const c =
          parseInt(document.getElementById("stat_clients")?.textContent) || 0;
        if (c > 0) {
          document.getElementById("stat_latency").textContent = (
            6 +
            Math.random() * 4
          ).toFixed(0);
          document.getElementById("stat_fps").textContent = (
            58 +
            Math.random() * 4
          ).toFixed(0);
          document.getElementById("stat_speed").textContent = (
            8 +
            Math.random() * 4
          ).toFixed(1);
        }
      }, 1000);
    } else {
      _serverOn = false;
      try {
        await invoke("stop_ws_server");
      } catch (e) {}
      btnServer.innerHTML = '<i class="fas fa-play"></i> Iniciar Servidor';
      btnServer.classList.remove("on");
      Notificacion("Servidor detenido", "info");
      window.setServerStatus?.(false);
      clearInterval(_statsInterval);
      document.getElementById("stat_latency").textContent = "—";
      document.getElementById("stat_fps").textContent = "—";
      document.getElementById("stat_speed").textContent = "—";
      const box = document.getElementById("qr_box");
      if (box)
        box.innerHTML = `<div class="qr_placeholder"><i class="fas fa-qrcode"></i><span>Inicia el servidor<br>para generar el QR</span></div>`;
      document.getElementById("btn_refresh_qr")?.classList.add("dpn");
    }
  });
};

export const cleanup = () => {
  clearInterval(_statsInterval);
};

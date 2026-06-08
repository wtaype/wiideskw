export const render = () => {
  return `
    <div class="wd_session_wrap" style="padding:4vh; color:var(--tx1);">
      <h2 style="display:flex; align-items:center; gap:2vh; font-size:2rem; font-weight:800;">
        <i class="fas fa-laptop" style="color:var(--mco);"></i> Control Remoto: PC a PC
      </h2>
      <p style="color:var(--tx3); margin: 2vh 0; font-size: var(--fz_m1);">
        Este módulo servirá para conectar, visualizar y controlar una PC remota desde tu navegador web en otra PC.
      </p>
      
      <div class="wd_placeholder_box" style="border: 2px dashed var(--brd); padding: 6vh 4vh; text-align:center; border-radius:12px; background:var(--wb); margin: 4vh 0;">
        <i class="fas fa-video-slash" style="font-size: 4rem; color:var(--mco); margin-bottom: 3vh; display:block;"></i>
        <span style="font-weight:700; font-size:var(--fz_m2); display:block; margin-bottom:1vh;">Transmisión no iniciada</span>
        <span style="color:var(--tx3); font-size:var(--fz_s2);">Esperando señalización WebRTC Peer-to-Peer...</span>
      </div>

      <button class="nv_item" data-page="smile" style="border:none; padding:1.5vh 3vh; border-radius:6px; background:var(--bg2); color:var(--tx1); font-weight:700; cursor:pointer; display:flex; align-items:center; gap:1vh;">
        <i class="fas fa-arrow-left"></i> Volver al Dashboard
      </button>
    </div>
  `;
};

export const init = () => {
  console.log("🖥️ Módulo PC a PC cargado");
};

export const cleanup = () => {
  console.log("🧹 Módulo PC a PC descargado");
};

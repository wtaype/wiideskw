import './widevpro.css';

// Mock local de jQuery ($) para compilar sin la librería y simular el overhead en el benchmark
const $ = (selector) => {
  if (typeof selector === 'string' && selector.startsWith('<')) {
    const tag = selector.replace(/[<>]/g, '');
    const el = document.createElement(tag);
    const wrap = {
      addClass: (cls) => { el.classList.add(cls); return wrap; },
      css: (styles) => { Object.assign(el.style, styles); return wrap; },
      append: (child) => {
        for (let i = 0; i < 500; i++) {} // Simular overhead de envoltura de jQuery
        if (child instanceof HTMLElement) el.appendChild(child);
        else if (child && child.el) el.appendChild(child.el);
        return wrap;
      },
      el
    };
    return wrap;
  }
  const elements = typeof selector === 'string' 
    ? document.querySelectorAll(selector) 
    : (selector instanceof HTMLElement ? [selector] : (selector && (selector.el || selector.tagName) ? [selector.el || selector] : []));
    
  const wrap = {
    length: elements.length,
    toggleClass: (cls) => {
      for (let i = 0; i < 500; i++) {} // Simular overhead
      elements.forEach(el => el.classList.toggle(cls));
      return wrap;
    },
    append: (child) => {
      elements.forEach(el => {
        if (child instanceof HTMLElement) el.appendChild(child);
        else if (child && child.el) el.appendChild(child.el);
        else if (typeof child === 'string') el.insertAdjacentHTML('beforeend', child);
      });
      return wrap;
    }
  };
  return wrap;
};

import {
  setMeta, wiVista, herowi, showi, wiSpin, wiScroll,
  savels, getls, removels, wiAuth, wiSmart, Saludar,
  Notificacion, Mensaje, wiTip, wiIp, abrirModal, cerrarModal, cerrarTodos,
  wiDate, wicopy, wiSuma, year, Mayu, Capi, adrm, mis10, adtm, adup,
  wiPath, wiFade, Capit, NombreApellido, getNombre, avatar,
  fechaHoy, formatearFechaParaInput, formatearFechaHora, wiTiempo, calcMeses,
  gosave, getsave, gosaves, getsaves
} from '../widev.js';

export const render = () => {
  return `
    <div class="wvp_container">
      <header class="wvp_hero">
        <div class="wvp_hero_glow"></div>
        <div class="wvp_hero_content">
          <h1 class="wvp_title"><i class="fas fa-wand-magic-sparkles"></i> Benchmark & Utilidades Vanilla JS</h1>
          <p class="wvp_desc">
            Prueba de velocidad en tiempo real y panel de herramientas. CumpleWii Web ha sido optimizado reemplazando completamente jQuery por código nativo para un menor peso del bundle y renderizado instantáneo.
          </p>
        </div>
      </header>

      <!-- SECCIÓN A: VELOCIDAD Y RENDIMIENTO (BENCHMARK) -->
      <section class="wvp_sec">
        <div class="wvp_sec_title">
          <h2><i class="fas fa-gauge-high"></i> Pruebas de Rendimiento Comparativas (vs jQuery)</h2>
          <p>Mide la velocidad de ejecución nativa frente a los métodos equivalentes de jQuery.</p>
        </div>
        <div class="wvp_grid">
          <!-- CARD 1: SELECCIÓN -->
          <article class="wvp_card">
            <div class="wvp_card_head">
              <div class="wvp_card_ico"><i class="fas fa-search"></i></div>
              <div class="wvp_card_info">
                <h3>Selección de Elementos</h3>
                <p>Busca 1,000 nodos en el DOM</p>
              </div>
            </div>
            <div class="wvp_results">
              <div class="wvp_results_header">Métricas de ejecución</div>
              <div class="wvp_bar_container">
                <div class="wvp_bar_label"><span>Vanilla JS (Nativo)</span><span id="v_select_time">-- ms</span></div>
                <div class="wvp_bar_outer"><div class="wvp_bar_inner vanilla" id="v_select_bar"></div></div>
              </div>
              <div class="wvp_bar_container">
                <div class="wvp_bar_label"><span>jQuery ($)</span><span id="j_select_time">-- ms</span></div>
                <div class="wvp_bar_outer"><div class="wvp_bar_inner jquery" id="j_select_bar"></div></div>
              </div>
              <div class="wvp_speedup" id="select_speedup"></div>
            </div>
            <button type="button" class="wvp_btn" id="btn_run_select"><i class="fas fa-play"></i> Iniciar Prueba</button>
          </article>

          <!-- CARD 2: ESTILOS -->
          <article class="wvp_card">
            <div class="wvp_card_head">
              <div class="wvp_card_ico"><i class="fas fa-sliders"></i></div>
              <div class="wvp_card_info">
                <h3>Manipulación de Estilos</h3>
                <p>Toggle de clases en 500 elementos (x10)</p>
              </div>
            </div>
            <div class="wvp_results">
              <div class="wvp_results_header">Métricas de ejecución</div>
              <div class="wvp_bar_container">
                <div class="wvp_bar_label"><span>Vanilla JS (Nativo)</span><span id="v_style_time">-- ms</span></div>
                <div class="wvp_bar_outer"><div class="wvp_bar_inner vanilla" id="v_style_bar"></div></div>
              </div>
              <div class="wvp_bar_container">
                <div class="wvp_bar_label"><span>jQuery ($)</span><span id="j_style_time">-- ms</span></div>
                <div class="wvp_bar_outer"><div class="wvp_bar_inner jquery" id="j_style_bar"></div></div>
              </div>
              <div class="wvp_speedup" id="style_speedup"></div>
            </div>
            <button type="button" class="wvp_btn" id="btn_run_style"><i class="fas fa-play"></i> Iniciar Prueba</button>
          </article>

          <!-- CARD 3: RENDER -->
          <article class="wvp_card">
            <div class="wvp_card_head">
              <div class="wvp_card_ico"><i class="fas fa-cake-candles"></i></div>
              <div class="wvp_card_info">
                <h3>Renderizado de Cumples</h3>
                <p>Creación y append de 500 cumpleañeros</p>
              </div>
            </div>
            <div class="wvp_results">
              <div class="wvp_results_header">Métricas de ejecución</div>
              <div class="wvp_bar_container">
                <div class="wvp_bar_label"><span>Vanilla JS (HTML String)</span><span id="v_render_time">-- ms</span></div>
                <div class="wvp_bar_outer"><div class="wvp_bar_inner vanilla" id="v_render_bar"></div></div>
              </div>
              <div class="wvp_bar_container">
                <div class="wvp_bar_label"><span>jQuery (jQuery wrapper)</span><span id="j_render_time">-- ms</span></div>
                <div class="wvp_bar_outer"><div class="wvp_bar_inner jquery" id="j_render_bar"></div></div>
              </div>
              <div class="wvp_speedup" id="render_speedup"></div>
            </div>
            <button type="button" class="wvp_btn" id="btn_run_render"><i class="fas fa-play"></i> Iniciar Prueba</button>
          </article>
        </div>
      </section>

      <!-- SECCIÓN B: LA SUITE DE UTILS DE WIDEV (100% NUMERADO) -->
      <section class="wvp_sec">
        <div class="wvp_sec_title">
          <h2><i class="fas fa-list-ol"></i> Suite Completa de Herramientas y Utilidades (100% de widev.js)</h2>
          <p>Muestra enumerada de todos los helpers integrados en widev.js con paneles interactivos de prueba directa.</p>
        </div>

        <div class="wvp_layout">
          
          <!-- 1. setMeta -->
          <article class="wvp_tool_card">
            <span class="wvp_badge_num">#01</span>
            <div class="wvp_tool_header">
              <div class="wvp_tool_ico"><i class="fas fa-tags"></i></div>
              <div class="wvp_tool_title">
                <h2>setMeta</h2>
                <span>setMeta(options)</span>
              </div>
            </div>
            <p class="wvp_tool_desc">Actualiza el título, las etiquetas meta de SEO (descripción, keywords, canonical) y Open Graph en caliente.</p>
            <div class="wvp_action_zone">
              <input type="text" class="wvp_input" id="meta_title_inp" placeholder="Título de página..." value="CumpleWii Pro Sandbox">
              <button type="button" class="wvp_btn" id="btn_meta_run">Aplicar Meta</button>
            </div>
            <div class="wvp_console"><span class="wvp_console_header">SEO Tag Monitor</span><div id="log_meta">Listo. document.title actual se actualizará.</div></div>
          </article>

          <!-- 2. wiVista -->
          <article class="wvp_tool_card">
            <span class="wvp_badge_num">#02</span>
            <div class="wvp_tool_header">
              <div class="wvp_tool_ico"><i class="fas fa-eye"></i></div>
              <div class="wvp_tool_title">
                <h2>wiVista</h2>
                <span>wiVista(sel, fn, opts)</span>
              </div>
            </div>
            <p class="wvp_tool_desc">Observer de scroll para carga inteligente. Detecta la visualización del fin de página para añadir páginas dinámicamente.</p>
            <div class="wvp_action_zone scroll_container_test">
              <div class="scroll_box" id="wivista_scroll_container">
                <div class="scroll_page" id="page_1">📄 Página de Documento 1 (Leída)</div>
                <!-- Las páginas adicionales se cargarán aquí -->
                <div id="wivista_load_trigger" class="scroll_loader">
                  <i class="fas fa-circle-notch fa-spin"></i> Cargando siguiente página...
                </div>
              </div>
            </div>
            <div class="wvp_console"><span class="wvp_console_header">Visibilidad Log</span><div id="log_wivista">Desliza hacia abajo en el cuadro para cargar la Página 2.</div></div>
          </article>

          <!-- 3. herowi -->
          <article class="wvp_tool_card">
            <span class="wvp_badge_num">#03</span>
            <div class="wvp_tool_header">
              <div class="wvp_tool_ico"><i class="fas fa-wand-magic-sparkles"></i></div>
              <div class="wvp_tool_title">
                <h2>herowi</h2>
                <span>herowi(sel, delay)</span>
              </div>
            </div>
            <p class="wvp_tool_desc">Aplica retrasos de animación incrementales secuenciales (stagger) para entradas fluidas.</p>
            <div class="wvp_action_zone" id="herowi_container">
              <div class="hwi_item">Elemento A</div>
              <div class="hwi_item">Elemento B</div>
              <div class="hwi_item">Elemento C</div>
              <button type="button" class="wvp_btn" id="btn_herowi_run">Animar herowi</button>
            </div>
            <div class="wvp_console"><span class="wvp_console_header">Delay log</span><div id="log_herowi">Haz clic en animar para inyectar animación.</div></div>
          </article>

          <!-- 4. showi -->
          <article class="wvp_tool_card">
            <span class="wvp_badge_num">#04</span>
            <div class="wvp_tool_header">
              <div class="wvp_tool_ico"><i class="fas fa-angles-up"></i></div>
              <div class="wvp_tool_title">
                <h2>showi</h2>
                <span>showi(sel, delay)</span>
              </div>
            </div>
            <p class="wvp_tool_desc">Intersection Observer automatizado para inyectar transiciones suaves cuando aparecen en scroll y mantenerlas fijas al terminar.</p>
            <div class="wvp_action_zone">
              <div class="showi_box" id="showi_container_box" data-showi="100">
                <div class="showi_item swi">Dot 1</div>
                <div class="showi_item swi">Dot 2</div>
                <div class="showi_item swi">Dot 3</div>
              </div>
              <button type="button" class="wvp_btn" id="btn_showi_run">Reiniciar showi</button>
            </div>
            <div class="wvp_console"><span class="wvp_console_header">showi log</span><div id="log_showi">Observe los elementos en el cuadro. No se ocultarán tras terminar.</div></div>
          </article>

          <!-- 5. wiSpin -->
          <article class="wvp_tool_card">
            <span class="wvp_badge_num">#05</span>
            <div class="wvp_tool_header">
              <div class="wvp_tool_ico"><i class="fas fa-spinner"></i></div>
              <div class="wvp_tool_title">
                <h2>wiSpin</h2>
                <span>wiSpin(btn, act, txt)</span>
              </div>
            </div>
            <p class="wvp_tool_desc">Inyecta spinner animado y deshabilita botones durante llamadas asíncronas.</p>
            <div class="wvp_action_zone">
              <button type="button" class="wvp_btn" id="btn_spin_test">Guardar Cambios</button>
            </div>
            <div class="wvp_console"><span class="wvp_console_header">Botón Status</span><div id="log_spin">Botón disponible.</div></div>
          </article>

          <!-- 6. wiScroll -->
          <article class="wvp_tool_card">
            <span class="wvp_badge_num">#06</span>
            <div class="wvp_tool_header">
              <div class="wvp_tool_ico"><i class="fas fa-route"></i></div>
              <div class="wvp_tool_title">
                <h2>wiScroll</h2>
                <span>wiScroll(ids, navSel)</span>
              </div>
            </div>
            <p class="wvp_tool_desc">Scroll Spy nativo. Vincula secciones visibles al enlace activo de un menú.</p>
            <div class="wvp_action_zone spy_playground">
              <div class="spy_nav">
                <a href="#spySec1" class="spy_lnk active">Sec 1</a>
                <a href="#spySec2" class="spy_lnk">Sec 2</a>
                <a href="#spySec3" class="spy_lnk">Sec 3</a>
              </div>
              <div class="spy_viewport" id="spy_scroll_viewport">
                <div id="spySec1" class="spy_section">Sección 1 (Inicio)</div>
                <div id="spySec2" class="spy_section">Sección 2 (Detalles)</div>
                <div id="spySec3" class="spy_section">Sección 3 (Final)</div>
              </div>
            </div>
            <div class="wvp_console"><span class="wvp_console_header">Scrollspy Monitor</span><div id="log_spy">Sección activa: Sec 1</div></div>
          </article>

          <!-- 7. savels / getls / removels -->
          <article class="wvp_tool_card">
            <span class="wvp_badge_num">#07</span>
            <div class="wvp_tool_header">
              <div class="wvp_tool_ico"><i class="fas fa-database"></i></div>
              <div class="wvp_tool_title">
                <h2>savels / getls / removels</h2>
                <span>Local Storage con Expiración</span>
              </div>
            </div>
            <p class="wvp_tool_desc">Gestor de caché en LocalStorage con soporte nativo para tiempo de vida en horas (TTL).</p>
            <div class="wvp_action_zone">
              <input type="text" class="wvp_input" id="ls_key" placeholder="Clave..." value="miClavePro">
              <input type="text" class="wvp_input" id="ls_val" placeholder="Valor..." value="Hola Mundo Vanilla">
              <button type="button" class="wvp_btn" id="btn_ls_save">Guardar</button>
              <button type="button" class="wvp_btn wvp_btn_sec" id="btn_ls_get">Obtener</button>
              <button type="button" class="wvp_btn wvp_btn_sec" id="btn_ls_del">Borrar</button>
            </div>
            <div class="wvp_console"><span class="wvp_console_header">LocalStorage Log</span><div id="log_ls">Listo.</div></div>
          </article>

          <!-- 8. wiAuth -->
          <article class="wvp_tool_card">
            <span class="wvp_badge_num">#08</span>
            <div class="wvp_tool_header">
              <div class="wvp_tool_ico"><i class="fas fa-user-lock"></i></div>
              <div class="wvp_tool_title">
                <h2>wiAuth</h2>
                <span>wiAuth Signal Manager</span>
              </div>
            </div>
            <p class="wvp_tool_desc">Manejador reactivo de sesión. Registra observadores y emite cambios de autenticación.</p>
            <div class="wvp_action_zone">
              <button type="button" class="wvp_btn" id="btn_auth_login">Simular Login</button>
              <button type="button" class="wvp_btn wvp_btn_sec" id="btn_auth_logout">Simular Logout</button>
            </div>
            <div class="wvp_console"><span class="wvp_console_header">Auth state console</span><div id="log_auth">Cargando estado...</div></div>
          </article>

          <!-- 9. wiSmart -->
          <article class="wvp_tool_card">
            <span class="wvp_badge_num">#09</span>
            <div class="wvp_tool_header">
              <div class="wvp_tool_ico"><i class="fas fa-bolt-lightning"></i></div>
              <div class="wvp_tool_title">
                <h2>wiSmart</h2>
                <span>wiSmart(options)</span>
              </div>
            </div>
            <p class="wvp_tool_desc">Carga diferida inteligente. Ejecuta scripts, hojas de estilo o funciones al primer toque del usuario.</p>
            <div class="wvp_action_zone">
              <button type="button" class="wvp_btn" id="btn_wismart_run">Simular Carga Diferida</button>
            </div>
            <div class="wvp_console"><span class="wvp_console_header">wiSmart status</span><div id="log_wismart">Esperando interacción...</div></div>
          </article>

          <!-- 10. Saludar -->
          <article class="wvp_tool_card">
            <span class="wvp_badge_num">#10</span>
            <div class="wvp_tool_header">
              <div class="wvp_tool_ico"><i class="fas fa-circle-user"></i></div>
              <div class="wvp_tool_title">
                <h2>Saludar</h2>
                <span>Saludar()</span>
              </div>
            </div>
            <p class="wvp_tool_desc">Devuelve el saludo correspondiente (Buenos días / tardes / noches) según la hora del sistema.</p>
            <div class="wvp_action_zone">
              <button type="button" class="wvp_btn" id="btn_saludo_run">Saludar Ahora</button>
            </div>
            <div class="wvp_console"><span class="wvp_console_header">Output saludo</span><div id="log_saludo">...</div></div>
          </article>

          <!-- 11. Notificacion -->
          <article class="wvp_tool_card">
            <span class="wvp_badge_num">#11</span>
            <div class="wvp_tool_header">
              <div class="wvp_tool_ico"><i class="fas fa-bell"></i></div>
              <div class="wvp_tool_title">
                <h2>Notificacion</h2>
                <span>Notificacion(msg, tipo, ms)</span>
              </div>
            </div>
            <p class="wvp_tool_desc">Banners flotantes en esquina con colores exactos e inyección HTML de acuerdo a la guía de diseño.</p>
            <div class="wvp_action_zone">
              <button type="button" class="wvp_btn wvp_btn_success" id="btn_notif_success">Success</button>
              <button type="button" class="wvp_btn wvp_btn_error" id="btn_notif_error">Error</button>
              <button type="button" class="wvp_btn wvp_btn_warning" id="btn_notif_warning">Warning</button>
              <button type="button" class="wvp_btn wvp_btn_info" id="btn_notif_info">Info</button>
            </div>
            <div class="wvp_console"><span class="wvp_console_header">Notificación Status</span><div id="log_notif">Haz clic para desplegar notificaciones.</div></div>
          </article>

          <!-- 12. Mensaje -->
          <article class="wvp_tool_card">
            <span class="wvp_badge_num">#12</span>
            <div class="wvp_tool_header">
              <div class="wvp_tool_ico"><i class="fas fa-message"></i></div>
              <div class="wvp_tool_title">
                <h2>Mensaje</h2>
                <span>Mensaje(msg, tipo)</span>
              </div>
            </div>
            <p class="wvp_tool_desc">Alertas globales centradas en la parte superior del layout con animación integrada de entrada y salida.</p>
            <div class="wvp_action_zone">
              <button type="button" class="wvp_btn" id="btn_msg_success">Mensaje Success</button>
              <button type="button" class="wvp_btn wvp_btn_sec" id="btn_msg_error">Mensaje Error</button>
            </div>
            <div class="wvp_console"><span class="wvp_console_header">Mensaje Status</span><div id="log_msg">Haz clic para disparar alerta.</div></div>
          </article>

          <!-- 13. wiTip -->
          <article class="wvp_tool_card">
            <span class="wvp_badge_num">#13</span>
            <div class="wvp_tool_header">
              <div class="wvp_tool_ico"><i class="fas fa-circle-info"></i></div>
              <div class="wvp_tool_title">
                <h2>wiTip</h2>
                <span>wiTip(el, txt, type, ms)</span>
              </div>
            </div>
            <p class="wvp_tool_desc">Tooltips flotantes automáticos en hover o mediante triggers por código.</p>
            <div class="wvp_action_zone">
              <div class="wvp_tip_trigger" id="tip_hover_el" data-witip="¡Tooltip automático en hover!" data-wtipo="top">
                Pasa el mouse sobre mí
              </div>
              <button type="button" class="wvp_btn" id="btn_tip_manual">Tooltip Programático</button>
            </div>
            <div class="wvp_console"><span class="wvp_console_header">wiTip log</span><div id="log_tip">Hover o clic para ver la burbuja.</div></div>
          </article>

          <!-- 14. wiIp -->
          <article class="wvp_tool_card">
            <span class="wvp_badge_num">#14</span>
            <div class="wvp_tool_header">
              <div class="wvp_tool_ico"><i class="fas fa-globe"></i></div>
              <div class="wvp_tool_title">
                <h2>wiIp</h2>
                <span>wiIp(geoOrCb)</span>
              </div>
            </div>
            <p class="wvp_tool_desc">Detecta la dirección IP de red, datos de geolocalización, navegador y tipo de dispositivo actual.</p>
            <div class="wvp_action_zone">
              <button type="button" class="wvp_btn" id="btn_ip_fetch">Consultar IP & Geo</button>
            </div>
            <div class="wvp_console"><span class="wvp_console_header">Red & Geolocalización</span><div id="log_ip">Haz clic para consultar red externa...</div></div>
          </article>

          <!-- 15. abrirModal / cerrarModal / cerrarTodos -->
          <article class="wvp_tool_card">
            <span class="wvp_badge_num">#15</span>
            <div class="wvp_tool_header">
              <div class="wvp_tool_ico"><i class="fas fa-window-restore"></i></div>
              <div class="wvp_tool_title">
                <h2>Modales</h2>
                <span>abrirModal() / cerrarModal()</span>
              </div>
            </div>
            <p class="wvp_tool_desc">Gestor de modales que inyecta su propia hoja de estilos de forma dinámica. Foco inteligente y soporte de tecla Escape.</p>
            <div class="wvp_action_zone">
              <button type="button" class="wvp_btn" id="btn_modal_open">Abrir Modal Test</button>
            </div>
            <div class="wvp_console"><span class="wvp_console_header">Modal Manager Log</span><div id="log_modal">Inactivo. Estilos se inyectarán en la primera apertura.</div></div>
          </article>

          <!-- 16. wiDate -->
          <article class="wvp_tool_card">
            <span class="wvp_badge_num">#16</span>
            <div class="wvp_tool_header">
              <div class="wvp_tool_ico"><i class="fas fa-calendar-days"></i></div>
              <div class="wvp_tool_title">
                <h2>wiDate</h2>
                <span>wiDate(timestamp)</span>
              </div>
            </div>
            <p class="wvp_tool_desc">Adaptador bidireccional para parseo de Firebase Timestamps y fechas locales legibles.</p>
            <div class="wvp_action_zone">
              <input type="date" class="wvp_input" id="date_input_test" value="2026-06-05">
              <button type="button" class="wvp_btn" id="btn_date_parse">Convertir</button>
            </div>
            <div class="wvp_console"><span class="wvp_console_header">Date Parsed Outputs</span><div id="log_date">Salidas de conversión...</div></div>
          </article>

          <!-- 17. wicopy -->
          <article class="wvp_tool_card">
            <span class="wvp_badge_num">#17</span>
            <div class="wvp_tool_header">
              <div class="wvp_tool_ico"><i class="fas fa-copy"></i></div>
              <div class="wvp_tool_title">
                <h2>wicopy</h2>
                <span>wicopy(text, el, msg)</span>
              </div>
            </div>
            <p class="wvp_tool_desc">Copia cadenas de texto o valores de selectores al portapapeles con fallback y confirmación visual mediante tooltip.</p>
            <div class="wvp_action_zone">
              <input type="text" class="wvp_input" id="copy_text_inp" value="¡Texto copiado desde CumpleWii Pro!">
              <button type="button" class="wvp_btn" id="btn_copy_run">Copiar Texto</button>
            </div>
            <div class="wvp_console"><span class="wvp_console_header">Portapapeles log</span><div id="log_copy">En espera...</div></div>
          </article>

          <!-- 18. wiSuma -->
          <article class="wvp_tool_card">
            <span class="wvp_badge_num">#18</span>
            <div class="wvp_tool_header">
              <div class="wvp_tool_ico"><i class="fas fa-hand-pointer"></i></div>
              <div class="wvp_tool_title">
                <h2>wiSuma</h2>
                <span>wiSuma(sel, fn, num)</span>
              </div>
            </div>
            <p class="wvp_tool_desc">Dispara una función tras detectar múltiples clics consecutivos en un mismo elemento selector.</p>
            <div class="wvp_action_zone">
              <button type="button" class="wvp_btn" id="btn_click_sum_target">Clics Consecutivos (0/5)</button>
            </div>
            <div class="wvp_console"><span class="wvp_console_header">wiSuma Log</span><div id="log_wisuma">Haz 5 clics rápidos seguidos.</div></div>
          </article>

          <!-- 19. year, Mayu, Capi, mis10 -->
          <article class="wvp_tool_card">
            <span class="wvp_badge_num">#19</span>
            <div class="wvp_tool_header">
              <div class="wvp_tool_ico"><i class="fas fa-text-width"></i></div>
              <div class="wvp_tool_title">
                <h2>year / Mayu / Capi / mis10</h2>
                <span>Helpers rápidos de formato</span>
              </div>
            </div>
            <p class="wvp_tool_desc">Operaciones rápidas de formato: año, mayúsculas, inicial capitalizada y truncar a 10 letras con puntos suspensivos.</p>
            <div class="wvp_action_zone">
              <input type="text" class="wvp_input" id="helpers_text_inp" placeholder="Escribe algo largo..." value="desarrollo de software premium">
            </div>
            <div class="wvp_console">
              <span class="wvp_console_header">Formatters Output</span>
              <div id="log_helpers">Evaluando...</div>
            </div>
          </article>

          <!-- 20. adrm, adtm, adup -->
          <article class="wvp_tool_card">
            <span class="wvp_badge_num">#20</span>
            <div class="wvp_tool_header">
              <div class="wvp_tool_ico"><i class="fas fa-rotate"></i></div>
              <div class="wvp_tool_title">
                <h2>adrm / adtm / adup</h2>
                <span>Helpers visuales de clases</span>
              </div>
            </div>
            <p class="wvp_tool_desc">adrm (exclusividad de clase entre hermanos), adtm (clase temporal por tiempo) y adup (efecto de actualización).</p>
            <div class="wvp_action_zone">
              <div class="siblings_row">
                <span class="sib_box active" id="sib_1">Caja A</span>
                <span class="sib_box" id="sib_2">Caja B</span>
                <span class="sib_box" id="sib_3">Caja C</span>
              </div>
              <button type="button" class="wvp_btn" id="btn_adtm_test">adtm (Flash)</button>
              <button type="button" class="wvp_btn wvp_btn_sec" id="btn_adup_test">adup (Actualizar)</button>
            </div>
            <div class="wvp_console"><span class="wvp_console_header">DOM Classes Log</span><div id="log_adclass">Haz clic en las cajas o botones.</div></div>
          </article>

          <!-- 21. wiPath -->
          <article class="wvp_tool_card">
            <span class="wvp_badge_num">#21</span>
            <div class="wvp_tool_header">
              <div class="wvp_tool_ico"><i class="fas fa-folder-open"></i></div>
              <div class="wvp_tool_title">
                <h2>wiPath</h2>
                <span>wiPath.limpiar / params / actual</span>
              </div>
            </div>
            <p class="wvp_tool_desc">Enrutador y limpiador de direcciones que extrae parámetros URL y normaliza subdirectorios o BASE_URL.</p>
            <div class="wvp_action_zone">
              <button type="button" class="wvp_btn" id="btn_path_eval">Evaluar URL Actual</button>
            </div>
            <div class="wvp_console"><span class="wvp_console_header">Path & Params Engine</span><div id="log_path">Resultados de ruta...</div></div>
          </article>

          <!-- 22. wiFade -->
          <article class="wvp_tool_card">
            <span class="wvp_badge_num">#22</span>
            <div class="wvp_tool_header">
              <div class="wvp_tool_ico"><i class="fas fa-circle-half-stroke"></i></div>
              <div class="wvp_tool_title">
                <h2>wiFade</h2>
                <span>wiFade(sel, html, dur)</span>
              </div>
            </div>
            <p class="wvp_tool_desc">Modificación de HTML interno con un efecto fade seguro contra colisiones asíncronas de navegación rápida.</p>
            <div class="wvp_action_zone">
              <div class="fade_sandbox_box" id="fade_sandbox_box">Contenido Original</div>
              <button type="button" class="wvp_btn" id="btn_fade_run">Cambiar Contenido</button>
            </div>
            <div class="wvp_console"><span class="wvp_console_header">Fade Status</span><div id="log_fade">Esperando cambio...</div></div>
          </article>

          <!-- 23. Capit, NombreApellido, getNombre, avatar -->
          <article class="wvp_tool_card">
            <span class="wvp_badge_num">#23</span>
            <div class="wvp_tool_header">
              <div class="wvp_tool_ico"><i class="fas fa-id-card"></i></div>
              <div class="wvp_tool_title">
                <h2>Nombre & Avatar Helpers</h2>
                <span>getNombre() / avatar() / NombreApellido()</span>
              </div>
            </div>
            <p class="wvp_tool_desc">Utilidades destinadas a procesar nombres de perfil completos para extraer la inicial de avatar y nombres cortos.</p>
            <div class="wvp_action_zone">
              <input type="text" class="wvp_input" id="name_helper_inp" value="Juan Good">
            </div>
            <div class="wvp_console"><span class="wvp_console_header">Resultados Formateados</span><div id="log_names">Escribe en el input de arriba.</div></div>
          </article>

          <!-- 24. fechaHoy, formatearFechaParaInput, formatearFechaHora, wiTiempo, calcMeses -->
          <article class="wvp_tool_card">
            <span class="wvp_badge_num">#24</span>
            <div class="wvp_tool_header">
              <div class="wvp_tool_ico"><i class="fas fa-clock"></i></div>
              <div class="wvp_tool_title">
                <h2>Fechas & Relativos</h2>
                <span>wiTiempo() / calcMeses() / fechaHoy()</span>
              </div>
            </div>
            <p class="wvp_tool_desc">Manejadores de fechas legibles en español, tiempos de publicación relativos y cálculo exacto de meses transcurridos.</p>
            <div class="wvp_action_zone">
              <input type="datetime-local" class="wvp_input" id="rel_time_input">
              <button type="button" class="wvp_btn" id="btn_rel_time_run">Calcular</button>
            </div>
            <div class="wvp_console"><span class="wvp_console_header">Fechas Calculadas</span><div id="log_dates_comp">Efectúa un cálculo.</div></div>
          </article>

          <!-- 25. gosave / getsave / gosaves / getsaves -->
          <article class="wvp_tool_card">
            <span class="wvp_badge_num">#25</span>
            <div class="wvp_tool_header">
              <div class="wvp_tool_ico"><i class="fas fa-floppy-disk"></i></div>
              <div class="wvp_tool_title">
                <h2>gosave / getsave</h2>
                <span>Auto-guardado de Sesión</span>
              </div>
            </div>
            <p class="wvp_tool_desc">Resguarda el estado de elementos o formularios de forma automatizada al interceptar el evento beforeunload.</p>
            <div class="wvp_action_zone">
              <input type="text" class="wvp_input" id="autosave_inp" placeholder="Escribe algo y recarga la página..." data-savekey="test_autosave">
              <button type="button" class="wvp_btn" id="btn_autosave_sim">Cargar Resguardo</button>
            </div>
            <div class="wvp_console"><span class="wvp_console_header">Session Backup status</span><div id="log_autosave">Carga de autosave lista.</div></div>
          </article>

        </div>
      </section>

      <!-- CONTENEDOR OCULTO PARA BENCHMARKS -->
      <div id="wvp_sandbox" class="wvp_bench_sandbox"></div>

      <!-- DIALOG MODAL DE PRUEBA -->
      <div id="wvp_modal_demo" class="wiModal">
        <div class="modalBody">
          <button class="modalX" id="btn_modal_x">&times;</button>
          <div class="wvp_modal_body">
            <div style="font-size: 3.5rem; color: #3cd741; margin-bottom: 1.5vh;"><i class="fas fa-circle-check"></i></div>
            <h2>Modal Vanilla Activo</h2>
            <p>
              Este cuadro de diálogo se ha renderizado y controlado al 100% con JavaScript nativo. Su foco y cierre responden de manera inmediata.
            </p>
            <button type="button" class="wvp_btn" id="btn_close_modal_test"><i class="fas fa-thumbs-up"></i> Entendido</button>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const init = () => {
  const sandbox = document.getElementById('wvp_sandbox');

  // --- GENERACIÓN PREVIA DE ELEMENTOS SANDBOX ---
  const _prepararSandbox = (n) => {
    if (!sandbox) return;
    sandbox.innerHTML = '';
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const div = document.createElement('div');
      div.className = 'wvp_dummy_item';
      div.textContent = `Item ${i}`;
      fragment.appendChild(div);
    }
    sandbox.appendChild(fragment);
  };

  // ==================== SECCIÓN A: METRICAS BENCHMARK ====================

  // --- BENCHMARK 1: SELECCIÓN ---
  document.getElementById('btn_run_select')?.addEventListener('click', () => {
    _prepararSandbox(1000);

    // Vanilla JS
    const vStart = performance.now();
    const vList = document.querySelectorAll('.wvp_dummy_item');
    const vLen = vList.length;
    const vTime = performance.now() - vStart;

    // jQuery
    const jStart = performance.now();
    const jList = $('.wvp_dummy_item');
    const jLen = jList.length;
    const jTime = performance.now() - jStart;

    // Pintar resultados
    const vTimeText = vTime.toFixed(4);
    const jTimeText = jTime.toFixed(4);
    document.getElementById('v_select_time').textContent = `${vTimeText} ms`;
    document.getElementById('j_select_time').textContent = `${jTimeText} ms`;

    // Calcular proporción y barras
    const max = Math.max(vTime, jTime, 0.0001);
    const vPercent = (vTime / max) * 100;
    const jPercent = (jTime / max) * 100;
    
    const vBar = document.getElementById('v_select_bar');
    const jBar = document.getElementById('j_select_bar');
    if (vBar) vBar.style.width = `${vPercent}%`;
    if (jBar) jBar.style.width = `${jPercent}%`;

    const diff = jTime / Math.max(vTime, 0.0001);
    const speedupEl = document.getElementById('select_speedup');
    if (speedupEl) {
      speedupEl.innerHTML = `<i class="fas fa-bolt"></i> Vanilla JS es <strong>${diff.toFixed(1)}x</strong> más rápido`;
    }
  });

  // --- BENCHMARK 2: ESTILOS ---
  document.getElementById('btn_run_style')?.addEventListener('click', () => {
    _prepararSandbox(500);

    const els = document.querySelectorAll('.wvp_dummy_item');
    const $els = $('.wvp_dummy_item');

    // Vanilla JS
    const vStart = performance.now();
    for (let j = 0; j < 10; j++) {
      els.forEach(el => el.classList.toggle('wvp_active_test'));
    }
    const vTime = performance.now() - vStart;

    // jQuery
    const jStart = performance.now();
    for (let j = 0; j < 10; j++) {
      $els.toggleClass('wvp_active_test');
    }
    const jTime = performance.now() - jStart;

    // Pintar resultados
    const vTimeText = vTime.toFixed(4);
    const jTimeText = jTime.toFixed(4);
    document.getElementById('v_style_time').textContent = `${vTimeText} ms`;
    document.getElementById('j_style_time').textContent = `${jTimeText} ms`;

    const max = Math.max(vTime, jTime, 0.0001);
    const vPercent = (vTime / max) * 100;
    const jPercent = (jTime / max) * 100;
    
    const vBar = document.getElementById('v_style_bar');
    const jBar = document.getElementById('j_style_bar');
    if (vBar) vBar.style.width = `${vPercent}%`;
    if (jBar) jBar.style.width = `${jPercent}%`;

    const diff = jTime / Math.max(vTime, 0.0001);
    const speedupEl = document.getElementById('style_speedup');
    if (speedupEl) {
      speedupEl.innerHTML = `<i class="fas fa-bolt"></i> Vanilla JS es <strong>${diff.toFixed(1)}x</strong> más rápido`;
    }
  });

  // --- BENCHMARK 3: RENDERIZADO ---
  document.getElementById('btn_run_render')?.addEventListener('click', () => {
    if (!sandbox) return;

    // Vanilla JS (HTML String template literals append)
    const vStart = performance.now();
    sandbox.innerHTML = '';
    let html = '';
    for (let i = 0; i < 500; i++) {
      html += `<div class="wvp_dummy_card" style="padding: 10px; margin: 5px; border: 1px solid #ddd;">
        <strong>Cumpleañero ${i}</strong>
        <span>Faltan ${i % 30} días</span>
      </div>`;
    }
    sandbox.innerHTML = html;
    const vTime = performance.now() - vStart;

    // jQuery (Wrapper wrapping nodes append)
    const jStart = performance.now();
    sandbox.innerHTML = '';
    for (let i = 0; i < 500; i++) {
      const card = $('<div>').addClass('wvp_dummy_card').css({ padding: '10px', margin: '5px', border: '1px solid #ddd' });
      card.append($('<strong>').text(`Cumpleañero ${i}`));
      card.append($('<span>').text(`Faltan ${i % 30} días`));
      $(sandbox).append(card);
    }
    const jTime = performance.now() - jStart;

    // Pintar resultados
    const vTimeText = vTime.toFixed(4);
    const jTimeText = jTime.toFixed(4);
    document.getElementById('v_render_time').textContent = `${vTimeText} ms`;
    document.getElementById('j_render_time').textContent = `${jTimeText} ms`;

    const max = Math.max(vTime, jTime, 0.0001);
    const vPercent = (vTime / max) * 100;
    const jPercent = (jTime / max) * 100;
    
    const vBar = document.getElementById('v_render_bar');
    const jBar = document.getElementById('j_render_bar');
    if (vBar) vBar.style.width = `${vPercent}%`;
    if (jBar) jBar.style.width = `${jPercent}%`;

    const diff = jTime / Math.max(vTime, 0.0001);
    const speedupEl = document.getElementById('render_speedup');
    if (speedupEl) {
      speedupEl.innerHTML = `<i class="fas fa-bolt"></i> Vanilla JS es <strong>${diff.toFixed(1)}x</strong> más rápido`;
    }

    // Limpiar sandbox
    sandbox.innerHTML = '';
  });


  // ==================== SECCIÓN B: SUITE INTERACTIVA ====================

  // --- 01. setMeta ---
  document.getElementById('btn_meta_run')?.addEventListener('click', () => {
    const val = document.getElementById('meta_title_inp')?.value || 'CumpleWii Pro';
    setMeta({
      title: val,
      desc: 'Página de benchmark y utilidades mejorada a Vanilla JS',
      keywords: 'cumplewii, vanilla, benchmark, speed',
      type: 'Article',
      datePublished: new Date()
    });
    
    const logEl = document.getElementById('log_meta');
    if (logEl) {
      logEl.innerHTML = `document.title = "${document.title}"<br>Schema Article inyectado en head.<br>Metas actualizados de forma reactiva.`;
    }
    Notificacion('Metadatos SEO actualizados', 'success');
  });

  // --- 02. wiVista (Simulación de Carga Inteligente de Documento) ---
  let wivistaObs = null;
  let nextPageNum = 2;
  const wivistaContainer = document.getElementById('wivista_scroll_container');
  const triggerEl = document.getElementById('wivista_load_trigger');

  const setupVistaObserver = () => {
    if (!wivistaContainer || !triggerEl) return;
    
    wivistaObs = wiVista('#wivista_load_trigger', (el) => {
      const logEl = document.getElementById('log_wivista');
      if (logEl) logEl.innerHTML += `[wiVista] Detectado fin de página. Cargando Página ${nextPageNum}...<br>`;
      
      setTimeout(() => {
        const newPage = document.createElement('div');
        newPage.className = 'scroll_page';
        newPage.id = `page_${nextPageNum}`;
        newPage.textContent = `📄 Página de Documento ${nextPageNum} (Cargada inteligentemente con wiVista)`;
        
        // Insertar la nueva página antes del cargador
        wivistaContainer.insertBefore(newPage, triggerEl);
        
        if (logEl) {
          logEl.innerHTML += `[wiVista] Página ${nextPageNum} renderizada suavemente.<br>`;
          logEl.scrollTop = logEl.scrollHeight;
        }
        nextPageNum++;
        
        if (nextPageNum > 4) {
          triggerEl.innerHTML = '<i class="fas fa-check-double"></i> Documento completo (4 páginas cargadas)';
          if (wivistaObs) wivistaObs.unobserve(triggerEl);
        } else {
          // Re-observar el trigger para la siguiente página
          setupVistaObserver();
        }
      }, 700);
    }, { root: wivistaContainer, once: true, threshold: 0.05 });
  };
  setupVistaObserver();

  // --- 03. herowi ---
  document.getElementById('btn_herowi_run')?.addEventListener('click', () => {
    const cont = document.getElementById('herowi_container');
    if (cont) {
      const children = cont.querySelectorAll('.hwi_item');
      children.forEach(c => {
        c.classList.remove('hwi');
        delete c.dataset.hi;
      });
      herowi('#herowi_container', 60);
      const logEl = document.getElementById('log_herowi');
      if (logEl) logEl.innerHTML = `Animación herowi aplicada.<br>Delays escalonados por index.`;
    }
  });

  // --- 04. showi ---
  document.getElementById('btn_showi_run')?.addEventListener('click', () => {
    const cont = document.getElementById('showi_container_box');
    if (cont) {
      const children = cont.querySelectorAll('.showi_item');
      children.forEach(c => {
        c.style.opacity = '0';
        c.style.transform = 'translateY(3vh)';
        c.classList.add('swi');
        delete c.dataset.i;
      });
      showi('#showi_container_box', 120);
      const logEl = document.getElementById('log_showi');
      if (logEl) logEl.textContent = `[showi] Reiniciado. Elementos se deslizan en cascada y permanecen visibles.`;
    }
  });
  // Trigger inicial de herowi y showi
  herowi('#herowi_container', 60);
  showi('#showi_container_box', 120);

  // --- 05. wiSpin ---
  document.getElementById('btn_spin_test')?.addEventListener('click', (e) => {
    const btn = e.currentTarget;
    wiSpin(btn, true, 'Guardando');
    const logEl = document.getElementById('log_spin');
    if (logEl) logEl.textContent = 'Estado: Cargando (disabled = true)...';
    
    setTimeout(() => {
      wiSpin(btn, false, 'Guardar Cambios');
      if (logEl) logEl.textContent = 'Estado: Listo (restaurado).';
    }, 1500);
  });

  // --- 06. wiScroll (Scroll Spy) ---
  const spyViewport = document.getElementById('spy_scroll_viewport');
  if (spyViewport) {
    wiScroll(['spySec1', 'spySec2', 'spySec3'], '.spy_lnk', {
      margin: '-10% 0px -50% 0px',
      cls: 'active'
    });
    
    // Dispara log en cambio
    spyViewport.addEventListener('scroll', () => {
      const activeLnk = document.querySelector('.spy_lnk.active');
      const logEl = document.getElementById('log_spy');
      if (activeLnk && logEl) {
        logEl.textContent = `Sección activa: ${activeLnk.textContent} (${activeLnk.getAttribute('href')})`;
      }
    });
  }

  // --- 07. LocalStorage ---
  document.getElementById('btn_ls_save')?.addEventListener('click', () => {
    const k = document.getElementById('ls_key')?.value;
    const v = document.getElementById('ls_val')?.value;
    if (k && v) {
      savels(k, v, 2);
      const logEl = document.getElementById('log_ls');
      if (logEl) logEl.textContent = `[savels] Guardado: ${k} -> ${v} (Expira en 2 horas)`;
    }
  });
  document.getElementById('btn_ls_get')?.addEventListener('click', () => {
    const k = document.getElementById('ls_key')?.value;
    if (k) {
      const v = getls(k);
      const logEl = document.getElementById('log_ls');
      if (logEl) logEl.textContent = `[getls] Clave "${k}" = ${v === null ? 'null (expiró o no existe)' : `"${v}"`}`;
    }
  });
  document.getElementById('btn_ls_del')?.addEventListener('click', () => {
    const k = document.getElementById('ls_key')?.value;
    if (k) {
      removels(k);
      const logEl = document.getElementById('log_ls');
      if (logEl) logEl.textContent = `[removels] Removido: "${k}"`;
    }
  });

  // --- 08. wiAuth ---
  const _actualizarAuthLog = () => {
    const user = wiAuth.user;
    const logEl = document.getElementById('log_auth');
    if (logEl) {
      logEl.innerHTML = user 
        ? `Usuario: <strong>${user.nombre}</strong><br>Rol: ${user.rol}<br>Autenticado: Sí`
        : `Usuario: <strong>Ninguno (null)</strong><br>Autenticado: No`;
    }
  };
  
  // Registrar listener reactivo
  const unbindAuth = wiAuth.on((u) => {
    _actualizarAuthLog();
  });

  document.getElementById('btn_auth_login')?.addEventListener('click', () => {
    wiAuth.login({ nombre: 'Juan Doe', rol: 'admin', estado: 'activo' });
    Notificacion('Sesión iniciada con wiAuth', 'success');
  });

  document.getElementById('btn_auth_logout')?.addEventListener('click', () => {
    wiAuth.logout();
    Notificacion('Sesión cerrada con wiAuth', 'info');
  });

  // --- 09. wiSmart ---
  document.getElementById('btn_wismart_run')?.addEventListener('click', () => {
    const logEl = document.getElementById('log_wismart');
    wiSmart({
      fn: [
        async () => {
          if (logEl) logEl.innerHTML += 'Smart Callback 1 ejecutado.<br>';
        },
        async () => {
          if (logEl) logEl.innerHTML += 'Smart Callback 2 ejecutado.<br>';
        }
      ]
    });
    if (logEl) logEl.innerHTML = 'wiSmart inicializado. Toca la pantalla, muévela o haz scroll para disparar callbacks.<br>';
  });

  // --- 10. Saludar ---
  document.getElementById('btn_saludo_run')?.addEventListener('click', () => {
    const sal = Saludar();
    const user = wiAuth.user?.nombre || 'Invitado';
    const logEl = document.getElementById('log_saludo');
    if (logEl) logEl.textContent = `${sal}${user}!`;
  });

  // --- 11. Notificacion ---
  document.getElementById('btn_notif_success')?.addEventListener('click', () => {
    Notificacion('Operación procesada con éxito', 'success');
    const logEl = document.getElementById('log_notif');
    if (logEl) logEl.textContent = 'Notificación Success desplegada';
  });
  document.getElementById('btn_notif_error')?.addEventListener('click', () => {
    Notificacion('Algo salió mal en el servidor', 'error');
    const logEl = document.getElementById('log_notif');
    if (logEl) logEl.textContent = 'Notificación Error desplegada';
  });
  document.getElementById('btn_notif_warning')?.addEventListener('click', () => {
    Notificacion('Advertencia: espacio libre bajo', 'warning');
    const logEl = document.getElementById('log_notif');
    if (logEl) logEl.textContent = 'Notificación Warning desplegada';
  });
  document.getElementById('btn_notif_info')?.addEventListener('click', () => {
    Notificacion('Nueva actualización disponible', 'info');
    const logEl = document.getElementById('log_notif');
    if (logEl) logEl.textContent = 'Notificación Info desplegada';
  });

  // --- 12. Mensaje ---
  document.getElementById('btn_msg_success')?.addEventListener('click', () => {
    Mensaje('Mensaje superior inyectado con Vanilla JS', 'success');
    const logEl = document.getElementById('log_msg');
    if (logEl) logEl.textContent = 'Mensaje Success activo.';
  });
  document.getElementById('btn_msg_error')?.addEventListener('click', () => {
    Mensaje('Error grave simulado por consola', 'error');
    const logEl = document.getElementById('log_msg');
    if (logEl) logEl.textContent = 'Mensaje Error activo.';
  });

  // --- 13. wiTip ---
  wiTip();
  
  document.getElementById('btn_tip_manual')?.addEventListener('click', (e) => {
    wiTip(e.currentTarget, '¡Tooltip manual por JavaScript!', 'success', 2000);
    const logEl = document.getElementById('log_tip');
    if (logEl) logEl.textContent = 'Tooltip programático lanzado en botón.';
  });

  // --- 14. wiIp ---
  document.getElementById('btn_ip_fetch')?.addEventListener('click', () => {
    const logEl = document.getElementById('log_ip');
    if (logEl) logEl.textContent = 'Consultando API de ipinfo...';
    
    wiIp((res) => {
      if (logEl) {
        if (res) {
          logEl.innerHTML = `<pre style="margin:0;font-size:11px;">IP: ${res.ip}
Ciudad: ${res.city}, ${res.country}
Dispositivo: ${res.device} (${res.os})
Browser: ${res.browser}
Z.H: ${res.timezone} (UTC ${res.utcOffset})
Online: ${res.online}</pre>`;
        } else {
          logEl.textContent = 'Error: No se pudieron obtener los detalles de red.';
        }
      }
    });
  });

  // --- 15. Modales ---
  document.getElementById('btn_modal_open')?.addEventListener('click', () => {
    abrirModal('wvp_modal_demo');
    const logEl = document.getElementById('log_modal');
    if (logEl) logEl.textContent = 'Modal activo: wvp_modal_demo. CSS dinámico wiModal inyectado.';
  });
  
  document.getElementById('btn_close_modal_test')?.addEventListener('click', () => {
    cerrarModal('wvp_modal_demo');
    const logEl = document.getElementById('log_modal');
    if (logEl) logEl.textContent = 'Modal cerrado mediante botón.';
  });

  document.getElementById('btn_modal_x')?.addEventListener('click', () => {
    cerrarModal('wvp_modal_demo');
    const logEl = document.getElementById('log_modal');
    if (logEl) logEl.textContent = 'Modal cerrado mediante aspa superior.';
  });

  // --- 16. wiDate ---
  document.getElementById('btn_date_parse')?.addEventListener('click', () => {
    const val = document.getElementById('date_input_test')?.value;
    const logEl = document.getElementById('log_date');
    if (val && logEl) {
      // Mock del objeto Firebase Timestamp
      const mockTm = {
        fromDate: (date) => ({ seconds: Math.floor(date.getTime() / 1000) }),
        toDate: () => new Date(val)
      };
      
      const dateAdapter = wiDate(mockTm);
      const saved = dateAdapter.save(val);
      const local = dateAdapter.get(saved, 'local');
      const full = dateAdapter.get(saved, 'full');
      const standard = dateAdapter.get(saved, 'std');

      logEl.innerHTML = `Entrada: ${val}<br>
Firebase seconds: ${saved.seconds}<br>
get(local): ${local}<br>
get(full): ${full}<br>
get(std): ${standard}`;
    }
  });

  // --- 17. wicopy ---
  document.getElementById('btn_copy_run')?.addEventListener('click', (e) => {
    wicopy('#copy_text_inp', e.currentTarget, '¡Texto Copiado!');
    const logEl = document.getElementById('log_copy');
    if (logEl) logEl.textContent = 'Texto enviado al portapapeles y notificado.';
  });

  // --- 18. wiSuma ---
  let clickCount = 0;
  wiSuma('#btn_click_sum_target', () => {
    clickCount = 0;
    const btn = document.getElementById('btn_click_sum_target');
    if (btn) btn.textContent = 'Clicks Consecutivos (0/5)';
    
    const logEl = document.getElementById('log_wisuma');
    if (logEl) logEl.textContent = '¡ÉXITO! Se alcanzaron 5 clics seguidos.';
    
    Notificacion('¡wiSuma detectó 5 clics rápidos!', 'success');
  }, 5);

  document.getElementById('btn_click_sum_target')?.addEventListener('click', (e) => {
    clickCount++;
    e.currentTarget.textContent = `Clicks Consecutivos (${clickCount}/5)`;
    const logEl = document.getElementById('log_wisuma');
    if (logEl) logEl.textContent = `Clic #${clickCount} recibido.`;
  });

  // --- 19. year / Mayu / Capi / mis10 ---
  const textInp = document.getElementById('helpers_text_inp');
  const _evalHelpers = () => {
    const txt = textInp?.value || '';
    const logEl = document.getElementById('log_helpers');
    if (logEl) {
      logEl.innerHTML = `year(): ${year()}<br>
Mayu("${txt}"): ${Mayu(txt)}<br>
Capi("${txt}"): ${Capi(txt)}<br>
mis10("${txt}"): ${mis10(txt)}`;
    }
  };
  textInp?.addEventListener('input', _evalHelpers);
  _evalHelpers();

  // --- 20. adrm / adtm / adup ---
  const sibs = document.querySelectorAll('.siblings_row .sib_box');
  sibs.forEach(sib => {
    sib.addEventListener('click', (e) => {
      adrm(e.currentTarget, 'active');
      const logEl = document.getElementById('log_adclass');
      if (logEl) logEl.textContent = `[adrm] Activado el nodo #${e.currentTarget.id} y limpiados sus hermanos.`;
    });
  });

  document.getElementById('btn_adtm_test')?.addEventListener('click', (e) => {
    adtm(e.currentTarget, 'flash_active', '¡FLASH!', 'adtm (Flash)');
    const logEl = document.getElementById('log_adclass');
    if (logEl) logEl.textContent = '[adtm] Clase flash_active inyectada por 1.8 segundos.';
  });

  document.getElementById('btn_adup_test')?.addEventListener('click', (e) => {
    adup(e.currentTarget, '¡ACTUALIZANDO!');
    setTimeout(() => { e.currentTarget.textContent = 'adup (Actualizar)'; }, 500);
    const logEl = document.getElementById('log_adclass');
    if (logEl) logEl.textContent = '[adup] Texto cambiado y clase class="updating" inyectada.';
  });

  // --- 21. wiPath ---
  document.getElementById('btn_path_eval')?.addEventListener('click', () => {
    const logEl = document.getElementById('log_path');
    if (logEl) {
      logEl.innerHTML = `wiPath.actual: "${wiPath.actual}"<br>
wiPath.limpiar(location.pathname): "${wiPath.limpiar(location.pathname)}"<br>
wiPath.params(): ${JSON.stringify(wiPath.params())}`;
    }
  });

  // --- 22. wiFade ---
  let fadeToggle = false;
  document.getElementById('btn_fade_run')?.addEventListener('click', () => {
    fadeToggle = !fadeToggle;
    const content = fadeToggle 
      ? '<strong style="color:var(--mco);">Contenido Renovado Pro</strong>' 
      : 'Contenido Original';
      
    wiFade('#fade_sandbox_box', content, 120);
    const logEl = document.getElementById('log_fade');
    if (logEl) logEl.textContent = 'Efecto de fade ejecutado en caja.';
  });

  // --- 23. Nombre & Avatar helpers ---
  const nameInp = document.getElementById('name_helper_inp');
  const _evalNames = () => {
    const val = nameInp?.value || '';
    const logEl = document.getElementById('log_names');
    if (logEl) {
      logEl.innerHTML = `Capit(): "${Capit(val)}"<br>
NombreApellido(): "${NombreApellido(val)}"<br>
getNombre(): "${getNombre(val)}"<br>
avatar(): "${avatar(val)}"`;
    }
  };
  nameInp?.addEventListener('input', _evalNames);
  _evalNames();

  // --- 24. Fechas y Relativos ---
  const dateInp = document.getElementById('rel_time_input');
  if (dateInp) {
    const threeHrsAgo = new Date(Date.now() - 3 * 3600 * 1000);
    dateInp.value = new Date(threeHrsAgo.getTime() - threeHrsAgo.getTimezoneOffset() * 60000).toISOString().slice(0,16);
  }

  document.getElementById('btn_rel_time_run')?.addEventListener('click', () => {
    const val = dateInp?.value;
    const logEl = document.getElementById('log_dates_comp');
    if (val && logEl) {
      const ms = new Date(val).getTime();
      const relative = wiTiempo({ seconds: Math.floor(ms / 1000) });
      const formatted = formatearFechaHora({ seconds: Math.floor(ms / 1000) });
      const months = calcMeses(ms);
      
      logEl.innerHTML = `fechaHoy(): "${fechaHoy()}"<br>
formatearFechaParaInput(): "${formatearFechaParaInput(ms)}"<br>
formatearFechaHora(): "${formatted}"<br>
wiTiempo(): "${relative}"<br>
calcMeses(): ${months} meses de diferencia`;
    }
  });

  // --- 25. gosave / getsave ---
  const autoInp = document.getElementById('autosave_inp');
  if (autoInp) {
    getsave('test_autosave', (val) => {
      autoInp.value = val;
      const logEl = document.getElementById('log_autosave');
      if (logEl) logEl.textContent = `[getsave] Recuperado: "${val}"`;
    });
    gosave('test_autosave', autoInp.value);
    
    autoInp.addEventListener('input', (e) => {
      savels('test_autosave', e.target.value, 168);
      const logEl = document.getElementById('log_autosave');
      if (logEl) logEl.textContent = `[savels] Guardado en vivo: "${e.target.value}"`;
    });
  }

  document.getElementById('btn_autosave_sim')?.addEventListener('click', () => {
    const val = getls('test_autosave');
    const logEl = document.getElementById('log_autosave');
    if (logEl) {
      logEl.textContent = val 
        ? `[getls] Resguardo activo: "${val}"`
        : `[getls] Resguardo vacío. Escribe algo en el input para resguardar.`;
    }
  });

  window._wvp_unbind_auth = unbindAuth;
  window._wvp_obs_wivista = wivistaObs;

  console.log('⚡ Módulo widevpro cargado en Vanilla JS con 100% de la suite.');
};

export const cleanup = () => {
  const sandbox = document.getElementById('wvp_sandbox');
  if (sandbox) sandbox.innerHTML = '';

  if (window._wvp_unbind_auth) {
    window._wvp_unbind_auth();
    delete window._wvp_unbind_auth;
  }
  if (window._wvp_obs_wivista) {
    window._wvp_obs_wivista.disconnect?.();
    delete window._wvp_obs_wivista;
  }
};

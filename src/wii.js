// INFORMACIÓN DEL APP 
export let id = 'wiidesk'
export let app = 'Wiidesk'
export let icon = 'fa-desktop'
export let titulo = 'Wiidesk - Control Remoto Premium de Escritorio';
export let keywii = 'control remoto, escritorio remoto, webrtc, tauri, rust, wiidesk, ultra baja latencia';
export let descri = 'Accede y controla tus computadoras de forma segura y con ultra-baja latencia desde cualquier dispositivo con tecnología WebRTC Peer-to-Peer.';
export let linkweb = 'https://wiidesk.web.app'; // Sin slash (/), al final
export let lanzamiento = 2026;
export let by = '@wilder.taype';
export let linkme = 'https://wtaype.github.io/';
export let ipdev = import.meta.env.VITE_DEV;
export let version = 'v1.0.0'; // Siempre va "v" para estructura

/** ACTUALIZAR AL TAG POR SEGURIDAD [TAG NUEVO] (1)
git tag v11 -m "Version v11" ; git push origin v11 

ACTUALIZACIÓN AL MAIN PRINCIPAL DEL PROYECTO [MAIN] (2)
git add . ; git commit -m "Actualizacion Principal v11.10.10" ; git push origin main

// REEMPLAZAR TAG DE SEGURIDAD EXISTENTE [TAG REMPLAZO] (3)
git tag -d v11 ; git tag v11 -m "Version v11 actualizada" ; git push origin v11 --force

// Actualizar versiones de seguridad [ELIMINAR CARPETA - ARCHIVO ONLINE] (4)
git rm --cached skills-lock.json ; git commit -m "Archivo Eliminado" ; git push origin main
git rm -r --cached .claude/ ; git commit -m "Carpeta Eliminada" ; git push origin main 
git tag -d 10 ; git push origin --delete 10 // Eliminar tag del local y remoto.
 ACTUALIZACION TAG[END] */

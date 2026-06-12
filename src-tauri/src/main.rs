// main.rs — Punto de entrada del ejecutable Windows
// cfg_attr oculta la ventana de consola en builds de release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    std::env::set_var(
        "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
        "--auto-select-desktop-capture-source=\"Entire screen\" --use-fake-ui-for-media-stream"
    );
    wiidesk_lib::run()
}
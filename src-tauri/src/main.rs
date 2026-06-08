// main.rs — Punto de entrada del ejecutable Windows
// cfg_attr oculta la ventana de consola en builds de release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    wiidesk_lib::run()
}
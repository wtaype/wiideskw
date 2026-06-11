// src/usuarios/estados/estados.js — Punto de entrada unificado y re-exportador
export { getEstado, setEstado, suscribir, salir } from './nucleo.js';

// Importar los submódulos de estado para que inicialicen sus oyentes de Firestore
import './lab.js';

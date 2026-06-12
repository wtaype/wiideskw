// src/usuarios/movil2pc/devs.js — Utilidades y validaciones específicas para Móvil a PC

/**
 * Filtra un texto para permitir únicamente letras y números.
 */
export const filtrarAlfanumerico = (texto = '') => {
  return texto.replace(/[^a-zA-Z0-9]/g, '');
};

/**
 * Valida si un PIN cumple con la longitud (4 a 6 caracteres) y formato alfanumérico.
 */
export const validarPin = (pin = '') => {
  const limpio = filtrarAlfanumerico(pin);
  return limpio.length >= 4 && limpio.length <= 6 && limpio === pin;
};

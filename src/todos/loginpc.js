document.addEventListener('click', (e) => {
  const btn = e.target.closest('.loginpc');
  if (btn) {
    alert('¡Hola! Has hecho clic en el botón.');
  }
});
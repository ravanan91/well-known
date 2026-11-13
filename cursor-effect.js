(() => {
  const canUseEffect = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canUseEffect) return;

  const cursor = document.querySelector('.light-orb-cursor');
  if (!cursor) return;

  let frame = 0;
  let x = -100;
  let y = -100;
  const draw = () => {
    frame = 0;
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };
  const move = (event) => {
    x = event.clientX;
    y = event.clientY;
    cursor.classList.add('is-visible');
    if (!frame) frame = requestAnimationFrame(draw);
  };

  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('pointerdown', move, { passive: true });
  document.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));
})();

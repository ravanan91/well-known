// Ensure the top-left LUXIAD logo acts as a reliable link back to the homepage.
// Some pages render the logo as a <button> (or another non-link element).

function goHome() {
  // Keep it simple and consistent across the static site.
  window.location.href = '/';
}

function matchesHomeControl(el) {
  if (!(el instanceof Element)) return false;

  // Common variants we have across pages / bundles.
  return Boolean(
    el.closest(
      [
        // Contact page
        'button.contact-logo',
        // Some static pages
        'button[aria-label="Retour à l\u2019accueil"]',
        'button[aria-label="Retour à l’accueil"]',
        'button[aria-label="Retour à l\'accueil"]',
        // Some bundles use the non-curly apostrophe
        'button[aria-label="Retour à l\u0027accueil"]',
      ].join(', '),
    ),
  );
}

function install() {
  // Click / tap.
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target;
      if (!matchesHomeControl(target)) return;
      event.preventDefault();
      goHome();
    },
    true,
  );

  // Keyboard activation for <button>.
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const target = event.target;
      if (!matchesHomeControl(target)) return;
      event.preventDefault();
      goHome();
    },
    true,
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', install, { once: true });
} else {
  install();
}


// Removes the decorative marquee layer without touching the Three.js book.
// (The book/menu are managed by the existing bundle.)

function removeMarquee(root = document) {
  const marquee = root.querySelector?.('.history-r3f-marquee');
  if (marquee) marquee.remove();
}

function ensureFooterLinks(root = document) {
  const footer = root.querySelector?.('footer');
  if (!footer) return;

  const links = [
    { href: '/solutions/', label: 'Nos services' },
    { href: '/realisations/', label: 'Réalisations' },
    { href: '/a-propos/', label: 'À propos' },
    { href: '/confidentialite/', label: 'Mentions légales et confidentialité' },
    { href: '/conditions/', label: 'Conditions d’utilisation' },
    { href: '/contact/', label: 'Contact' },
  ];

  const linkClass =
    'text-xs font-body font-light text-white/40 transition-colors hover:text-white/70';

  let nav = footer.querySelector?.('nav[aria-label="Informations"]');
  if (!nav) {
    nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Informations');
    footer.appendChild(nav);
  }

  if (!nav.className) {
    nav.className = 'flex flex-wrap justify-center items-center gap-6';
  }

  nav.replaceChildren(
    ...links.map(({ href, label }) => {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      a.className = linkClass;
      return a;
    }),
  );
}

function startMarqueeRemoval() {
  removeMarquee();
  ensureFooterLinks();

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches?.('.history-r3f-marquee')) {
          node.remove();
          continue;
        }
        removeMarquee(node);
        ensureFooterLinks(node);
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startMarqueeRemoval, { once: true });
} else {
  startMarqueeRemoval();
}


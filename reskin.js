(function () {
  const map = document.getElementById('map');
  const list = document.getElementById('checkinList');
  const sidebar = document.getElementById('sidebar');
  const bottomNav = document.getElementById('bottomNav');

  // Switch tab (solo UI)
  bottomNav?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-tab]');
    if (!btn) return;
    const tab = btn.getAttribute('data-tab');

    // stato aria-pressed
    [...bottomNav.querySelectorAll('button[data-tab]')].forEach(b => b.setAttribute('aria-pressed', String(b === btn)));

    if (tab === 'map') {
      map?.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'list') {
      list?.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'filters') {
      // usa la sidebar già esistente come pannello filtri su mobile
      sidebar?.classList.toggle('open');
      window.updateSidebar && window.updateSidebar();
    }
  });

  // Tema (mobile) — riusa la logica del pulsante desktop
  const themeBtnMobile = document.getElementById('themeToggleMobile');
  themeBtnMobile?.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('theme-dark');
    const next = isDark ? 'light' : 'dark';
    localStorage.setItem('am_theme', next);
    document.documentElement.classList.toggle('theme-dark', !isDark);
    themeBtnMobile.setAttribute('aria-pressed', String(!isDark));
  });

  // FAB -> apre modale "Nuovo check-in"
  document.getElementById('newCheckinFab')?.addEventListener('click', () => {
    const m = document.getElementById('modal');
    if (m) {
      m.style.display = 'flex';
      document.body.classList.add('no-scroll');
      m.querySelector('input, textarea, button')?.focus();
    }
  });
})();

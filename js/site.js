(() => {
  const readingProgress = document.querySelector('.reading-progress span');
  if (readingProgress) {
    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(100, Math.max(0, window.scrollY / scrollable * 100)) : 100;
      readingProgress.style.width = `${progress}%`;
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
  }
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    const updateBackToTop = () => {
      backToTop.hidden = window.scrollY < 480;
    };
    window.addEventListener('scroll', updateBackToTop, { passive: true });
    updateBackToTop();
    backToTop.addEventListener('click', () => {
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      window.scrollTo({ top: 0, behavior });
    });
  }
  const themeKey = 'aragon-schole-theme';
  const themeButton = document.querySelector('.theme-toggle');
  const applyThemeToLinks = () => {
    if (window.location.protocol !== 'file:') return;
    const theme = document.documentElement.dataset.theme;
    for (const link of document.querySelectorAll('a[href]')) {
      const url = new URL(link.href, window.location.href);
      if (url.protocol === 'file:' && url.pathname.endsWith('.html')) {
        url.searchParams.set('theme', theme);
        link.href = url.href;
      }
    }
  };
  const updateThemeButton = () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    if (!themeButton) return;
    themeButton.setAttribute('aria-pressed', String(dark));
    themeButton.setAttribute('aria-label', `Alternar tema; activar tema ${dark ? 'claro' : 'oscuro'}`);
    themeButton.title = 'Alternar tema';
    themeButton.textContent = dark ? '☼' : '☾';
  };
  updateThemeButton();
  applyThemeToLinks();

  if (themeButton) {
    themeButton.addEventListener('click', () => {
      const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = theme;
      try {
        window.localStorage.setItem(themeKey, theme);
      } catch {
        // file:// storage can be unavailable; internal links carry the selected theme.
      }
      if (window.location.protocol === 'file:') {
        const url = new URL(window.location.href);
        url.searchParams.set('theme', theme);
        window.history.replaceState(null, '', url);
      }
      updateThemeButton();
      applyThemeToLinks();
    });
  }

  const normalize = (value) => String(value || '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
  const lexiconSearch = document.querySelector('#lexicon-search');
  if (lexiconSearch) {
    const entries = [...document.querySelectorAll('.lexicon-list > [data-search]')];
    const empty = document.querySelector('.lexicon-empty');
    lexiconSearch.addEventListener('input', () => {
      const query = normalize(lexiconSearch.value);
      let matches = 0;
      for (const entry of entries) {
        entry.hidden = !normalize(entry.dataset.search).includes(query);
        if (!entry.hidden) matches += 1;
      }
      if (empty) empty.hidden = matches > 0;
    });
  }
  const filter = document.querySelector('#current-filter');
  const filterItems = [...document.querySelectorAll('#article-grid [data-corriente], .article-list [data-corriente], .search-results [data-corriente]')];
  const params = new URLSearchParams(window.location.search);
  const query = normalize(params.get('q'));
  const indexedArticles = new Map((window.INDICE || []).map((article) => [article.slug, article]));

  const updateResults = () => {
    let visible = 0;
    for (const item of filterItems) {
      const article = indexedArticles.get(item.dataset.slug);
      const text = article ? normalize(`${article.titulo} ${article.autor} ${article.corriente}`) : normalize(item.dataset.search);
      const matchesQuery = !query || text.includes(query);
      const matchesCurrent = !filter?.value || item.dataset.corriente === filter.value;
      item.hidden = !(matchesQuery && matchesCurrent);
      if (!item.hidden) visible += 1;
    }
    const empty = document.querySelector('.empty-filter, .search-empty');
    if (empty) empty.hidden = visible !== 0;
  };

  filter?.addEventListener('change', updateResults);
  if (query) {
    const searchInput = document.querySelector('#site-search');
    if (searchInput) searchInput.value = params.get('q');
    updateResults();
  }

  const searchForm = document.querySelector('.site-search-form');
  const searchInput = document.querySelector('#site-search');
  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (event) => {
      const value = searchInput.value.trim();
      if (!value) {
        event.preventDefault();
        searchInput.focus();
        return;
      }
      if (window.location.protocol !== 'file:') return;
      event.preventDefault();
      const url = new URL(searchForm.action, window.location.href);
      url.searchParams.set('q', value);
      url.searchParams.set('theme', document.documentElement.dataset.theme);
      window.location.href = url.href;
    });
  }

  for (const gallery of document.querySelectorAll('[data-gallery]')) {
    const images = JSON.parse(gallery.dataset.galleryItems);
    const image = gallery.querySelector('[data-gallery-image]');
    const counter = gallery.querySelector('[data-gallery-counter]');
    let active = 0;
    const show = (offset) => {
      active = (active + offset + images.length) % images.length;
      image.src = images[active].src;
      image.alt = images[active].alt;
      if (counter) counter.textContent = `${active + 1} de ${images.length}`;
    };
    gallery.querySelector('[data-gallery-prev]')?.addEventListener('click', () => show(-1));
    gallery.querySelector('[data-gallery-next]')?.addEventListener('click', () => show(1));
    gallery.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        show(-1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        show(1);
      }
    });
  }

  for (const button of document.querySelectorAll('[data-copy]')) {
    button.addEventListener('click', async () => {
      const status = button.parentElement.querySelector('.copy-status');
      try {
        const citation = button.parentElement.querySelector('#citation-text');
        if (citation && navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
          await navigator.clipboard.write([new ClipboardItem({
            'text/html': new Blob([citation.innerHTML], { type: 'text/html' }),
            'text/plain': new Blob([button.dataset.copy], { type: 'text/plain' })
          })]);
        } else {
          await navigator.clipboard.writeText(button.dataset.copy);
        }
        button.textContent = 'Cita copiada';
        button.classList.add('is-copied');
        if (status) {
          status.textContent = 'Cita copiada.';
          status.classList.add('is-visible');
        }
        window.setTimeout(() => {
          if (!button.isConnected) return;
          button.textContent = 'Copiar cita APA 7';
          button.classList.remove('is-copied');
          if (status) {
            status.textContent = '';
            status.classList.remove('is-visible');
          }
        }, 2200);
      } catch {
        const citation = button.parentElement.querySelector('#citation-text');
        const selection = window.getSelection();
        if (citation && selection) {
          const range = document.createRange();
          range.selectNodeContents(citation);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        if (status) {
          status.textContent = 'Selecciona la cita y cópiala.';
          status.classList.add('is-visible');
        }
      }
    });
  }
})();

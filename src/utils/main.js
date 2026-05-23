// Start MCU import in parallel — don't block module execution
const mcuPromise = import('https://esm.sh/@material/material-color-utilities@0.2.7');

// ===== DRAWER TOGGLE + TOC + THEME (all init in DOMContentLoaded) =====
document.addEventListener('DOMContentLoaded', async () => {
  // ===== DRAWER TOGGLE =====
  const menuToggle = document.getElementById('menu-toggle');
  const drawer = document.getElementById('drawer');
  const scrim = document.getElementById('scrim');

  localStorage.removeItem('navbar-autohide');
  const layoutPreferenceKeys = ['sidepanel-autohide'];

  function applyLayoutPreferences() {
    layoutPreferenceKeys.forEach(key => {
      document.documentElement.classList.toggle(key, localStorage.getItem(key) === 'true');
    });
  }

  applyLayoutPreferences();

  function updatePanelPeekState(e) {
    const sideEnabled = localStorage.getItem('sidepanel-autohide') === 'true';
    const desktopDrawer = window.matchMedia('(min-width: 1501px)').matches;
    const nearLeft = e.clientX <= 96;

    document.documentElement.classList.toggle('sidepanel-peek', sideEnabled && desktopDrawer && nearLeft);
  }

  document.addEventListener('mousemove', updatePanelPeekState, { passive: true });
  document.addEventListener('mouseleave', () => {
    document.documentElement.classList.remove('sidepanel-peek');
  });

  if (menuToggle && drawer) {
    menuToggle.addEventListener('click', () => {
      const willOpen = !drawer.classList.contains('open');
      drawer.classList.toggle('open');
      if (scrim) scrim.classList.toggle('open');
      menuToggle.setAttribute('aria-label', willOpen ? 'Close navigation menu' : 'Open navigation menu');
      menuToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      menuToggle.title = willOpen ? 'Close navigation menu' : 'Open navigation menu';
    });

    if (scrim) {
      scrim.addEventListener('click', () => {
        drawer.classList.remove('open');
        scrim.classList.remove('open');
        menuToggle.setAttribute('aria-label', 'Open navigation menu');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.title = 'Open navigation menu';
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        if (scrim) scrim.classList.remove('open');
        menuToggle.setAttribute('aria-label', 'Open navigation menu');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.title = 'Open navigation menu';
        menuToggle.focus();
      }
    });

    const obs = new MutationObserver(() => {
      if (drawer.classList.contains('open') && window.matchMedia('(max-width: 1500px)').matches) {
        const firstItem = drawer.querySelector('.nav-list .nav-item');
        if (firstItem) setTimeout(() => firstItem.focus(), 100);
      }
    });
    obs.observe(drawer, { attributes: true, attributeFilter: ['class'] });

    window.matchMedia('(max-width: 1500px)').addEventListener('change', (e) => {
      if (!e.matches) {
        drawer.classList.remove('open');
        if (scrim) scrim.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ===== MD3 LEGEND TOGGLE =====
  const legendTrigger = document.getElementById('legend-trigger');
  if (legendTrigger) {
    legendTrigger.addEventListener('click', () => {
      const expanded = legendTrigger.getAttribute('aria-expanded') === 'true';
      legendTrigger.setAttribute('aria-expanded', !expanded);
    });
  }

  // ===== TOC ACTIVE HEADING TRACKING =====
  function initTOC() {
    const tocLinks = document.querySelectorAll('.toc a');
    if (!tocLinks.length) return;
    const headings = [];
    tocLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const el = document.getElementById(href.substring(1));
        if (el) headings.push({ el, link });
      }
    });

    const observer = new IntersectionObserver((entries) => {
      const intersecting = entries.filter(e => e.isIntersecting);
      if (intersecting.length > 0) {
        // If multiple headings are intersecting our threshold zone, 
        // the one furthest down the page is the "current" one.
        const target = intersecting.reduce((prev, curr) => 
          curr.boundingClientRect.top > prev.boundingClientRect.top ? curr : prev
        );
        
        tocLinks.forEach(l => l.classList.remove('active'));
        const id = target.target.id;
        const activeLink = document.querySelector(`.toc a[href="#${id}"]`);
        if (activeLink) activeLink.classList.add('active');
      }
    }, { rootMargin: '-70px 0px -88% 0px' });

    headings.forEach(h => observer.observe(h.el));
  }
  
  initTOC();
  
  function setupSwupHooks() {
    window.swup.hooks.on('page:view', initTOC);
    window.swup.hooks.on('visit:start', (visit) => {
      const el = visit.trigger.el;
      if (el && el.classList.contains('nav-item')) {
        document.querySelectorAll('.nav-list .nav-item').forEach(n => n.classList.remove('selected'));
        el.classList.add('selected');
      }
    });
  }

  if (window.swup) {
    setupSwupHooks();
  } else {
    window.addEventListener('swup:init', setupSwupHooks);
  }

  // ===== HOMEPAGE STATE =====
  function updateHomeState() {
    document.body.classList.toggle('is-home', document.querySelector('.vp-hero') !== null);
  }

  updateHomeState();
  if (window.swup) {
    window.swup.hooks.on('page:view', updateHomeState);
  } else {
    window.addEventListener('swup:init', () => {
      window.swup.hooks.on('page:view', updateHomeState);
    });
  }

  // ===== THEME SYSTEM =====
  // Wait for MCU module
  const mcu = await mcuPromise;
  const { argbFromHex, Hct, hexFromArgb, MaterialDynamicColors, SchemeContent } = mcu;

  const colorMap = [
    'background', 'on-background', 'surface', 'surface-dim', 'surface-bright',
    'surface-container-lowest', 'surface-container-low', 'surface-container',
    'surface-container-high', 'surface-container-highest', 'on-surface',
    'surface-variant', 'on-surface-variant', 'inverse-surface', 'inverse-on-surface',
    'outline', 'outline-variant', 'shadow', 'scrim', 'surface-tint',
    'primary', 'on-primary', 'primary-container', 'on-primary-container', 'inverse-primary',
    'secondary', 'on-secondary', 'secondary-container', 'on-secondary-container',
    'tertiary', 'on-tertiary', 'tertiary-container', 'on-tertiary-container',
    'error', 'on-error', 'error-container', 'on-error-container',
  ];

  let themeSheet = null;
  let themeStyleTag = null;

  function getOrCreateSheet() {
    if (globalThis['material-theme'] instanceof CSSStyleSheet) {
      themeSheet = globalThis['material-theme'];
      return themeSheet;
    }
    if (themeSheet) return themeSheet;
    try {
      themeSheet = new CSSStyleSheet();
      globalThis['material-theme'] = themeSheet;
      document.adoptedStyleSheets.push(themeSheet);
      return themeSheet;
    } catch (e) {
      if (!themeStyleTag) {
        themeStyleTag = document.getElementById('material-theme-fallback');
        if (!themeStyleTag) {
          themeStyleTag = document.createElement('style');
          themeStyleTag.id = 'material-theme-fallback';
          document.head.appendChild(themeStyleTag);
        }
      }
      return null;
    }
  }

  function applyThemeString(themeString) {
    const sheet = getOrCreateSheet();
    if (sheet) {
      const sc = themeString.match(/--md-sys-color-surface-container:(.+?);/)?.[1];
      if (sc) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', sc);
      sheet.replaceSync(themeString);
    } else if (themeStyleTag) {
      themeStyleTag.textContent = themeString;
    }
    localStorage.setItem('material-theme', themeString);
  }

  function themeFromSourceColor(hex, isDark) {
    const scheme = new SchemeContent(Hct.fromInt(argbFromHex(hex)), isDark, 0);
    const camelMap = {};
    for (const key of colorMap) {
      camelMap[key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = key;
    }
    let css = ':root,:host{';
    for (const [camel, key] of Object.entries(camelMap)) {
      const fn = MaterialDynamicColors[camel];
      if (fn) css += `--md-sys-color-${key}:${hexFromArgb(fn.getArgb(scheme))};`;
    }
    return css + '}';
  }

  function hexStr(h, c, t) { return hexFromArgb(Hct.from(h, c, t).toInt()); }

  // localStorage helpers
  const ls = (k) => localStorage.getItem(k);
  const lss = (k, v) => localStorage.setItem(k, v);

  function isDark(mode, save = true) {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    const d = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (save) lss('last-auto-color-mode', d ? 'dark' : 'light');
    return d;
  }

  function apply(color, modeDark, customBg = null, customSurface = null) {
    let css = themeFromSourceColor(color, modeDark);
    if (customBg && customSurface) {
      css = css.replace('}', 
        `;--md-sys-color-surface:${customBg}` +
        `;--md-sys-color-surface-container:${customSurface}` +
        `;--md-sys-color-surface-container-low:${customSurface}` +
        `;--md-sys-color-surface-container-high:${customSurface}` +
        `;--md-sys-color-surface-container-highest:${customSurface}` +
        `;--md-sys-color-background:${customBg}}`
      );
    }
    applyThemeString(css);
    document.documentElement.classList.toggle('dark', modeDark);
    window.dispatchEvent(new Event('theme-changed'));
  }

  function changeColor(color) {
    const m = ls('color-mode') || 'auto';
    localStorage.removeItem('custom-bg');
    localStorage.removeItem('custom-surface');
    apply(color, isDark(m));
    lss('seed-color', color);
  }

  function changeMode(mode) {
    const c = ls('seed-color');
    if (!c) return;
    apply(c, isDark(mode), ls('custom-bg'), ls('custom-surface'));
    lss('color-mode', mode);
  }

  function changeBoth(color, mode, customBg = null, customSurface = null) {
    apply(color, isDark(mode), customBg, customSurface);
    lss('seed-color', color);
    lss('color-mode', mode);
    if (customBg && customSurface) {
      lss('custom-bg', customBg);
      lss('custom-surface', customSurface);
    } else {
      localStorage.removeItem('custom-bg');
      localStorage.removeItem('custom-surface');
    }
  }

  // Body event listeners
  document.body.addEventListener('change-color', (e) => { changeColor(e.color); });
  document.body.addEventListener('change-mode', (e) => { changeMode(e.mode); });

  // System color scheme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (ls('color-mode') !== 'auto') return;
    changeColor(ls('seed-color') || '#ECAA2E');
  });

  // Initialize theme
  if (!ls('material-theme')) {
    changeBoth('#ECAA2E', 'auto');
  } else {
    apply(ls('seed-color') || '#ECAA2E', isDark(ls('color-mode') || 'auto'), ls('custom-bg'), ls('custom-surface'));
  }
  // Auto mode page-nav edge case
  if (ls('color-mode') === 'auto') {
    const actual = isDark('auto', false) ? 'dark' : 'light';
    if (actual !== ls('last-auto-color-mode')) changeMode('auto');
  }

  // ===== THEME PICKER STATE VARIABLES =====
  const savedHex = ls('seed-color') || '#ECAA2E';
  const hct = Hct.fromInt(argbFromHex(savedHex));
  let hue = Math.round(hct.hue);
  let chroma = Math.round(hct.chroma);
  let tone = Math.round(hct.tone);
  let currentHex = savedHex;
  let customBg = ls('custom-bg') || '';
  let customSurface = ls('custom-surface') || '';

  const fontsMap = {
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif',
    outfit: '"Outfit", sans-serif',
    inter: '"Inter", sans-serif',
    montserrat: '"Montserrat", sans-serif',
    lora: '"Lora", Georgia, serif',
    jetbrains: '"JetBrains Mono", monospace'
  };

  // Initial Boot-time Typography application (prevents reload visual flash!)
  const savedFont = ls('site-font-family') || 'system';
  const savedScale = parseFloat(ls('site-font-scale')) || 100;
  document.documentElement.style.setProperty('--site-font-family', fontsMap[savedFont] || fontsMap.system);
  document.documentElement.style.setProperty('--site-font-scale', savedScale / 100);

  let loadedPresetsData = null; // Persisted loaded preset data so we fetch only once!

  function initAppearancePanel() {
    const themeButton = document.getElementById('theme-button');
    const tocRail = document.getElementById('toc-rail');
    const tocContentWrapper = document.getElementById('toc-content-wrapper');
    const settingsContentWrapper = document.getElementById('settings-content-wrapper');
    const settingsCloseBtn = document.getElementById('settings-close-btn');

    if (!themeButton) return;

    // --- Dynamic Multi-Page Navigation Logic ---
    const pageHome = document.getElementById('settings-page-home');
    const pageTheme = document.getElementById('settings-page-theme');
    const pageTypography = document.getElementById('settings-page-typography');
    const pageSite = document.getElementById('settings-page-site');
    
    const backBtn = document.getElementById('settings-back-btn');
    const headerTitle = document.getElementById('settings-drawer-title');
    const headerIcon = document.getElementById('settings-header-icon');
    
    const menuItemTheme = document.getElementById('menu-item-theme');
    const menuItemTypography = document.getElementById('menu-item-typography');
    const menuItemSite = document.getElementById('menu-item-site');

    function showSettingsPage(pageId) {
      if (pageHome) pageHome.style.display = 'none';
      if (pageTheme) pageTheme.style.display = 'none';
      if (pageTypography) pageTypography.style.display = 'none';
      if (pageSite) pageSite.style.display = 'none';
      
      if (pageId === 'home') {
        if (pageHome) pageHome.style.display = 'flex';
        if (backBtn) backBtn.style.display = 'none';
        if (headerTitle) headerTitle.textContent = 'Appearance';
        if (headerIcon) {
          headerIcon.style.display = 'block';
          headerIcon.textContent = 'settings';
        }
      } else if (pageId === 'theme') {
        if (pageTheme) pageTheme.style.display = 'block';
        if (backBtn) backBtn.style.display = 'block';
        if (headerTitle) headerTitle.textContent = 'Theme & Color';
        if (headerIcon) {
          headerIcon.style.display = 'block';
          headerIcon.textContent = 'palette';
        }
      } else if (pageId === 'typography') {
        if (pageTypography) pageTypography.style.display = 'block';
        if (backBtn) backBtn.style.display = 'block';
        if (headerTitle) headerTitle.textContent = 'Typography';
        if (headerIcon) {
          headerIcon.style.display = 'block';
          headerIcon.textContent = 'text_fields';
        }
      } else if (pageId === 'site') {
        if (pageSite) pageSite.style.display = 'block';
        if (backBtn) backBtn.style.display = 'block';
        if (headerTitle) headerTitle.textContent = 'Site Setting';
        if (headerIcon) {
          headerIcon.style.display = 'block';
          headerIcon.textContent = 'tune';
        }
      }
    }

    if (menuItemTheme) {
      menuItemTheme.onclick = (e) => {
        e.stopPropagation();
        showSettingsPage('theme');
      };
    }

    if (menuItemTypography) {
      menuItemTypography.onclick = (e) => {
        e.stopPropagation();
        showSettingsPage('typography');
      };
    }

    if (menuItemSite) {
      menuItemSite.onclick = (e) => {
        e.stopPropagation();
        showSettingsPage('site');
      };
    }

    if (menuItemSite) {
      menuItemSite.onclick = (e) => {
        e.stopPropagation();
        showSettingsPage('site');
      };
    }

    if (backBtn) {
      backBtn.onclick = (e) => {
        e.stopPropagation();
        const isMobile = window.matchMedia('(max-width: 1024px)').matches;
        if (isMobile && tocRail && tocRail.classList.contains('settings-open') && pageHome && pageHome.style.display !== 'none') {
          tocRail.classList.remove('settings-open');
          lss('appearance-settings-open', 'false');
        } else {
          showSettingsPage('home');
        }
      };
    }

    themeButton.onclick = (e) => {
      e.stopPropagation();
      const isSettingsOpen = settingsContentWrapper && settingsContentWrapper.style.display !== 'none';
      if (isSettingsOpen) {
        closeSettingsPanel();
      } else {
        openSettingsPanel();
      }
    };

    if (settingsCloseBtn) {
      settingsCloseBtn.onclick = (e) => {
        e.stopPropagation();
        closeSettingsPanel();
      };
    }

    function openSettingsPanel() {
      if (tocRail) {
        tocRail.classList.remove('toc-rail-hidden');
        tocRail.classList.add('settings-active');
      }
      applyLayoutPreferences();
      if (tocContentWrapper) tocContentWrapper.style.display = 'none';
      if (settingsContentWrapper) settingsContentWrapper.style.display = 'block';
      lss('appearance-settings-open', 'true');
      
      themeButton.setAttribute('aria-expanded', 'true');
      showSettingsPage('home'); // Always reset to settings home on open!
    }

    function closeSettingsPanel() {
      if (settingsContentWrapper) settingsContentWrapper.style.display = 'none';
      
      const hasToc = tocContentWrapper && tocContentWrapper.dataset.hasToc === 'true';
      if (hasToc) {
        if (tocContentWrapper) tocContentWrapper.style.display = 'block';
        if (tocRail) {
          tocRail.classList.remove('toc-rail-hidden');
          tocRail.classList.remove('settings-active');
        }
      } else {
        if (tocContentWrapper) tocContentWrapper.style.display = 'none';
        if (tocRail) {
          tocRail.classList.add('toc-rail-hidden');
          tocRail.classList.remove('settings-active');
        }
      }
      applyLayoutPreferences();
      lss('appearance-settings-open', 'false');
      
      themeButton.setAttribute('aria-expanded', 'false');
    }

    // Keep open on page swap if previously opened
    const wasOpen = ls('appearance-settings-open') === 'true';
    if (wasOpen) {
      if (tocRail) {
        tocRail.classList.remove('toc-rail-hidden');
        tocRail.classList.add('settings-active');
      }
      applyLayoutPreferences();
      if (tocContentWrapper) tocContentWrapper.style.display = 'none';
      if (settingsContentWrapper) settingsContentWrapper.style.display = 'block';
      themeButton.setAttribute('aria-expanded', 'true');
      showSettingsPage('home');
    } else {
      closeSettingsPanel();
    }

    // --- HCT Gradient Generators ---
    const hgEl = document.getElementById('hue-gradient');
    const cgEl = document.getElementById('chroma-gradient');
    const tgEl = document.getElementById('tone-gradient');

    function gradHue() {
      let g = 'linear-gradient(to right';
      for (let i = 0; i <= 100; i++) g += `,${hexStr(360*i/100, 100, 50)} ${i}%`;
      return g + ')';
    }
    function gradChroma() {
      let g = 'linear-gradient(to right';
      for (let i = 0; i <= 100; i++) g += `,${hexStr(hue, 150*i/100, 50)} ${i}%`;
      return g + ')';
    }
    function gradTone() {
      let g = 'linear-gradient(to right';
      for (let i = 0; i <= 100; i++) g += `,${hexStr(0, 0, 100*i/100)} ${i}%`;
      return g + ')';
    }

    if (hgEl) hgEl.style.background = gradHue();
    if (cgEl) cgEl.style.background = gradChroma();
    if (tgEl) tgEl.style.background = gradTone();

    const colorInput = document.getElementById('color-input');
    const colorHexLabel = document.getElementById('color-hex-label');
    
    if (colorHexLabel) colorHexLabel.textContent = currentHex.toUpperCase();
    if (colorInput) {
      colorInput.value = currentHex;
      colorInput.oninput = () => {
        currentHex = colorInput.value;
        if (colorHexLabel) colorHexLabel.textContent = currentHex.toUpperCase();
        const h = Hct.fromInt(argbFromHex(currentHex));
        hue = Math.round(h.hue);
        chroma = Math.round(h.chroma);
        tone = Math.round(h.tone);
        if (hs) hs.value = hue;
        if (cs) cs.value = chroma;
        if (ts) ts.value = tone;
        if (cgEl) cgEl.style.background = gradChroma();
        changeColor(currentHex);
        updatePresetSelection(currentHex);
      };
    }

    const hs = document.getElementById('hue-slider');
    const cs = document.getElementById('chroma-slider');
    const ts = document.getElementById('tone-slider');

    if (hs) hs.value = hue;
    if (cs) cs.value = chroma;
    if (ts) ts.value = tone;

    function setThemeModesVisible(visible) {
      const modeContainer = document.getElementById('color-mode-container');
      if (!modeContainer) return;
      if (visible) {
        modeContainer.style.display = 'block';
      } else {
        modeContainer.style.display = 'none';
      }
    }

    function onSlider() {
      hue = hs ? parseFloat(hs.value) || 0 : 0;
      chroma = cs ? parseFloat(cs.value) || 0 : 0;
      tone = ts ? parseFloat(ts.value) || 0 : 0;
      currentHex = hexStr(hue, chroma, tone);
      if (colorInput) colorInput.value = currentHex;
      if (colorHexLabel) colorHexLabel.textContent = currentHex.toUpperCase();
      if (cgEl) cgEl.style.background = gradChroma();
      changeColor(currentHex);
      
      // Clear preset selection highlights
      document.querySelectorAll('#theme-presets-grid md-filter-chip').forEach(c => c.selected = false);
      const variantsWrapper = document.getElementById('theme-variants-wrapper');
      if (variantsWrapper) variantsWrapper.style.display = 'none';
      
      customBg = '';
      customSurface = '';
      lss('custom-bg', '');
      lss('custom-surface', '');

      setThemeModesVisible(true); // Custom settings, re-enable!
    }

    if (hs) hs.oninput = onSlider;
    if (cs) cs.oninput = onSlider;
    if (ts) ts.oninput = onSlider;

    // Copy theme hex button
    const copyThemeBtn = document.getElementById('copy-theme-btn');
    if (copyThemeBtn) {
      copyThemeBtn.onclick = async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(currentHex);
          const oldIcon = copyThemeBtn.innerHTML;
          copyThemeBtn.innerHTML = '<md-icon style="font-size: 18px;">check</md-icon>';
          setTimeout(() => { copyThemeBtn.innerHTML = oldIcon; }, 1500);
        } catch(err) {
          console.error('Failed to copy hex:', err);
        }
      };
    }

    // Segmented button color modes
    const segSet = document.getElementById('color-mode-set');
    if (segSet) {
      const mode = ls('color-mode') || 'auto';
      const btns = segSet.querySelectorAll('.segmented-button');
      btns.forEach(b => {
        if (b.dataset.value === mode) b.classList.add('selected');
        else b.classList.remove('selected');

        b.onclick = (e) => {
          e.stopPropagation();
          btns.forEach(x => x.classList.remove('selected'));
          b.classList.add('selected');
          changeMode(b.dataset.value);
        };
      });
    }

    // ===== THEME PRESETS ACCORDION & CAPSULES =====
    const accordionTrigger = document.getElementById('presets-accordion-trigger');
    const accordionContent = document.getElementById('presets-accordion-content');
    const presetsGrid = document.getElementById('theme-presets-grid');
    const variantsWrapper = document.getElementById('theme-variants-wrapper');
    const variantsGrid = document.getElementById('theme-variants-grid');

    if (accordionTrigger && accordionContent) {
      accordionTrigger.onclick = (e) => {
        e.stopPropagation();
        const isExpanded = accordionTrigger.classList.toggle('expanded');
        accordionContent.classList.toggle('expanded');
        if (isExpanded) {
          accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
        } else {
          accordionContent.style.maxHeight = '0';
        }
      };
    }

    function updateAccordionHeight() {
      if (accordionTrigger && accordionTrigger.classList.contains('expanded') && accordionContent) {
        setTimeout(() => {
          accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
        }, 50);
      }
    }

    function applyVariant(variant) {
      const presetColor = variant.color;
      const presetMode = variant.mode;

      currentHex = presetColor;
      if (colorInput) colorInput.value = currentHex;
      if (colorHexLabel) colorHexLabel.textContent = currentHex.toUpperCase();

      const h = Hct.fromInt(argbFromHex(presetColor));
      hue = Math.round(h.hue);
      chroma = Math.round(h.chroma);
      tone = Math.round(h.tone);

      if (hs) hs.value = hue;
      if (cs) cs.value = chroma;
      if (ts) ts.value = tone;

      if (cgEl) cgEl.style.background = gradChroma();

      changeBoth(presetColor, presetMode, variant.background, variant.surface);

      const segButtons = document.querySelectorAll('.segmented-button');
      segButtons.forEach(b => {
        if (b.dataset.value === presetMode) {
          b.classList.add('selected');
        } else {
          b.classList.remove('selected');
        }
      });
    }

    function renderVariants(theme, activeVar) {
      if (!variantsGrid) return;
      variantsGrid.innerHTML = '';

      theme.variants.forEach(variant => {
        const chip = document.createElement('md-filter-chip');
        if (variant.name === activeVar.name) {
          chip.selected = true;
        }
        chip.style.setProperty('--preset-color', variant.color);
        chip.label = variant.name;

        chip.onclick = (e) => {
          e.stopPropagation();
          variantsGrid.querySelectorAll('md-filter-chip').forEach(c => c.selected = false);
          chip.selected = true;
          applyVariant(variant);
        };

        variantsGrid.appendChild(chip);
      });
    }

    function updatePresetSelection(hex) {
      if (!loadedPresetsData) return;

      let matchedMain = null;
      let matchedVariant = null;

      loadedPresetsData.themes.forEach(theme => {
        theme.variants.forEach(variant => {
          if (variant.color.toLowerCase() === hex.toLowerCase()) {
            matchedMain = theme;
            matchedVariant = variant;
          }
        });
      });

      document.querySelectorAll('#theme-presets-grid md-filter-chip').forEach(c => c.selected = false);

      if (matchedMain) {
        const btn = document.getElementById(`preset-${matchedMain.id}`);
        if (btn) btn.selected = true;

        if (matchedMain.variants.length === 1) {
          if (variantsWrapper) variantsWrapper.style.display = 'none';
        } else {
          if (variantsWrapper) variantsWrapper.style.display = 'block';
          renderVariants(matchedMain, matchedVariant);
        }
        setThemeModesVisible(false); // Preset active, hide!
      } else {
        if (variantsWrapper) variantsWrapper.style.display = 'none';
        setThemeModesVisible(true); // No preset active, show!
      }
      updateAccordionHeight();
    }

    async function loadPresets() {
      try {
        if (!loadedPresetsData) {
          const response = await fetch('/css/themepresets.json');
          loadedPresetsData = await response.json();
        }
        if (presetsGrid && loadedPresetsData && loadedPresetsData.themes) {
          presetsGrid.innerHTML = '';
          loadedPresetsData.themes.forEach(theme => {
            const btn = document.createElement('md-filter-chip');
            btn.id = `preset-${theme.id}`;
            btn.style.setProperty('--preset-color', theme.color);
            btn.label = theme.name;
            presetsGrid.appendChild(btn);

            btn.onclick = (e) => {
              e.stopPropagation();
              document.querySelectorAll('#theme-presets-grid md-filter-chip').forEach(c => c.selected = false);
              btn.selected = true;

              if (theme.variants.length === 1) {
                if (variantsWrapper) variantsWrapper.style.display = 'none';
                applyVariant(theme.variants[0]);
              } else {
                if (variantsWrapper) variantsWrapper.style.display = 'block';
                renderVariants(theme, theme.variants[0]);
                applyVariant(theme.variants[0]);
              }
              updateAccordionHeight();
            };
          });

          updatePresetSelection(currentHex);
        }
      } catch(err) {
        console.error('Failed to load presets:', err);
      }
    }

    loadPresets();

    // --- Typography & Scaling ---
    const fontChips = document.querySelectorAll('.font-chip');
    const fontSizeSlider = document.getElementById('font-size-slider');
    const fontSizeVal = document.getElementById('font-size-val');

    const currFont = ls('site-font-family') || 'system';
    const currScale = parseFloat(ls('site-font-scale')) || 100;

    fontChips.forEach(chip => {
      const fontKey = chip.dataset.font;
      if (fontKey === currFont) {
        chip.selected = true;
      } else {
        chip.selected = false;
      }

      chip.onclick = (e) => {
        e.stopPropagation();
        fontChips.forEach(c => c.selected = false);
        chip.selected = true;
        applyFontFamily(fontKey);
      };
    });

    if (fontSizeSlider) {
      fontSizeSlider.value = currScale;
      if (fontSizeVal) fontSizeVal.textContent = Math.round(currScale) + '%';

      fontSizeSlider.oninput = () => {
        const scaleVal = parseFloat(fontSizeSlider.value) || 100;
        if (fontSizeVal) fontSizeVal.textContent = Math.round(scaleVal) + '%';
        applyFontScale(scaleVal);
      };
    }

    function applyFontFamily(fontKey) {
      const fontFamily = fontsMap[fontKey] || fontsMap.system;
      document.documentElement.style.setProperty('--site-font-family', fontFamily);
      lss('site-font-family', fontKey);
    }

    function applyFontScale(scaleVal) {
      const decimalScale = scaleVal / 100;
      document.documentElement.style.setProperty('--site-font-scale', decimalScale);
      lss('site-font-scale', scaleVal);
    }

    // --- Starred toggle (show only labeled items) ---
    const starredToggle = document.getElementById('starred-toggle');
    const RAW_EMOJI_MARKERS = ['🔗', '🌐'];

    function applyStarredFilter(enable) {
      const items = document.querySelectorAll('#swup-content li');
      items.forEach(li => {
        const hasIcon = li.querySelector('.md-emoji-icon') !== null;
        const text = li.textContent || '';
        const hasRawEmoji = RAW_EMOJI_MARKERS.some(e => text.includes(e));
        if (enable && !hasIcon && !hasRawEmoji) {
          li.style.display = 'none';
        } else {
          li.style.display = '';
        }
      });
      lss('starred-filter', enable ? 'true' : '');
    }

    if (starredToggle) {
      const saved = ls('starred-filter') === 'true';
      starredToggle.selected = saved;
      applyStarredFilter(saved);
      starredToggle.addEventListener('change', () => {
        applyStarredFilter(starredToggle.selected);
      });
    }

    const layoutToggles = [
      ['sidepanel-autohide-toggle', 'sidepanel-autohide'],
    ];

    layoutToggles.forEach(([toggleId, storageKey]) => {
      const toggle = document.getElementById(toggleId);
      if (!toggle) return;
      toggle.selected = ls(storageKey) === 'true';
      toggle.addEventListener('change', () => {
        lss(storageKey, toggle.selected ? 'true' : 'false');
        applyLayoutPreferences();
      });
    });
  }

  // ===== MOBILE CONTROL PANEL =====
  function initMobileControlPanel() {
    const mobileTocBtn = document.getElementById('mobile-toc-btn');
    const mobileTocClose = document.getElementById('mobile-toc-close');
    const mobileOpenSettings = document.getElementById('mobile-open-settings');
    const tocRail = document.getElementById('toc-rail');
    const settingsCloseBtn = document.getElementById('settings-close-btn');
    if (mobileTocBtn && tocRail) {
      mobileTocBtn.onclick = (e) => {
        e.stopPropagation();
        const hidden = tocRail.classList.contains('toc-rail-hidden');
        tocRail.style.overflowY = 'hidden';
        if (hidden) {
          tocRail.classList.remove('toc-rail-hidden');
          tocRail.classList.add('settings-active');
          tocRail.classList.remove('settings-open');
          mobileTocBtn.setAttribute('aria-label', 'Hide Table of Contents');
          var tocContent = document.getElementById('toc-content-wrapper');
          var settingsContent = document.getElementById('settings-content-wrapper');
          if (tocContent) tocContent.style.display = 'block';
          if (settingsContent) settingsContent.style.display = 'none';
        } else {
          tocRail.classList.remove('settings-active');
          tocRail.classList.remove('settings-open');
          tocRail.classList.add('toc-rail-hidden');
          mobileTocBtn.setAttribute('aria-label', 'Show Table of Contents');
        }
        setTimeout(function() {
          tocRail.style.overflowY = '';
        }, 350);
      };
    }

    if (mobileTocClose && tocRail) {
      mobileTocClose.onclick = (e) => {
        e.stopPropagation();
        tocRail.classList.remove('settings-active');
        tocRail.classList.remove('settings-open');
        tocRail.style.display = 'none';
      };
    }

    if (mobileOpenSettings && tocRail) {
      mobileOpenSettings.onclick = (e) => {
        e.stopPropagation();
        tocRail.classList.add('settings-active');
        tocRail.classList.add('settings-open');
        
        const settingsContent = document.getElementById('settings-content-wrapper');
        const tocContent = document.getElementById('toc-content-wrapper');
        if (settingsContent) settingsContent.style.display = 'block';
        if (tocContent) tocContent.style.display = 'none';
        
        lss('appearance-settings-open', 'true');
        
        // Show home settings page
        const pageHome = document.getElementById('settings-page-home');
        const backBtn = document.getElementById('settings-back-btn');
        const headerTitle = document.getElementById('settings-drawer-title');
        if (pageHome) pageHome.style.display = 'flex';
        if (backBtn) backBtn.style.display = 'block';
        if (headerTitle) headerTitle.textContent = 'Appearance';
      };
    }

    if (settingsCloseBtn && tocRail) {
      const originalSettingsClose = settingsCloseBtn.onclick;
      settingsCloseBtn.onclick = (e) => {
        const isMobile = window.matchMedia('(max-width: 1024px)').matches;
        if (isMobile) {
          e.stopPropagation();
          tocRail.classList.remove('settings-active');
          tocRail.classList.remove('settings-open');
          tocRail.style.display = 'none';
          lss('appearance-settings-open', 'false');
        } else if (originalSettingsClose) {
          originalSettingsClose(e);
        }
      };
    }
  }

  // --- Initial Bind ---
  initAppearancePanel();
  initMobileControlPanel();

  // --- Swup Re-initialization Hook ---
  if (window.swup) {
    window.swup.hooks.on('page:view', () => {
      initAppearancePanel();
      applyLayoutPreferences();
      initMobileControlPanel();
    });
  }

  // ===== FUZZY SEARCH (MINISEARCH) =====
  let miniSearch = null;
  let searchDocs = [];
  let isSearchInitialized = false;

  const searchBtn = document.getElementById('search-btn');
  const searchModal = document.getElementById('search-modal');
  const searchModalBackdrop = document.getElementById('search-modal-backdrop');
  const searchInput = document.getElementById('search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const searchResultsList = document.getElementById('search-results-list');
  const searchNoResults = document.getElementById('search-no-results');

  // Toggle modal state
  function openSearch() {
    if (!searchModal) return;
    searchModal.classList.add('open');
    searchModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // prevent page scrolling
    setTimeout(() => searchInput?.focus(), 100);
    initializeSearch();
  }

  function closeSearch() {
    if (!searchModal) return;
    searchModal.classList.remove('open');
    searchModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; // restore scrolling
    if (searchInput) searchInput.value = '';
    if (searchClearBtn) searchClearBtn.style.display = 'none';
    renderResults([]);
  }

  // Load minisearch & fetch index
  async function initializeSearch() {
    if (isSearchInitialized) return;
    try {
      const [MiniSearchModule, response] = await Promise.all([
        import('https://esm.sh/minisearch@7.2.0'),
        fetch('/search-index.json')
      ]);
      const MiniSearch = MiniSearchModule.default;
      const data = await response.json();
      searchDocs = data.docs || [];

      miniSearch = new MiniSearch({
        fields: ['title', 'excerpt'], // fields to index for searching
        storeFields: ['title', 'url', 'excerpt'], // fields to return with search results
        searchOptions: {
          fuzzy: 0.2,
          prefix: true
        }
      });

      miniSearch.addAll(searchDocs);
      isSearchInitialized = true;
    } catch (e) {
      console.error('Search initialization failed:', e);
    }
  }

  // Handle Search input
  function handleSearchInput() {
    const query = searchInput.value.trim();
    if (!query) {
      if (searchClearBtn) searchClearBtn.style.display = 'none';
      renderResults([]);
      return;
    }

    if (searchClearBtn) searchClearBtn.style.display = 'block';

    if (!miniSearch) return;
    const results = miniSearch.search(query);
    renderResults(results.slice(0, 10), query);
  }

  function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  // Render search results
  let activeIndex = -1;
  function renderResults(results, query = '') {
    if (!searchResultsList || !searchNoResults) return;
    searchResultsList.innerHTML = '';
    activeIndex = -1;

    if (results.length === 0) {
      searchNoResults.style.display = 'block';
      searchNoResults.textContent = searchInput.value.trim() ? 'No results found' : 'No recent searches';
      return;
    }

    searchNoResults.style.display = 'none';
    results.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'search-result-item';
      li.innerHTML = `
        <a href="${item.url}" class="search-result-link">
          <div class="search-result-title">${highlightText(item.title, query)}</div>
          <div class="search-result-excerpt">${highlightText(item.excerpt || '', query)}</div>
        </a>
      `;
      // Close modal on link click (handled by swup page change or direct click)
      li.querySelector('a').addEventListener('click', closeSearch);
      searchResultsList.appendChild(li);
    });
  }

  // Listeners
  searchBtn?.addEventListener('click', openSearch);
  searchModalBackdrop?.addEventListener('click', closeSearch);
  searchClearBtn?.addEventListener('click', () => {
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
    if (searchClearBtn) searchClearBtn.style.display = 'none';
    renderResults([]);
  });

  searchInput?.addEventListener('input', handleSearchInput);

  // Shortcuts & Navigation inside modal
  document.addEventListener('keydown', (e) => {
    // Open Ctrl+K
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openSearch();
    }
    // Close ESC
    if (e.key === 'Escape' && searchModal?.classList.contains('open')) {
      e.preventDefault();
      closeSearch();
    }
    // Arrow Navigation
    if (searchModal?.classList.contains('open')) {
      const items = searchResultsList?.querySelectorAll('.search-result-item');
      if (items && items.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          activeIndex = (activeIndex + 1) % items.length;
          updateActiveItem(items);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          activeIndex = (activeIndex - 1 + items.length) % items.length;
          updateActiveItem(items);
        } else if (e.key === 'Enter' && activeIndex >= 0) {
          e.preventDefault();
          const link = items[activeIndex].querySelector('a');
          if (link) {
            link.click();
            // Trigger swup transition manually if direct click isn't captured immediately
            if (window.swup) window.swup.navigate(link.getAttribute('href'));
          }
        }
      }
    }
  });

  function updateActiveItem(items) {
    items.forEach((item, index) => {
      if (index === activeIndex) {
        item.classList.add('active');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('active');
      }
    });
  }

  // ===== TOOLTIP SYSTEM =====
  const tooltipPopup = document.createElement('div');
  tooltipPopup.className = 'custom-tooltip-popup';
  document.body.appendChild(tooltipPopup);

  let tooltipTimeout;
  let activeTrigger = null;

  function showTooltip(trigger) {
    if (activeTrigger === trigger) return;
    activeTrigger = trigger;
    const noteId = trigger.getAttribute('data-note-id');
    if (!noteId) return;

    // Load registry
    const registryScript = document.getElementById('notes-registry');
    if (!registryScript) return;
    try {
      const registry = JSON.parse(registryScript.textContent);
      const content = registry[noteId];
      if (!content) return;

      tooltipPopup.innerHTML = `<div class="tooltip-content">${content}</div>`;
      
      // Position the tooltip
      const rect = trigger.getBoundingClientRect();
      tooltipPopup.style.display = 'block';
      // calculate after display: block to get real dimensions
      const popupRect = tooltipPopup.getBoundingClientRect();
      
      let top = rect.top - popupRect.height - 10;
      if (top < 10) {
        // flip to bottom if no space on top
        top = rect.bottom + 10;
      }
      let left = rect.left + (rect.width / 2) - (popupRect.width / 2);
      if (left < 10) left = 10; // Left boundary constraint
      if (left + popupRect.width > window.innerWidth - 10) left = window.innerWidth - popupRect.width - 10; // Right boundary constraint

      tooltipPopup.style.top = `${top + window.scrollY}px`;
      tooltipPopup.style.left = `${left + window.scrollX}px`;
      
      // Trigger animation
      setTimeout(() => {
        tooltipPopup.classList.add('show');
      }, 10);
    } catch (e) {
      console.error('Error parsing notes registry:', e);
    }
  }

  function hideTooltip() {
    activeTrigger = null;
    tooltipPopup.classList.remove('show');
    setTimeout(() => {
      if (!activeTrigger) tooltipPopup.style.display = 'none';
    }, 250); // match CSS transition time
  }

  function setupTooltips() {
    const triggers = document.querySelectorAll('.tooltip-trigger');
    triggers.forEach(trigger => {
      trigger.addEventListener('mouseenter', () => {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = setTimeout(() => showTooltip(trigger), 150);
      });
      trigger.addEventListener('mouseleave', () => {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = setTimeout(() => hideTooltip(), 150);
      });
      trigger.addEventListener('focus', () => showTooltip(trigger));
      trigger.addEventListener('blur', () => hideTooltip());
    });
  }

  tooltipPopup.addEventListener('mouseenter', () => {
    clearTimeout(tooltipTimeout);
  });
  tooltipPopup.addEventListener('mouseleave', () => {
    clearTimeout(tooltipTimeout);
    tooltipTimeout = setTimeout(() => hideTooltip(), 150);
  });

  setupTooltips();

  // Swup hook for tooltips
  if (window.swup) {
    window.swup.hooks.on('page:view', setupTooltips);
  } else {
    window.addEventListener('swup:init', () => {
      window.swup.hooks.on('page:view', setupTooltips);
    });
  }
});

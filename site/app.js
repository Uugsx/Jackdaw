// Jackdaw Mail Landing — Client Interactions

(function () {
  'use strict';

  // 1. Theme Management
  const themeToggle = document.getElementById('theme-toggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  function getSavedTheme() {
    return localStorage.getItem('jackdaw-theme') || (prefersDark.matches ? 'dark' : 'light');
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('jackdaw-theme', theme);
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему');
      themeToggle.innerHTML = theme === 'dark'
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    }
  }

  const initialTheme = getSavedTheme();
  applyTheme(initialTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  prefersDark.addEventListener('change', (e) => {
    if (!localStorage.getItem('jackdaw-theme')) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });

  // 2. Showcase Tab Switcher
  const tabs = document.querySelectorAll('.showcase-tab');
  const panels = document.querySelectorAll('.showcase-panel');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-target');

      tabs.forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      panels.forEach((p) => {
        p.classList.remove('active');
      });

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });

  // 3. Platform Detection for Download Buttons
  function detectOS() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.includes('mac')) return 'mac';
    if (userAgent.includes('win')) return 'windows';
    if (userAgent.includes('linux')) return 'linux';
    return 'other';
  }

  const detectedOS = detectOS();
  const heroDownloadBtn = document.getElementById('hero-download-btn');
  const detectedLabel = document.getElementById('detected-os-label');

  const DOWNLOAD_LINKS = {
    mac: {
      url: 'https://github.com/Uugsx/jackdaw-mail/releases/latest',
      text: 'Скачать для macOS',
      label: 'macOS 12+ (Apple Silicon & Intel DMG)',
      cardId: 'card-macos'
    },
    windows: {
      url: 'https://github.com/Uugsx/jackdaw-mail/releases/latest',
      text: 'Скачать для Windows',
      label: 'Windows 10 / 11 (64-bit EXE)',
      cardId: 'card-windows'
    },
    linux: {
      url: 'https://github.com/Uugsx/jackdaw-mail/releases/latest',
      text: 'Скачать для Linux',
      label: 'Linux (AppImage / DEB)',
      cardId: 'card-linux'
    },
    other: {
      url: 'https://github.com/Uugsx/jackdaw-mail/releases/latest',
      text: 'Перейти к загрузкам',
      label: 'macOS, Windows, Linux',
      cardId: 'card-macos'
    }
  };

  const currentPlatform = DOWNLOAD_LINKS[detectedOS] || DOWNLOAD_LINKS.other;

  if (heroDownloadBtn) {
    heroDownloadBtn.href = currentPlatform.url;
    heroDownloadBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      ${currentPlatform.text}
    `;
  }

  if (detectedLabel) {
    detectedLabel.textContent = currentPlatform.label;
  }

  if (currentPlatform.cardId) {
    const primaryCard = document.getElementById(currentPlatform.cardId);
    if (primaryCard) {
      primaryCard.classList.add('primary-os');
    }
  }

  // 4. Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#' || !href) return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

})();

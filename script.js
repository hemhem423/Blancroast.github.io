'use strict';

/* ============================================================
   script.js — Noir & Blanc Roast
   ============================================================
   処理の流れ:
   1. header.html / footer.html を fetch で読み込み DOM に挿入
   2. 挿入後に各種イベントを初期化（initHeader / initFooter など）
   3. 現在のパスに合わせてナビのアクティブリンクを強調
   ============================================================ */

/* ----------------------------------------
   コンポーネント読み込み
   ---------------------------------------- */

/**
 * 指定した URL の HTML を取得して、
 * セレクタに一致する要素の innerHTML に挿入する。
 * @param {string} url      - 読み込む HTML ファイルのパス
 * @param {string} selector - 挿入先セレクタ
 */
async function loadComponent(url, selector) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    const html = await res.text();
    const el = document.querySelector(selector);
    if (el) el.innerHTML = html;
  } catch (err) {
    console.warn('[loadComponent]', err);
  }
}

/* ----------------------------------------
   ナビゲーション アクティブ強調
   ---------------------------------------- */

/**
 * 現在のページパスと href を照合し、
 * 一致するリンクに aria-current="page" と .is-active を付与する。
 */
function setActiveNav() {
  const current = location.pathname.replace(/\/$/, '') || '/index.html';

  // ヘッダー・フッター両方のナビリンクを対象にする
  document.querySelectorAll('.nav-links a, .mobile-menu a, .footer-nav a').forEach((a) => {
    const href = a.getAttribute('href') || '';

    // ハッシュリンク（#shop など）はスキップ
    if (href.startsWith('#')) return;

    // パス部分だけ比較（クエリ・ハッシュは除外）
    // location.href を基準にすることでサブディレクトリ（GitHub Pages等）でも正しく解決する
    const linkPath = new URL(href, location.href).pathname.replace(/\/$/, '');

    const isActive = linkPath === current
      // index.html は / でもマッチさせる
      || (linkPath === '/index.html' && current === '/')
      || (linkPath === '/'           && current === '/index.html')
      // GitHub Pages: リポジトリ名がサブディレクトリになる場合に対応
      || (current.endsWith('/index.html') && linkPath.endsWith('/index.html') && linkPath === current);

    if (isActive) {
      a.setAttribute('aria-current', 'page');
      a.classList.add('is-active');
    } else {
      a.removeAttribute('aria-current');
      a.classList.remove('is-active');
    }
  });
}

/* ----------------------------------------
   Header 初期化
   ---------------------------------------- */

function initHeader() {
  /* --- スクロールで背景追加 --- */
  const header = document.getElementById('header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // 初回実行（ページ途中でリロードされた場合に対応）
  }

  /* --- モバイルメニュー 開閉 + フォーカストラップ --- */
  const menuToggle  = document.getElementById('menuToggle');
  const mobileMenu  = document.getElementById('mobileMenu');
  const mobileClose = document.getElementById('mobileMenuClose');

  if (!menuToggle || !mobileMenu) return;

  const getFocusable = (el) =>
    [...el.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')];

  function openMenu() {
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'メニューを閉じる');
    const items = getFocusable(mobileMenu);
    if (items.length) items[0].focus();
    document.addEventListener('keydown', trapFocus);
    document.addEventListener('keydown', handleEsc);
  }

  function closeMenu() {
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'メニューを開く');
    menuToggle.focus();
    document.removeEventListener('keydown', trapFocus);
    document.removeEventListener('keydown', handleEsc);
  }

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const items = getFocusable(mobileMenu);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  }

  function handleEsc(e) {
    if (e.key === 'Escape') closeMenu();
  }

  menuToggle.addEventListener('click', () =>
    mobileMenu.classList.contains('open') ? closeMenu() : openMenu()
  );

  if (mobileClose) mobileClose.addEventListener('click', closeMenu);

  // モバイルメニュー内のリンクをクリックしたら閉じる
  mobileMenu.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', closeMenu)
  );
}

/* ----------------------------------------
   スクロール Reveal (IntersectionObserver)
   ---------------------------------------- */

function initReveal() {
  // reduced-motion 設定を尊重
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal').forEach((el) => {
      el.classList.add('visible');
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -32px 0px' }
  );

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
}

/* ----------------------------------------
   Hero タグライン ローテーション
   ---------------------------------------- */

function initHeroTagline() {
  const taglines = [
    '都会の喧騒を忘れる、珈琲と静謐の時間',
    '厳選された豆が紡ぐ、特別な一杯',
    '古材とアイアンが調和する、落ち着きの空間',
  ];
  let idx = 0;
  const el = document.getElementById('heroTagline');
  if (!el) return;

  setInterval(() => {
    el.style.opacity = '0';
    setTimeout(() => {
      idx = (idx + 1) % taglines.length;
      el.textContent = taglines[idx];
      el.style.opacity = '1';
    }, 400);
  }, 5000);
}

/* ----------------------------------------
   News フィルター
   ---------------------------------------- */

function initNewsFilter() {
  const filterBtns = document.querySelectorAll('.news-filter');
  const newsCards  = document.querySelectorAll('.news-card');
  if (!filterBtns.length) return;

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.filter;
      newsCards.forEach((card) => {
        if (cat === 'all' || card.dataset.category === cat) {
          card.removeAttribute('hidden');
        } else {
          card.setAttribute('hidden', '');
        }
      });
    });
  });
}

/* ----------------------------------------
   エントリーポイント
   ---------------------------------------- */

async function init() {
  // header.html / footer.html を並列で読み込む（相対パスでGitHub Pages対応）
  await Promise.all([
    loadComponent('header.html', '#header-placeholder'),
    loadComponent('footer.html', '#footer-placeholder'),
  ]);

  // コンポーネント挿入後に各処理を初期化
  setActiveNav();
  initHeader();
  initReveal();
  initHeroTagline();
  initNewsFilter();
}

// DOM が構築され次第、ヘッダー・フッターを読み込んで初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
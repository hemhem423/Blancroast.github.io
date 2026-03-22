/* ============================================================
   script.js  –  Noir & Blanc Roast
   ============================================================ */

'use strict';

/* ----------------------------------------
   Header: スクロールで背景追加
   ---------------------------------------- */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

/* ----------------------------------------
   Mobile Menu: 開閉 + フォーカストラップ
   ---------------------------------------- */
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const mobileClose = document.getElementById('mobileMenuClose');

/** フォーカス可能な要素を取得 */
const getFocusable = (el) => [...el.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')];

function openMenu() {
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'メニューを閉じる');

    // フォーカスをメニュー内の最初の要素へ
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

    menuToggle.focus(); // フォーカスをトグルボタンへ戻す
    document.removeEventListener('keydown', trapFocus);
    document.removeEventListener('keydown', handleEsc);
}

function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const items = getFocusable(mobileMenu);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];

    if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault();
            last.focus(); }
    } else {
        if (document.activeElement === last) { e.preventDefault();
            first.focus(); }
    }
}

function handleEsc(e) {
    if (e.key === 'Escape') closeMenu();
}

menuToggle.addEventListener('click', () => {
    mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
});

// 閉じるボタン（×）
if (mobileClose) mobileClose.addEventListener('click', closeMenu);

// ナビリンクをクリックしたら閉じる（mobile-link + mobile-menu-cta 両方対象）
mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
});

/* ----------------------------------------
   Scroll Reveal（IntersectionObserver）
   ---------------------------------------- */
const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target); // 一度表示したら監視解除
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' }
);

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// prefers-reduced-motion 対応: アニメーション無効設定を尊重
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal').forEach((el) => {
        el.classList.add('visible');
        revealObserver.unobserve(el);
    });
}

/* ----------------------------------------
   Hero タグライン ローテーション
   ---------------------------------------- */
const taglines = [
    '都会の喧騒を忘れる、珈琲と静謐の時間',
    '厳選された豆が紡ぐ、特別な一杯',
    '古材とアイアンが調和する、落ち着きの空間',
];
let taglineIndex = 0;
const taglineEl = document.getElementById('heroTagline');

if (taglineEl) {
    // 初期テキストは HTML に記述済み。一定間隔でフェードしながら切り替える。
    setInterval(() => {
        taglineEl.style.opacity = '0';
        setTimeout(() => {
            taglineIndex = (taglineIndex + 1) % taglines.length;
            taglineEl.textContent = taglines[taglineIndex];
            taglineEl.style.opacity = '1';
        }, 400);
    }, 5000);
}

/* ----------------------------------------
   News フィルター（カテゴリで表示切替）
   ---------------------------------------- */
const filterBtns = document.querySelectorAll('.news-filter');
const newsCards = document.querySelectorAll('.news-card');

filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
        // active クラスを切り替え
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const category = btn.dataset.filter; // "all" | "event" | "menu" | "info"

        newsCards.forEach((card) => {
            const cardCategory = card.dataset.category; // HTML の data-category 属性と照合
            if (category === 'all' || cardCategory === category) {
                card.removeAttribute('hidden');
            } else {
                card.setAttribute('hidden', '');
            }
        });
    });
});
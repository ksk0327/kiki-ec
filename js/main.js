/* ══════════════════════════
   SCROLL PROGRESS BAR
══════════════════════════ */
const progressBar = document.createElement('div');
progressBar.className = 'scroll-bar';
document.body.prepend(progressBar);

/* ══════════════════════════
   NAV STATE
══════════════════════════ */
const nav = document.querySelector('.nav');
const isDark = nav?.classList.contains('nav-dark');

function updateNav() {
  if (!nav) return;
  const past = window.scrollY > 60;
  if (isDark) {
    nav.classList.toggle('nav--d-solid', past);
    nav.classList.toggle('nav--d-clear', !past);
  } else {
    nav.classList.toggle('nav--solid', past);
    nav.classList.toggle('nav--clear', !past);
  }
  // Shrink nav height on scroll
  nav.style.height = past ? '54px' : 'var(--nav-h)';
}
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

/* ══════════════════════════
   SCROLL PROGRESS UPDATE
══════════════════════════ */
window.addEventListener('scroll', () => {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
  progressBar.style.width = pct + '%';
}, { passive: true });

/* ══════════════════════════
   MOBILE MENU
══════════════════════════ */
const hamburger = document.querySelector('.nav-hamburger');
const overlay   = document.querySelector('.nav-overlay');
hamburger?.addEventListener('click', () => {
  const open = overlay?.classList.toggle('open');
  document.body.style.overflow = open ? 'hidden' : '';
});
overlay?.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  })
);

/* ══════════════════════════
   CUSTOM COFFEE BEAN CURSOR
══════════════════════════ */
const isTouchDevice = window.matchMedia('(hover: none)').matches;
if (!isTouchDevice) {
  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  document.body.appendChild(cursor);

  let mouseX = 0, mouseY = 0;
  let curX = 0, curY = 0;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.classList.add('cursor-active');
  });
  document.addEventListener('mouseleave', () => cursor.classList.remove('cursor-active'));

  // Smooth cursor follow
  function animateCursor() {
    curX += (mouseX - curX) * 0.18;
    curY += (mouseY - curY) * 0.18;
    cursor.style.left = curX + 'px';
    cursor.style.top  = curY + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Scale on hover over interactive elements
  document.querySelectorAll('a, button, .card, .g-cell').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hover'));
  });

  // Enlarge on image hover
  document.querySelectorAll('img, .parallax-wrap').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('cursor-img'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-img'));
  });
}

/* ══════════════════════════
   SCROLL REVEAL (all directions)
══════════════════════════ */
const revealClasses = ['.reveal', '.reveal-left', '.reveal-right', '.reveal-scale'];
const allReveal = document.querySelectorAll(revealClasses.join(','));

const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.07 });

allReveal.forEach(el => io.observe(el));

/* ══════════════════════════
   PARALLAX
══════════════════════════ */
const parallaxImgs = document.querySelectorAll('.parallax-img');

function updateParallax() {
  parallaxImgs.forEach(img => {
    const wrap = img.closest('.parallax-wrap');
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const center = rect.top + rect.height / 2 - window.innerHeight / 2;
    img.style.transform = `translateY(${center * 0.18}px)`;
  });
}

if (parallaxImgs.length > 0) {
  window.addEventListener('scroll', updateParallax, { passive: true });
  updateParallax();
}

/* ══════════════════════════
   HERO TEXT ANIMATION
   (word-by-word on load)
══════════════════════════ */
const heroTitle = document.querySelector('.hero-title');
if (heroTitle) {
  const html = heroTitle.innerHTML;
  // Split on characters (including Japanese) preserving <br>
  const parts = html.split(/(<br\s*\/?>)/i);
  heroTitle.innerHTML = parts.map(part => {
    if (/^<br/i.test(part)) return part;
    return [...part].map((ch, i) =>
      `<span class="hero-char" style="opacity:0;display:inline-block;transform:translateY(16px);transition:opacity .5s ${i * 0.04}s ease,transform .5s ${i * 0.04}s ease;">${ch === ' ' ? '&nbsp;' : ch}</span>`
    ).join('');
  }).join('');

  setTimeout(() => {
    document.querySelectorAll('.hero-char').forEach(ch => {
      ch.style.opacity = '1';
      ch.style.transform = 'translateY(0)';
    });
  }, 200);
}

/* ══════════════════════════
   CANVAS LIQUID TRANSITIONS
   Spout slides in from top-right, tilts, pours —
   liquid rises from bottom; canvas clears to new section.
══════════════════════════ */
(function () {
  const canvas = document.getElementById('lq-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0, dpr = 1;
  let tipXIn = 0, tipXOut = 0, tipY = 0;

  function resize() {
    dpr      = Math.min(window.devicePixelRatio || 1, 2);
    W        = window.innerWidth;
    H        = window.innerHeight;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    tipXIn  = W - 100;
    tipXOut = W + 300;
    tipY    = Math.min(150, Math.round(H * 0.22));
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  /* ── phase durations (ms) ── */
  const T_ENTER = 700;
  const T_TILT  = 560;
  const T_FILL  = 1700;
  const T_HOLD  = 160;
  const T_EXIT  = 560;

  /* ── easing ── */
  const easeOut3  = t => 1 - Math.pow(1 - t, 3);
  const easeOut4  = t => 1 - Math.pow(1 - t, 4);
  const easeIn3   = t => t * t * t;
  const easeInOut = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
  const easeOutBack = t => { const c1=1.70158,c3=c1+1; return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2); };

  /* ── spout angles (radians) ── */
  const ROT_REST = -0.30;   // resting: tip slightly raised
  const ROT_POUR =  0.20;   // pour: tip tilted down for pouring

  /* ── animation state ── */
  let phase       = 'idle';
  let phaseT0     = 0;
  let liqColor    = '#3b2a1f';
  let onCover     = null;
  let curTipX     = 0;
  let curRot      = ROT_REST;
  let nextSection = null;

  /* ── scroll lock helpers ── */
  let _wh = null, _th = null, _kh = null;
  const BLOCK_KEYS = { ArrowUp:1, ArrowDown:1, ' ':1, PageUp:1, PageDown:1 };

  function lockScroll() {
    _wh = e => e.preventDefault();
    _th = e => e.preventDefault();
    _kh = e => { if (BLOCK_KEYS[e.key]) e.preventDefault(); };
    document.addEventListener('wheel',     _wh, { passive: false });
    document.addEventListener('touchmove', _th, { passive: false });
    document.addEventListener('keydown',   _kh);
    document.documentElement.classList.add('lq-active');
  }
  function unlockScroll() {
    if (_wh) { document.removeEventListener('wheel',     _wh); _wh = null; }
    if (_th) { document.removeEventListener('touchmove', _th); _th = null; }
    if (_kh) { document.removeEventListener('keydown',   _kh); _kh = null; }
    document.documentElement.classList.remove('lq-active');
  }

  /* ──────────────────────────────
     SPOUT PATH helper (reused by dual-layer draw)
  ────────────────────────────── */
  function spoutPath() {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(  6, -30,  12, -60,   8, -88);
    ctx.bezierCurveTo( -4,-115,  30,-145,  68,-126);
    ctx.bezierCurveTo(100,-110, 138, -92, 168, -80);
    ctx.bezierCurveTo(200, -68, 240, -54, 270, -44);
  }

  /* ──────────────────────────────
     SPOUT DRAWING
     Dual layer: dark outline + bright inner → visible on any background.
     Local space: (0,0) = nozzle tip.
  ────────────────────────────── */
  function drawSpout(alpha) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';

    // Layer 1: dark silhouette outline
    ctx.strokeStyle = 'rgba(8, 4, 2, 0.48)';
    ctx.lineWidth   = 20;
    ctx.shadowColor = 'rgba(0,0,0,0.0)';
    ctx.shadowBlur  = 0;
    spoutPath(); ctx.stroke();

    // Layer 2: bright inner stroke (warm ivory)
    ctx.strokeStyle = 'rgba(255, 248, 236, 0.94)';
    ctx.lineWidth   = 10;
    ctx.shadowColor = 'rgba(255, 240, 210, 0.30)';
    ctx.shadowBlur  = 8;
    spoutPath(); ctx.stroke();

    // Nozzle tip circle
    ctx.fillStyle   = 'rgba(255, 248, 236, 0.92)';
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur  = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* ──────────────────────────────
     SURFACE WAVE — 4 harmonic layers for organic feel
  ────────────────────────────── */
  function swy(baseY, x, t, amp) {
    return baseY
      + amp        * Math.sin(x * 0.0090 + t * 0.75)
      + amp * 0.40 * Math.sin(x * 0.019  + t * 1.20 + 1.3)
      + amp * 0.18 * Math.sin(x * 0.041  + t * 0.85 + 2.7)
      + amp * 0.09 * Math.sin(x * 0.085  + t * 1.55 + 4.2);
  }

  /* ──────────────────────────────
     LIQUID BODY — rises from bottom
  ────────────────────────────── */
  function drawLiquid(baseY, fillP) {
    const t   = performance.now() * 0.001;
    // Amplitude: higher at start/mid (turbulent pour), settles near full
    const amp = 14 * Math.sin(fillP * Math.PI * 0.9) + 7;

    ctx.fillStyle = liqColor;
    ctx.beginPath();
    ctx.moveTo(0, H + 2);
    for (let x = 0; x <= W; x += 3) ctx.lineTo(x, swy(baseY, x, t, amp));
    ctx.lineTo(W, H + 2);
    ctx.closePath();
    ctx.fill();
  }

  /* ──────────────────────────────
     STREAM from spout tip to surface
     Fades in over the first 20% of fill.
  ────────────────────────────── */
  function drawStream(tx, ty, baseY, fillP) {
    const t      = performance.now() * 0.001;
    const amp    = 14 * Math.sin(fillP * Math.PI * 0.9) + 7;
    const sy     = swy(baseY, tx, t, amp);
    if (sy <= ty + 14) return;

    const len         = sy - ty;
    // Fade stream in during first 20% of fill
    const streamAlpha = Math.min(1, fillP / 0.20);
    // Width pulses gently with pour rhythm
    const streamW     = 3.5 + 2 * Math.pow(Math.sin(fillP * Math.PI), 0.6);

    const grad = ctx.createLinearGradient(tx, ty, tx, sy);
    grad.addColorStop(0, liqColor + '88');
    grad.addColorStop(0.5, liqColor + 'cc');
    grad.addColorStop(1,   liqColor);

    ctx.save();
    ctx.globalAlpha = streamAlpha;
    ctx.strokeStyle = grad;
    ctx.lineWidth   = streamW;
    ctx.lineCap     = 'round';
    const wb = 2.5 * Math.sin(t * 4.2);
    ctx.beginPath();
    ctx.moveTo(tx, ty + 10);
    ctx.bezierCurveTo(tx + wb, ty + len * 0.33, tx - wb, ty + len * 0.66, tx, sy - 3);
    ctx.stroke();
    ctx.restore();
  }

  /* ──────────────────────────────
     RENDER LOOP
  ────────────────────────────── */
  function render(now) {
    ctx.clearRect(0, 0, W, H);
    const e = now - phaseT0;

    if (phase === 'enter') {
      const p  = Math.min(1, e / T_ENTER);
      curTipX  = tipXOut + (tipXIn - tipXOut) * easeOut4(p);
      curRot   = ROT_REST;
      ctx.save();
      ctx.translate(curTipX, tipY);
      ctx.rotate(curRot);
      drawSpout(Math.min(1, p * 3));
      ctx.restore();
      if (p >= 1) { phase = 'tilt'; phaseT0 = now; }

    } else if (phase === 'tilt') {
      const p = Math.min(1, e / T_TILT);
      curRot  = ROT_REST + (ROT_POUR - ROT_REST) * easeInOut(p);
      curTipX = tipXIn;
      ctx.save();
      ctx.translate(curTipX, tipY);
      ctx.rotate(curRot);
      drawSpout(1);
      ctx.restore();
      if (p >= 1) { phase = 'fill'; phaseT0 = now; }

    } else if (phase === 'fill') {
      const p     = Math.min(1, e / T_FILL);
      const baseY = H + 20 - (H + 40) * easeInOut(p);
      // Subtle hand-held sway — makes the spout feel alive
      const t     = performance.now() * 0.001;
      const swayX = 1.8 * Math.sin(t * 1.4);
      const swayY = 0.8 * Math.sin(t * 2.1 + 1.0);

      drawLiquid(baseY, p);
      drawStream(curTipX + swayX, tipY + swayY, baseY, p);

      ctx.save();
      ctx.translate(curTipX + swayX, tipY + swayY);
      ctx.rotate(curRot + 0.012 * Math.sin(t * 1.8));
      drawSpout(1);
      ctx.restore();

      if (p >= 1) {
        phase = 'hold'; phaseT0 = now;
        // Screen fully covered — navigate to next section while hidden
        if (nextSection) {
          window.scrollTo({ top: nextSection.offsetTop, behavior: 'instant' });
        }
        if (onCover) onCover();
      }

    } else if (phase === 'hold') {
      ctx.fillStyle = liqColor;
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.translate(curTipX, tipY);
      ctx.rotate(curRot);
      drawSpout(1);
      ctx.restore();
      if (e >= T_HOLD) { phase = 'exit'; phaseT0 = now; }

    } else if (phase === 'exit') {
      const p  = Math.min(1, e / T_EXIT);
      curTipX  = tipXIn + (tipXOut - tipXIn) * easeIn3(p);
      curRot   = ROT_POUR + (ROT_REST - ROT_POUR) * easeInOut(p);
      ctx.fillStyle = liqColor;
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.translate(curTipX, tipY);
      ctx.rotate(curRot);
      drawSpout(1 - easeInOut(p));
      ctx.restore();
      if (p >= 1) {
        phase = 'idle';
        ctx.clearRect(0, 0, W, H);
        unlockScroll();
        return;
      }

    } else {
      return;
    }
    requestAnimationFrame(render);
  }

  /* ── public API ── */
  function start(color, nextEl, onCovered) {
    if (phase !== 'idle') return false;
    liqColor    = color;
    nextSection = nextEl || null;
    curTipX     = tipXOut;
    curRot      = ROT_REST;
    phase       = 'enter';
    phaseT0     = performance.now();
    onCover     = onCovered || null;
    lockScroll();
    requestAnimationFrame(render);
    return true;
  }
  // External pages call: LiquidTransition.start(color, targetEl)
  window.LiquidTransition = { start };

  /* ── trigger on sw-zones via data-color attribute ── */
  const zones = document.querySelectorAll('.sw-zone[data-color]');
  if (zones.length) {
    const done = new Set();
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const theme  = e.target.dataset.theme;
        const color  = e.target.dataset.color;
        const nextEl = e.target.nextElementSibling;
        if (!theme || !color || done.has(theme)) return;
        if (start(color, nextEl)) done.add(theme);
      });
    // threshold:0 + rootMargin fires when zone crosses ~40% from viewport bottom
    }, { threshold: 0, rootMargin: '0px 0px -40% 0px' });
    zones.forEach(z => io.observe(z));
  }
}());

/* ══════════════════════════
   COFFEE POUR ANIMATION
══════════════════════════ */
const pourScene = document.getElementById('pour-scene');
if (pourScene) {
  let poured = false;

  const pourIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && !poured) {
        poured = true;

        // 1. Kettle tilts forward
        setTimeout(() => pourScene.classList.add('stage-tilt'),    250);
        // 2. Coffee stream flows from spout
        setTimeout(() => pourScene.classList.add('stage-stream'),  1000);
        // 3. Brown fill rises from the bottom
        setTimeout(() => pourScene.classList.add('stage-fill'),    1800);
        // 4. Philosophy text fades in on brown background
        setTimeout(() => pourScene.classList.add('stage-content'), 3400);

        pourIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.25 });

  pourIO.observe(pourScene);
}

/* ══════════════════════════
   QUALITIES PAGE — STICKY NAV HIGHLIGHT
══════════════════════════ */
const qlSections = document.querySelectorAll('.ql-section');
const qlNavLinks = document.querySelectorAll('.ql-nav-link');

if (qlSections.length && qlNavLinks.length) {
  const sectionIo = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = e.target.id;
        qlNavLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { threshold: 0.4 });
  qlSections.forEach(s => sectionIo.observe(s));
}

/* Centre of Excellence — interactions */
(function () {
  'use strict';

  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  /* --- Sticky nav background on scroll --- */
  const onScroll = () => {
    if (window.scrollY > 24) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --- Mobile menu --- */
  navToggle.addEventListener('click', () => nav.classList.toggle('open'));
  navLinks.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') nav.classList.remove('open');
  });

  /* --- Reveal on scroll --- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* --- Stagger reveal inside grids --- */
  document.querySelectorAll('.pillars, .products, .classes, .team, .timeline').forEach((grid) => {
    Array.from(grid.children).forEach((child, i) => {
      if (child.classList.contains('reveal')) child.style.transitionDelay = (i % 4) * 80 + 'ms';
    });
  });

  /* --- Count-up stats --- */
  const counters = document.querySelectorAll('.stat__num[data-count]');
  const animateCount = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const dur = 1100;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { animateCount(entry.target); co.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => co.observe(c));
  }

  /* --- Active nav link by section --- */
  const sections = document.querySelectorAll('main section[id]');
  const linkMap = {};
  document.querySelectorAll('.nav__links a[href^="#"]').forEach((a) => {
    linkMap[a.getAttribute('href').slice(1)] = a;
  });
  if ('IntersectionObserver' in window) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const link = linkMap[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          Object.values(linkMap).forEach((l) => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => so.observe(s));
  }

  /* --- Lightbox gallery --- */
  const shots = Array.from(document.querySelectorAll('.shot[data-full]'));
  const lb = document.getElementById('lightbox');
  if (shots.length && lb) {
    const lbImg = document.getElementById('lbImg');
    const lbCap = document.getElementById('lbCap');
    let idx = 0;

    const show = (i) => {
      idx = (i + shots.length) % shots.length;
      const fig = shots[idx];
      lbImg.src = fig.dataset.full;
      lbImg.alt = fig.querySelector('img') ? fig.querySelector('img').alt : '';
      lbCap.textContent = fig.dataset.cap || '';
    };
    const open = (i) => { show(i); lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; };
    const close = () => { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; };

    shots.forEach((fig, i) => fig.addEventListener('click', () => open(i)));
    document.getElementById('lbClose').addEventListener('click', close);
    document.getElementById('lbPrev').addEventListener('click', (e) => { e.stopPropagation(); show(idx - 1); });
    document.getElementById('lbNext').addEventListener('click', (e) => { e.stopPropagation(); show(idx + 1); });
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* --- Manufacturing reel placeholder click --- */
  const reelPlay = document.querySelector('.reel__play');
  if (reelPlay) {
    reelPlay.addEventListener('click', () => {
      const note = document.querySelector('.reel__note');
      if (note) note.textContent = 'Add a clip to assets/video/ and wire it up here';
    });
  }

  /* --- Scroll progress bar --- */
  const bar = document.getElementById('scrollbar');
  if (bar) {
    const updateBar = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', updateBar, { passive: true });
    window.addEventListener('resize', updateBar);
    updateBar();
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  /* --- Pointer-tracked spotlight on cards --- */
  if (finePointer) {
    document.querySelectorAll('.cap, .product, .class, .patent, .pillar').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
      });
    });
  }

  /* --- Magnetic buttons --- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.btn').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* --- Hero visual parallax --- */
  if (finePointer && !reduceMotion) {
    const hero = document.querySelector('.hero');
    const main = document.querySelector('.hero__card--main');
    const badge = document.querySelector('.hero__badge');
    if (hero && main) {
      hero.addEventListener('pointermove', (e) => {
        const cx = (e.clientX / window.innerWidth - 0.5) * 2;
        const cy = (e.clientY / window.innerHeight - 0.5) * 2;
        main.style.transform = `translate(${cx * 10}px, ${cy * 10}px)`;
        if (badge) badge.style.transform = `translate(${cx * -14}px, ${cy * -14}px)`;
      });
      hero.addEventListener('pointerleave', () => {
        main.style.transform = '';
        if (badge) badge.style.transform = '';
      });
    }
  }

  /* --- Footer year --- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

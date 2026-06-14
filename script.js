// ===== Masthead shadow on scroll =====
const masthead = document.getElementById('masthead');
addEventListener('scroll', () => {
  masthead.classList.toggle('is-scrolled', scrollY > 8);
}, { passive: true });

// ===== Mobile navigation =====
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
navToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  navToggle.classList.toggle('is-open', open);
  navToggle.setAttribute('aria-expanded', open);
});
nav.addEventListener('click', e => {
  if (e.target.tagName === 'A') {
    nav.classList.remove('is-open');
    navToggle.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
});

// ===== Scroll-triggered reveals =====
const io = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    }
  }
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ===== Newsletter form =====
const form = document.getElementById('newsletterForm');
const note = document.getElementById('nlNote');
form && form.addEventListener('submit', e => {
  e.preventDefault();
  const email = form.email.value.trim();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    note.textContent = 'Please enter a valid email address.';
    return;
  }
  // Mailing-list backend not wired up yet — capture via mailto for now.
  location.href = 'mailto:info@ornatesolar.com?subject=Newsletter%20subscription&body=' +
    encodeURIComponent('Please add ' + email + ' to the quarterly newsletter mailing list.');
  note.textContent = 'Opening your mail client to confirm the subscription…';
  form.reset();
});

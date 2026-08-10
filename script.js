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

// ===== Nav dropdown (News → News & Archives / Newsletter) =====
const navGroups = document.querySelectorAll('.nav__group');
function closeNavGroups(except) {
  navGroups.forEach(g => {
    if (g === except) return;
    g.classList.remove('is-open');
    g.querySelector('.nav__trigger')?.setAttribute('aria-expanded', 'false');
  });
}
navGroups.forEach(group => {
  const trigger = group.querySelector('.nav__trigger');
  trigger.addEventListener('click', e => {
    e.stopPropagation();
    const open = group.classList.toggle('is-open');
    trigger.setAttribute('aria-expanded', open);
    closeNavGroups(group);
  });
});
document.addEventListener('click', () => closeNavGroups());
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNavGroups(); });

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

// ===== Form backend =====
// Public URL of the Mac mini backend, exposed via Cloudflare Tunnel.
// Replace with your real subdomain once the tunnel is set up.
const API_BASE = 'https://coe-api.unityess.cloud';
const isEmail = v => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

async function postJSON(endpoint, data) {
  const res = await fetch(API_BASE + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.error || 'Request failed');
  return out;
}

// ===== Newsletter form =====
const form = document.getElementById('newsletterForm');
const note = document.getElementById('nlNote');
form && form.addEventListener('submit', async e => {
  e.preventDefault();
  const email = form.email.value.trim();
  if (!isEmail(email)) {
    note.textContent = 'Please enter a valid email address.';
    return;
  }
  note.textContent = 'Subscribing…';
  try {
    await postJSON('/newsletter', { email, company: form.company?.value || '' });
    note.textContent = 'Thanks — you’re on the list.';
    form.reset();
  } catch (err) {
    // Backend unreachable: fall back to the visitor's mail client.
    location.href = 'mailto:info@ornatesolar.com?subject=Newsletter%20subscription&body=' +
      encodeURIComponent('Please add ' + email + ' to the quarterly newsletter mailing list.');
    note.textContent = 'Opening your mail client to confirm the subscription…';
  }
});

// ===== Contact form =====
const contactForm = document.getElementById('contactForm');
const cNote = document.getElementById('cNote');
contactForm && contactForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name = contactForm.name.value.trim();
  const email = contactForm.email.value.trim();
  const subject = contactForm.subject.value.trim() || 'Enquiry — Centre of Excellence';
  const message = contactForm.message.value.trim();
  if (!name || !message || !isEmail(email)) {
    cNote.textContent = 'Please enter your name, a valid email, and a message.';
    return;
  }
  cNote.textContent = 'Sending…';
  try {
    await postJSON('/contact', { name, email, subject, message, company: contactForm.company?.value || '' });
    cNote.textContent = 'Thank you — your message has been sent.';
    contactForm.reset();
  } catch (err) {
    // Backend unreachable: fall back to the visitor's mail client.
    const body = 'Name: ' + name + '\nEmail: ' + email + '\n\n' + message;
    location.href = 'mailto:info@ornatesolar.com'
      + '?subject=' + encodeURIComponent(subject)
      + '&body=' + encodeURIComponent(body);
    cNote.textContent = 'Opening your mail client to send the message…';
  }
});

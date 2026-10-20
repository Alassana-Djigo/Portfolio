/* =========================================================
   ALASSANA DJIGO — PORTFOLIO SCRIPT
   - Canvas math/data visualization (hero background)
   - Mouse parallax glow
   - Scroll reveal animations
   - Animated counters
   - Skill bar fills
   - Navigation scroll state
   - Mobile menu
   ========================================================= */

/* ─── Nav scroll state ──────────────────────────────────── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ─── Mobile menu ───────────────────────────────────────── */
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open);
  // Animate hamburger → X
  const spans = navToggle.querySelectorAll('span');
  if (open) {
    spans[0].style.transform = 'translateY(6.5px) rotate(45deg)';
    spans[1].style.opacity   = '0';
    spans[2].style.transform = 'translateY(-6.5px) rotate(-45deg)';
  } else {
    spans[0].style.transform = '';
    spans[1].style.opacity   = '';
    spans[2].style.transform = '';
  }
});

// Close on link click
navLinks.querySelectorAll('.nav__link').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    const spans = navToggle.querySelectorAll('span');
    spans[0].style.transform = '';
    spans[1].style.opacity   = '';
    spans[2].style.transform = '';
  });
});

/* ─── Hero: mouse glow parallax ────────────────────────── */
const heroGlow = document.getElementById('heroGlow');
const heroEl   = document.querySelector('.hero');

if (heroEl && heroGlow) {
  heroEl.addEventListener('mousemove', e => {
    const rect = heroEl.getBoundingClientRect();
    heroGlow.style.left = (e.clientX - rect.left) + 'px';
    heroGlow.style.top  = (e.clientY - rect.top)  + 'px';
  });
}

/* ─── Scroll Reveal ─────────────────────────────────────── */
(function initReveal() {
  const revealEls = document.querySelectorAll('.reveal');

  // Add stagger delays to siblings in the same parent
  document.querySelectorAll('.projects__grid, .about__stats, .skills__grid, .contact__grid').forEach(grid => {
    grid.querySelectorAll('.reveal').forEach((el, i) => {
      el.setAttribute('data-delay', Math.min(i + 1, 5));
    });
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => io.observe(el));
})();

/* ─── Animated counters ─────────────────────────────────── */
(function initCounters() {
  const counters = document.querySelectorAll('[data-count]');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el  = entry.target;
      const end = parseInt(el.dataset.count);
      const dur = 1600;
      const start = performance.now();

      function frame(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / dur, 1);
        // Ease out cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(ease * end);
        if (progress < 1) requestAnimationFrame(frame);
        else el.textContent = end + (end === 100 ? '' : '+');
      }
      requestAnimationFrame(frame);
      io.unobserve(el);
    });
  }, { threshold: 0.6 });

  counters.forEach(el => io.observe(el));
})();

/* ─── Skill bar fills on scroll ────────────────────────── */
(function initSkillBars() {
  const bars = document.querySelectorAll('.skill-bar__fill');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const bar = entry.target;
      // Small delay for visual polish
      setTimeout(() => {
        bar.style.width = bar.dataset.w + '%';
      }, 200);
      io.unobserve(bar);
    });
  }, { threshold: 0.5 });

  bars.forEach(b => io.observe(b));
})();

/* ─── Active nav link highlight on scroll ───────────────── */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav__link');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(l => {
          l.style.color = l.getAttribute('href') === `#${id}` ? 'var(--cyan)' : '';
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => io.observe(s));
})();

/* ─── Contact form: envia para o Django (sem recarregar a página) ─── */
(function initForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const status = document.getElementById('formStatus');
  const btn    = form.querySelector('button[type="submit"]');
  const label  = btn.querySelector('span');
  const idle   = label.textContent;

  function setStatus(text, kind) {
    status.textContent = text;
    if (kind) status.dataset.kind = kind; else delete status.dataset.kind;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (btn.disabled) return;
    btn.disabled = true;
    label.textContent = 'Sending…';
    setStatus('');

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin'
      });
      let data = {};
      try { data = await res.json(); } catch (_) { /* resposta sem JSON */ }

      if (res.ok && data.ok) {
        form.reset();
        setStatus(data.message, 'success');
        label.textContent = 'Message sent ✓';
        btn.style.background = 'var(--green)';
        btn.style.color      = 'var(--bg)';
        setTimeout(() => {
          label.textContent = idle;
          btn.style.background = '';
          btn.style.color      = '';
          btn.disabled = false;
        }, 3000);
        return;
      }
      setStatus(data.message || 'Something went wrong. Please try again.', 'error');
    } catch (err) {
      setStatus('Could not send the message. Please check your connection or email me directly.', 'error');
    }
    label.textContent = idle;
    btn.disabled = false;
  });
})();

/* ─── Floating math pulse (extra subtle motion) ─────────── */
(function initMathFloats() {
  const floats = document.querySelectorAll('.math-float');
  // Random speed variation per element
  floats.forEach(el => {
    const dur = 10 + Math.random() * 8;
    el.style.animationDuration = dur + 's';
  });
})();

/* ─── Cursor: hero custom glow on desktop ───────────────── */
(function initCursor() {
  // Only on devices that support hover
  if (window.matchMedia('(hover: none)').matches) return;

  const hero = document.querySelector('.hero');
  if (!hero) return;

  let curX = 0, curY = 0, glowX = 0, glowY = 0;
  let raf;

  hero.addEventListener('mousemove', e => {
    const rect = hero.getBoundingClientRect();
    curX = e.clientX - rect.left;
    curY = e.clientY - rect.top;
  }, { passive: true });

  function lerp(a, b, t) { return a + (b - a) * t; }

  function animateGlow() {
    glowX = lerp(glowX, curX, 0.08);
    glowY = lerp(glowY, curY, 0.08);
    if (heroGlow) {
      heroGlow.style.left = glowX + 'px';
      heroGlow.style.top  = glowY + 'px';
    }
    raf = requestAnimationFrame(animateGlow);
  }
  animateGlow();
})();
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

/* ─── Canvas: math / data visualization ────────────────── */
(function initCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [], dataPoints = [], animId;

  /* Resize */
  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', () => { resize(); buildScene(); }, { passive: true });

  /* Colour helpers */
  const CYAN   = '0,229,255';
  const VIOLET = '139,92,246';
  const GREEN  = '0,255,136';

  /* ── Particle (matrix-like nodes) ── */
  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.r  = Math.random() * 1.5 + 0.4;
      this.vx = (Math.random() - 0.5) * 0.35;
      this.vy = (Math.random() - 0.5) * 0.35;
      this.life  = 0;
      this.maxLife = 300 + Math.random() * 200;
      this.color = Math.random() > 0.6 ? CYAN : (Math.random() > 0.5 ? VIOLET : GREEN);
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life++;
      if (this.life > this.maxLife) this.reset();
      // wrap
      if (this.x < 0) this.x = W;
      if (this.x > W) this.x = 0;
      if (this.y < 0) this.y = H;
      if (this.y > H) this.y = 0;
    }
    draw() {
      const alpha = Math.sin((this.life / this.maxLife) * Math.PI) * 0.6;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color},${alpha})`;
      ctx.fill();
    }
  }

  /* ── Data point (scatter plot) ── */
  class DataPoint {
    constructor(x, y) {
      this.tx = x; this.ty = y;        // target
      this.x  = x + (Math.random() - 0.5) * 40;
      this.y  = y + (Math.random() - 0.5) * 40;
      this.r  = Math.random() * 2.5 + 1;
      this.alpha = 0;
      this.targetAlpha = Math.random() * 0.5 + 0.2;
    }
    update() {
      this.x += (this.tx - this.x) * 0.04;
      this.y += (this.ty - this.y) * 0.04;
      this.alpha += (this.targetAlpha - this.alpha) * 0.03;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${CYAN},${this.alpha})`;
      ctx.fill();
      // cross-hair
      ctx.beginPath();
      ctx.moveTo(this.x - 5, this.y);
      ctx.lineTo(this.x + 5, this.y);
      ctx.moveTo(this.x, this.y - 5);
      ctx.lineTo(this.x, this.y + 5);
      ctx.strokeStyle = `rgba(${CYAN},${this.alpha * 0.5})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

  /* ── Grid ── */
  function drawGrid() {
    const step = 60;
    ctx.strokeStyle = 'rgba(255,255,255,0.024)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  /* ── Axes ── */
  function drawAxes(ox, oy, len) {
    ctx.strokeStyle = `rgba(${CYAN},0.18)`;
    ctx.lineWidth = 1;
    // X
    ctx.beginPath(); ctx.moveTo(ox - 10, oy); ctx.lineTo(ox + len, oy); ctx.stroke();
    // Y
    ctx.beginPath(); ctx.moveTo(ox, oy + 10); ctx.lineTo(ox, oy - len * 0.7); ctx.stroke();
    // Arrow X
    ctx.beginPath();
    ctx.moveTo(ox + len, oy); ctx.lineTo(ox + len - 8, oy - 4);
    ctx.moveTo(ox + len, oy); ctx.lineTo(ox + len - 8, oy + 4);
    ctx.stroke();
    // Axis labels
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = `rgba(${CYAN},0.22)`;
    ctx.fillText('x', ox + len + 8, oy + 4);
    ctx.fillText('y', ox - 10, oy - len * 0.7 - 6);
  }

  /* ── Regression line (animated) ── */
  let regProgress = 0;
  function drawRegression(pts, ox, oy) {
    if (!pts.length) return;
    // Simple linear regression on normalised coords
    const n = pts.length;
    let sx = 0, sy = 0, sxy = 0, sxx = 0;
    pts.forEach(p => {
      const nx = p.x - ox, ny = -(p.y - oy);
      sx += nx; sy += ny; sxy += nx * ny; sxx += nx * nx;
    });
    const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx) || 0;
    const inter = (sy - slope * sx) / n;
    const x1 = -30, y1 = slope * x1 + inter;
    const x2 = 220, y2 = slope * x2 + inter;

    // Animated draw
    regProgress = Math.min(regProgress + 0.006, 1);
    const ex = x1 + (x2 - x1) * regProgress;
    const ey = y1 + (y2 - y1) * regProgress;

    const grad = ctx.createLinearGradient(ox + x1, oy - y1, ox + ex, oy - ey);
    grad.addColorStop(0, `rgba(${VIOLET},0)`);
    grad.addColorStop(0.4, `rgba(${VIOLET},0.55)`);
    grad.addColorStop(1, `rgba(${CYAN},0.75)`);

    ctx.beginPath();
    ctx.moveTo(ox + x1, oy - y1);
    ctx.lineTo(ox + ex, oy - ey);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ŷ label at end
    if (regProgress > 0.9) {
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillStyle = `rgba(${CYAN},0.5)`;
      ctx.fillText('ŷ = β₀ + β₁x', ox + ex + 6, oy - ey);
    }
  }

  /* ── Connection lines between close particles ── */
  function drawConnections() {
    const maxDist = 110;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.1;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${CYAN},${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  /* ── Build scene ── */
  function buildScene() {
    // Scatter plot around bottom-right quadrant
    dataPoints = [];
    const ox = W * 0.62, oy = H * 0.72, spread = 180;
    for (let i = 0; i < 22; i++) {
      const t  = (i / 21);
      const nx = t * spread;
      const ny = t * spread * 0.55 + (Math.random() - 0.5) * 45;
      dataPoints.push(new DataPoint(ox + nx, oy - ny));
    }
    // Particles
    const count = Math.min(55, Math.floor(W * H / 14000));
    particles = Array.from({ length: count }, () => new Particle());
  }

  buildScene();

  /* ── Animation loop ── */
  function tick() {
    ctx.clearRect(0, 0, W, H);

    drawGrid();

    // Connections
    drawConnections();

    // Particles
    particles.forEach(p => { p.update(); p.draw(); });

    // Axes + scatter + regression (bottom-right)
    const ox = W * 0.62, oy = H * 0.72;
    drawAxes(ox, oy, 240);
    dataPoints.forEach(p => { p.update(); p.draw(); });
    drawRegression(dataPoints, ox, oy);

    // Euler identity arc (top-left atmospheric)
    const t = Date.now() / 1000;
    ctx.save();
    ctx.translate(W * 0.12, H * 0.35);
    ctx.strokeStyle = `rgba(${VIOLET},0.12)`;
    ctx.lineWidth = 1;
    const r = 40;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    // Rotating point on circle (e^iθ)
    const angle = t * 0.6;
    const px = r * Math.cos(angle), py = r * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(px, py);
    ctx.strokeStyle = `rgba(${CYAN},0.3)`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${CYAN},0.5)`;
    ctx.fill();
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = `rgba(${CYAN},0.28)`;
    ctx.fillText('e^(iθ)', r + 8, 4);
    ctx.restore();

    animId = requestAnimationFrame(tick);
  }

  tick();
})();

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

/* ─── Smooth CTA form interaction ──────────────────────── */
(function initForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn  = form.querySelector('button[type="submit"]');
    const orig = btn.innerHTML;
    btn.innerHTML = '<span>Message sent ✓</span>';
    btn.style.background = 'var(--green)';
    btn.style.color      = 'var(--bg)';
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.style.background = '';
      btn.style.color      = '';
      form.reset();
    }, 3000);
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
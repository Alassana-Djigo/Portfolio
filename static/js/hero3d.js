/* =========================================================
   HERO 3D — Atrator de Lorenz (Three.js) + timeline (GSAP)
   Matemática: sistema de EDOs integrado com Runge-Kutta 4.
   Física: convecção atmosférica (Lorenz, 1963) — caos determinista.
   Se o WebGL falhar ou as libs não carregarem, o hero continua
   a funcionar só com o gradiente CSS.
   ========================================================= */
(function () {
  'use strict';

  var canvas = document.getElementById('heroCanvas');
  var hero = document.getElementById('hero');
  if (!canvas || !hero || typeof THREE === 'undefined') return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia('(max-width: 768px)').matches;
  var hasGsap = typeof gsap !== 'undefined';

  /* ── 1. Matemática: dx/dt = σ(y−x), dy/dt = x(ρ−z)−y, dz/dt = xy−βz ── */
  var SIGMA = 10, RHO = 28, BETA = 8 / 3;
  var DT = 0.006;
  var N = isMobile ? 5000 : 12000;

  function deriv(x, y, z) {
    return [SIGMA * (y - x), x * (RHO - z) - y, x * y - BETA * z];
  }

  function rk4(x, y, z) {
    var k1 = deriv(x, y, z);
    var k2 = deriv(x + k1[0] * DT / 2, y + k1[1] * DT / 2, z + k1[2] * DT / 2);
    var k3 = deriv(x + k2[0] * DT / 2, y + k2[1] * DT / 2, z + k2[2] * DT / 2);
    var k4 = deriv(x + k3[0] * DT, y + k3[1] * DT, z + k3[2] * DT);
    return [
      x + (DT / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
      y + (DT / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
      z + (DT / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2])
    ];
  }

  function buildTrajectory(n) {
    var pos = new Float32Array(n * 3);
    var col = new Float32Array(n * 3);
    var p = [0.1, 0, 0], i;
    for (i = 0; i < 500; i++) p = rk4(p[0], p[1], p[2]);   // descarta o transiente
    for (i = 0; i < n; i++) {
      p = rk4(p[0], p[1], p[2]);
      pos[i * 3] = p[0];
      pos[i * 3 + 1] = p[1];
      pos[i * 3 + 2] = p[2] - 25;                           // centra o atractor
      var t = i / n;                                         // ciano → violeta
      col[i * 3] = 0.0 + 0.55 * t;
      col[i * 3 + 1] = 0.9 - 0.55 * t;
      col[i * 3 + 2] = 1.0 - 0.04 * t;
    }
    return { pos: pos, col: col };
  }

  /* ── 2. Cena Three.js ── */
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas, alpha: true, antialias: !isMobile, powerPreference: 'low-power'
    });
  } catch (err) {
    return;                                                  // sem WebGL: fica o gradiente
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
  camera.position.set(0, 0, 78);
  var group = new THREE.Group();
  scene.add(group);

  var traj = buildTrajectory(N);
  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(traj.pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(traj.col, 3));
  geo.setDrawRange(0, 2);
  group.add(new THREE.Line(geo, new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false
  })));

  function glowTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var g = c.getContext('2d');
    var grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.25, 'rgba(0,229,255,0.8)');
    grad.addColorStop(1, 'rgba(0,229,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  var headPos = new Float32Array(3);
  var headGeo = new THREE.BufferGeometry();
  headGeo.setAttribute('position', new THREE.BufferAttribute(headPos, 3));
  var head = new THREE.Points(headGeo, new THREE.PointsMaterial({
    size: 3.4, map: glowTexture(), transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, sizeAttenuation: true
  }));
  head.frustumCulled = false;
  head.visible = !reduceMotion;
  group.add(head);

  /* ── 3. Layout: atractor à direita em ecrãs largos ── */
  function resize() {
    var w = hero.clientWidth, h = hero.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);                           // o CSS controla o tamanho
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    var wide = w > 900 && w / h > 1.15;
    group.position.x = wide ? 30 : 0;
    group.scale.setScalar(w / h < 1 ? 0.7 : 1);
    if (reduceMotion) draw();
  }

  /* ── 4. Estado e animação ── */
  var state = { draw: reduceMotion ? N : 2 };
  var tx = 0, ty = 0, mx = 0, my = 0, autoRot = 0, headIdx = 0;
  var last = performance.now(), raf = 0, running = false;

  function applyDraw() {
    geo.setDrawRange(0, Math.max(2, Math.floor(state.draw)));
  }

  function draw() {
    applyDraw();
    group.rotation.set(0.25, 0.6, 0);
    renderer.render(scene, camera);
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    autoRot += dt * 0.12;
    mx += (tx - mx) * 0.06;
    my += (ty - my) * 0.06;
    group.rotation.y = autoRot + mx * 0.35;
    group.rotation.x = 0.25 + my * 0.2;

    var drawn = Math.max(2, Math.floor(state.draw));
    headIdx = (headIdx + dt * 600) % drawn;
    var k = Math.floor(headIdx) * 3;
    headPos[0] = traj.pos[k]; headPos[1] = traj.pos[k + 1]; headPos[2] = traj.pos[k + 2];
    headGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }

  function start() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { running = false; cancelAnimationFrame(raf); }

  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(hero);
  else window.addEventListener('resize', resize);

  if (reduceMotion) return;                                  // um único frame estático

  hero.addEventListener('pointermove', function (e) {
    var r = hero.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    ty = ((e.clientY - r.top) / r.height) * 2 - 1;
  }, { passive: true });

  // só gasta GPU enquanto o hero está visível
  new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) start(); else stop();
  }, { threshold: 0.05 }).observe(hero);

  /* ── 5. Timeline GSAP: o atractor "desenha-se" e a câmara aproxima-se ── */
  if (hasGsap) {
    canvas.style.opacity = 0;
    camera.position.z = 105;
    var tl = gsap.timeline({ delay: 0.2 });
    tl.to(canvas, { opacity: 0.85, duration: 1.2, ease: 'power1.out' }, 0)
      .to(camera.position, { z: 78, duration: 5, ease: 'power2.out' }, 0)
      .to(state, { draw: N, duration: 6, ease: 'power1.inOut', onUpdate: applyDraw }, 0)
      .fromTo('.hero__eq', { opacity: 0 }, { opacity: 0.6, duration: 1, ease: 'power1.out' }, 1.5);
  } else {
    state.draw = N;
    applyDraw();
  }
})();

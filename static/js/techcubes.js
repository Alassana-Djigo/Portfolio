/* =========================================================
   CUBOS DE TECNOLOGIA 3D — secção About
   Um cubo central </> ligado às tecnologias por linhas com
   pulsos de dados. Tudo flutua; passar o rato (ou tocar) num
   cubo mostra uma nota. Pausa quando está fora do ecrã.

   As tecnologias vêm do HTML (lista .tech-list em about.html):
   para acrescentar ou retirar um cubo basta editar essa lista.
   Logótipos: Simple Icons (CC0), carregados de tech-icons.js.
   ========================================================= */
(function () {
  'use strict';

  var host = document.getElementById('techScene');
  var canvas = document.getElementById('techCanvas');
  var tip = document.getElementById('techTip');
  if (!host || !canvas || !tip || typeof THREE === 'undefined') return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ICONS = window.TECH_ICONS || {};
  var CENTER = { name: 'Backend engineering', role: 'Where the whole stack comes together.', color: '#00E5FF' };

  /* ── 1. Dados: lidos da lista do HTML (única fonte de verdade) ── */
  var techs = [];
  Array.prototype.forEach.call(host.querySelectorAll('.tech-list li'), function (li) {
    var strong = li.querySelector('strong');
    var span = li.querySelector('span');
    techs.push({
      key: li.getAttribute('data-key'),
      color: li.getAttribute('data-color') || '#00E5FF',
      name: strong ? strong.textContent : '',
      role: span ? span.textContent : ''
    });
  });
  if (!techs.length) return;

  /* ── 2. Renderer ── */
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch (err) {
    return;                                   // sem WebGL: fica a lista de tecnologias em HTML
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  var maxAniso = Math.min(4, renderer.capabilities.getMaxAnisotropy());

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(40, 1.25, 0.1, 100);
  camera.position.set(0, 0, 10.5);
  var world = new THREE.Group();
  scene.add(world);

  /* ── 3. Texturas (desenhadas em canvas 2D) ── */
  function rgba(hex, a) {
    var n = parseInt(hex.replace('#', ''), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function glowTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 128;
    var g = c.getContext('2d');
    var grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.35)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }
  var glowTex = glowTexture();

  function drawIcon(key, label) {
    return function (g, S) {
      var d = ICONS[key];
      if (d && typeof Path2D !== 'undefined') {
        g.translate(S * 0.2, S * 0.2);
        g.scale((S * 0.6) / 24, (S * 0.6) / 24);
        g.fill(new Path2D(d));
      } else {                                // sem logótipo: iniciais
        g.font = 'bold 84px monospace';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(label.slice(0, 2), S / 2, S / 2);
      }
    };
  }

  function drawCode(g) {                      // o símbolo </>
    g.lineWidth = 15;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath(); g.moveTo(92, 88); g.lineTo(46, 128); g.lineTo(92, 168); g.stroke();
    g.beginPath(); g.moveTo(164, 88); g.lineTo(210, 128); g.lineTo(164, 168); g.stroke();
    g.beginPath(); g.moveTo(140, 80); g.lineTo(116, 176); g.stroke();
  }

  function faceTexture(draw, accent) {
    var S = 256;
    var c = document.createElement('canvas');
    c.width = c.height = S;
    var g = c.getContext('2d');
    var bg = g.createLinearGradient(0, 0, 0, S);
    bg.addColorStop(0, 'rgba(10,38,58,0.82)');
    bg.addColorStop(1, 'rgba(3,12,22,0.9)');
    g.fillStyle = bg;
    g.fillRect(0, 0, S, S);
    var rg = g.createRadialGradient(S / 2, S / 2, 10, S / 2, S / 2, S * 0.62);
    rg.addColorStop(0, rgba(accent, 0.28));
    rg.addColorStop(1, rgba(accent, 0));
    g.fillStyle = rg;
    g.fillRect(0, 0, S, S);
    g.lineWidth = 6;
    g.strokeStyle = rgba(accent, 0.55);
    g.strokeRect(3, 3, S - 6, S - 6);
    g.save();
    g.shadowColor = accent;
    g.shadowBlur = 22;
    g.fillStyle = accent;
    g.strokeStyle = accent;
    draw(g, S);
    g.restore();
    var tex = new THREE.CanvasTexture(c);
    tex.anisotropy = maxAniso;
    return tex;
  }

  /* ── 4. Cubos: corpo de "vidro" + arestas luminosas + halo ── */
  function makeCube(size, accent, draw) {
    var holder = new THREE.Group();
    var geo = new THREE.BoxGeometry(size, size, size);
    var body = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      map: faceTexture(draw, accent), transparent: true, opacity: 0.96, depthWrite: false
    }));
    var edgeMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(accent), transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    body.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));
    var glowMat = new THREE.SpriteMaterial({
      map: glowTex, color: new THREE.Color(accent), transparent: true, opacity: 0.32,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    var glow = new THREE.Sprite(glowMat);
    glow.scale.setScalar(size * 3.4);
    holder.add(glow);
    holder.add(body);
    world.add(holder);
    return { holder: holder, body: body, edgeMat: edgeMat, glowMat: glowMat, size: size, focus: 0, dim: 0 };
  }

  var items = [];                             // items[0] = cubo central
  var centerItem = makeCube(1.9, CENTER.color, drawCode);
  centerItem.name = CENTER.name;
  centerItem.role = CENTER.role;
  centerItem.color = CENTER.color;
  centerItem.base = new THREE.Vector3(0, 0, 0);
  centerItem.phase = 0;
  centerItem.speed = 0.7;
  items.push(centerItem);

  var RX = 3.9, RY = 2.5;
  techs.forEach(function (t, i) {
    var it = makeCube(1.1, t.color, drawIcon(t.key, t.name));
    var a = -Math.PI / 2 + (i / techs.length) * Math.PI * 2 + 0.3;
    it.name = t.name;
    it.role = t.role;
    it.color = t.color;
    it.base = new THREE.Vector3(Math.cos(a) * RX, Math.sin(a) * RY, Math.sin(a * 2 + 1) * 1.1);
    it.phase = i * 1.7;
    it.speed = 0.6 + 0.12 * (i % 3);
    items.push(it);
  });
  items.forEach(function (it, i) { it.body.userData.index = i; });
  var bodies = items.map(function (it) { return it.body; });

  /* ── 5. Linhas centro → tecnologia, e pulsos de dados ── */
  var lines = [];
  techs.forEach(function (t, i) {
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    var c0 = new THREE.Color(CENTER.color), c1 = new THREE.Color(t.color);
    geo.setAttribute('color', new THREE.BufferAttribute(
      new Float32Array([c0.r, c0.g, c0.b, c1.r, c1.g, c1.b]), 3));
    var mat = new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.4,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    var line = new THREE.Line(geo, mat);
    line.frustumCulled = false;
    world.add(line);
    lines.push({ line: line, mat: mat, to: items[i + 1] });
  });

  var PULSES = lines.length * 2;
  var pulsePos = new Float32Array(PULSES * 3);
  var pulseCol = new Float32Array(PULSES * 3);
  for (var k = 0; k < PULSES; k++) {
    var pc = new THREE.Color(techs[k >> 1].color);
    pulseCol[k * 3] = pc.r; pulseCol[k * 3 + 1] = pc.g; pulseCol[k * 3 + 2] = pc.b;
  }
  var pulseGeo = new THREE.BufferGeometry();
  pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3));
  pulseGeo.setAttribute('color', new THREE.BufferAttribute(pulseCol, 3));
  var pulses = new THREE.Points(pulseGeo, new THREE.PointsMaterial({
    size: 0.42, map: glowTex, vertexColors: true, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, sizeAttenuation: true
  }));
  pulses.frustumCulled = false;
  world.add(pulses);

  /* ── 6. Tooltip ── */
  var tipName = tip.querySelector('.tech-tip__name');
  var tipText = tip.querySelector('.tech-tip__text');
  var tipFor = -1;
  var vec = new THREE.Vector3();
  var camFov = Math.tan((camera.fov * Math.PI) / 360);
  var W = 1, H = 1;

  function placeTip(i) {
    var it = items[i];
    if (tipFor !== i) {
      tipName.textContent = it.name;
      tipText.textContent = it.role;
      tip.style.setProperty('--tip', it.color);
      tipFor = i;
    }
    vec.setFromMatrixPosition(it.holder.matrixWorld);
    var dist = camera.position.distanceTo(vec);
    var pxPerUnit = H / (2 * dist * camFov);
    vec.project(camera);
    var px = (vec.x * 0.5 + 0.5) * W;
    var py = (-vec.y * 0.5 + 0.5) * H;
    var r = it.size * it.holder.scale.x * 0.8 * pxPerUnit;
    var tw = (tip.offsetWidth || 220) / 2 + 6;
    px = Math.max(tw, Math.min(W - tw, px));
    var below = py - r - (tip.offsetHeight || 70) - 12 < 4;
    tip.classList.toggle('tech-tip--below', below);
    tip.style.left = px.toFixed(1) + 'px';
    tip.style.top = (below ? py + r + 12 : py - r - 12).toFixed(1) + 'px';
    tip.classList.add('is-on');
  }

  function hideTip() {
    tip.classList.remove('is-on');
    tipFor = -1;
  }

  /* ── 7. Interação: hover (rato) e toque ── */
  var raycaster = new THREE.Raycaster();
  var ndc = new THREE.Vector2(9, 9);
  var pointerInside = false;
  var hover = -1;
  var pinned = false;
  var mx = 0, my = 0;

  function setPointer(e) {
    var r = canvas.getBoundingClientRect();
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  }

  function pick() {
    if (!pointerInside) return -1;
    camera.updateMatrixWorld();                 // a câmara pode ter mudado desde o último frame
    raycaster.setFromCamera(ndc, camera);
    var hit = raycaster.intersectObjects(bodies, false)[0];
    return hit ? hit.object.userData.index : -1;
  }

  canvas.addEventListener('pointermove', function (e) {
    pointerInside = true;
    setPointer(e);
    if (reduceMotion) refreshStatic();
  }, { passive: true });

  canvas.addEventListener('pointerleave', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;   // no toque a nota fica fixa
    pointerInside = false;
    if (!pinned) hover = -1;
    if (reduceMotion) refreshStatic();
  }, { passive: true });

  canvas.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse') return;
    pointerInside = true;
    setPointer(e);
    scene.updateMatrixWorld(true);
    var h = pick();
    if (h === -1 || (pinned && h === hover)) { pinned = false; hover = -1; }
    else { pinned = true; hover = h; }
    if (reduceMotion) refreshStatic();
  }, { passive: true });

  /* ── 8. Atualização por frame ── */
  var autoT = 0;

  function update(dt, t, instant) {
    // 8.1 rato → inclinação suave do conjunto
    // (com um cubo em foco a inclinação pára, senão o cubo fugia de debaixo do rato)
    var frozen = hover !== -1;
    var tx = frozen ? mx : (pointerInside ? ndc.x : 0);
    var ty = frozen ? my : (pointerInside ? ndc.y : 0);
    var follow = instant ? 1 : Math.min(1, dt * 3);
    mx += (tx - mx) * follow;
    my += (ty - my) * follow;
    world.rotation.y = Math.sin(t * 0.22) * 0.3 + mx * 0.16;
    world.rotation.x = Math.sin(t * 0.17) * 0.1 - my * 0.1;

    // 8.2 hover
    if (!pinned) hover = pick();
    canvas.style.cursor = hover >= 0 ? 'pointer' : 'default';

    // 8.3 cubos a flutuar
    items.forEach(function (it, i) {
      var f = instant ? 1 : Math.min(1, dt * 8);
      it.focus += ((hover === i ? 1 : 0) - it.focus) * f;
      it.dim += (((hover !== -1 && hover !== i) ? 1 : 0) - it.dim) * (instant ? 1 : Math.min(1, dt * 6));

      var s = t * it.speed + it.phase;
      var amp = i === 0 ? 0.12 : 1;
      it.holder.position.set(
        it.base.x + Math.sin(s) * 0.24 * amp,
        it.base.y + Math.cos(s * 0.8 + it.phase * 1.3) * 0.3 * amp,
        it.base.z + Math.sin(s * 0.6 + it.phase * 0.7) * 0.22 * amp
      );
      it.holder.scale.setScalar((1 + 0.22 * it.focus) * (1 + (i === 0 ? Math.sin(t * 1.2) * 0.03 : 0)));

      var calm = 1 - 0.85 * it.focus;           // o cubo em foco aponta a face à câmara
      if (i === 0) {
        it.body.rotation.y = t * 0.4 * calm + 0.5;
        it.body.rotation.x = 0.45 + Math.sin(t * 0.5) * 0.15 * calm;
      } else {
        it.body.rotation.y = 0.3 + Math.sin(t * 0.5 + it.phase) * 0.55 * calm;
        it.body.rotation.x = 0.2 * calm + Math.sin(t * 0.4 + it.phase * 1.3) * 0.28 * calm;
      }

      it.edgeMat.opacity = Math.max(0.2, 0.85 + 0.15 * it.focus - 0.35 * it.dim);
      it.glowMat.opacity = Math.max(0.05, 0.32 + 0.4 * it.focus - 0.18 * it.dim);
    });

    // 8.4 linhas e pulsos de dados
    var c = items[0].holder.position;
    lines.forEach(function (l, i) {
      var p = l.to.holder.position;
      var arr = l.line.geometry.attributes.position.array;
      arr[0] = c.x; arr[1] = c.y; arr[2] = c.z;
      arr[3] = p.x; arr[4] = p.y; arr[5] = p.z;
      l.line.geometry.attributes.position.needsUpdate = true;
      l.mat.opacity = Math.max(0.08, Math.min(1,
        0.4 + 0.5 * l.to.focus + 0.25 * items[0].focus - 0.2 * l.to.dim));
    });
    for (var k = 0; k < PULSES; k++) {
      var li = k >> 1;
      var p2 = lines[li].to.holder.position;
      var u = ((k * 0.37) + t * (0.16 + 0.05 * (li % 3))) % 1;
      if (k & 1) u = 1 - u;                      // metade vai ao centro, metade volta
      pulsePos[k * 3] = c.x + (p2.x - c.x) * u;
      pulsePos[k * 3 + 1] = c.y + (p2.y - c.y) * u;
      pulsePos[k * 3 + 2] = c.z + (p2.z - c.z) * u;
    }
    pulseGeo.attributes.position.needsUpdate = true;
  }

  function draw() {
    renderer.render(scene, camera);             // atualiza matrixWorld
    if (hover >= 0) placeTip(hover); else hideTip();
  }

  /* ── 9. Tamanho e ciclo de animação ── */
  function resize() {
    var w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    W = w; H = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = Math.max(10.8, 5.5 / (camFov * camera.aspect));  // cabe em qualquer proporção
    camera.updateProjectionMatrix();
    if (reduceMotion) refreshStatic();
  }

  function refreshStatic() {                    // modo sem movimento: um frame por interação
    scene.updateMatrixWorld(true);
    update(0, 0, true);
    draw();
  }

  host.classList.add('is-3d');
  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(host);
  else window.addEventListener('resize', resize);

  if (reduceMotion) { refreshStatic(); return; }

  var raf = 0, running = false, last = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    var dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
    last = now;
    autoT += dt;
    update(dt, autoT, false);
    draw();
  }
  function start() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { running = false; cancelAnimationFrame(raf); }

  new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) start(); else stop();
  }, { threshold: 0.05 }).observe(host);
})();

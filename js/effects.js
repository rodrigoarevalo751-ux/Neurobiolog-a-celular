/* ===== NeuroLab · effects.js =====
   Capa visual añadida: aparición por scroll, foco de luz en tarjetas,
   red neuronal de fondo y visor 3D (Three.js). No toca la lógica de script.js. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => document.querySelector(s);
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  /* 1. Aparición suave al hacer scroll */
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in'); io.unobserve(e.target);
      setTimeout(() => e.target.classList.remove('reveal', 'in'), 1300); // libera el transform para el hover
    }), { threshold: 0.1 });
    document.querySelectorAll('.view > *:not(.end), .cols3 > div, .care > div > div, .toc li, .glossary > div').forEach(el => {
      el.style.setProperty('--d', (Array.from(el.parentNode.children).indexOf(el) % 4) * 0.08 + 's');
      el.classList.add('reveal'); io.observe(el);
    });
  }

  /* 2. Foco de luz que sigue al cursor sobre las tarjetas */
  document.addEventListener('pointermove', e => {
    const c = e.target.closest && e.target.closest('.plate,.info,.cols3>div,.care>div>div,.toc li,.glossary>div');
    if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', e.clientX - r.left + 'px'); c.style.setProperty('--my', e.clientY - r.top + 'px');
  }, { passive: true });

  /* 3. Red neuronal de fondo (partículas conectadas) */
  const bg = $('#bgNet');
  if (bg) {
    const x = bg.getContext('2d'); let w, h, P = [];
    const size = () => {
      const d = Math.min(devicePixelRatio || 1, 1.5); w = bg.width = innerWidth * d; h = bg.height = innerHeight * d;
      P = Array.from({ length: Math.round(Math.min(70, innerWidth / 16)) }, () => ({
        x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .3 * d, vy: (Math.random() - .5) * .3 * d }));
    };
    const draw = () => {
      x.clearRect(0, 0, w, h); const L = 160 * (w / innerWidth), col = css('--cyan'); x.fillStyle = x.strokeStyle = col;
      P.forEach((p, i) => {
        if (!reduce) { p.x = (p.x + p.vx + w) % w; p.y = (p.y + p.vy + h) % h; }
        x.globalAlpha = .7; x.beginPath(); x.arc(p.x, p.y, 1.6, 0, 6.3); x.fill();
        for (let j = i + 1; j < P.length; j++) {
          const d = Math.hypot(p.x - P[j].x, p.y - P[j].y);
          if (d < L) { x.globalAlpha = (1 - d / L) * .45; x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(P[j].x, P[j].y); x.stroke(); }
        }
      });
      if (!reduce && !document.hidden) requestAnimationFrame(draw);
    };
    size(); draw();
    addEventListener('resize', () => { size(); if (reduce) draw(); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && !reduce) draw(); });
  }

  /* 4. Visor 3D: red neuronal que se gira con el cursor, el dedo o el teclado */
  const box = $('#neuro3d');
  if (!box) return;
  const T = window.THREE; let ren;
  try { ren = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { ren = null; }
  if (!ren) { box.insertAdjacentHTML('beforeend', '<p style="padding:1rem">La vista 3D requiere conexión a internet y WebGL.</p>'); return; }

  ren.setPixelRatio(Math.min(devicePixelRatio, 1.75)); box.appendChild(ren.domElement);
  const scene = new T.Scene(), cam = new T.PerspectiveCamera(45, 1, .1, 100), g = new T.Group();
  cam.position.z = 7.5; scene.add(g);

  // Nodos distribuidos en un volumen elipsoidal (silueta de cerebro)
  const pts = [], cols = [0xa99bee, 0x86d3e4, 0x8aa4f2];
  while (pts.length < 75) {
    const p = new T.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
    if (p.lengthSq() <= 1) pts.push(p.multiply(new T.Vector3(2.6, 1.8, 2.1)));
  }
  const gBig = new T.SphereGeometry(.11, 14, 14), gSm = new T.SphereGeometry(.055, 10, 10);
  pts.forEach((p, i) => {
    const m = new T.Mesh(i % 9 === 0 ? gBig : gSm, new T.MeshBasicMaterial({ color: cols[i % 3], transparent: true, opacity: .9 }));
    m.position.copy(p); g.add(m);
  });

  // Conexiones: cada nodo con sus 3 vecinos más cercanos
  const edges = [], seen = new Set(), arr = [];
  pts.forEach((p, i) => {
    pts.map((q, j) => [j, p.distanceToSquared(q)]).filter(a => a[0] !== i).sort((a, b) => a[1] - b[1]).slice(0, 3).forEach(([j]) => {
      const k = Math.min(i, j) + '-' + Math.max(i, j); if (seen.has(k)) return; seen.add(k);
      edges.push([pts[i], pts[j]]); arr.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z);
    });
  });
  const lg = new T.BufferGeometry(); lg.setAttribute('position', new T.Float32BufferAttribute(arr, 3));
  g.add(new T.LineSegments(lg, new T.LineBasicMaterial({ color: 0x8aa4f2, transparent: true, opacity: .3 })));

  // Pulsos: destellos suaves que recorren las conexiones
  const pg = new T.SphereGeometry(.075, 10, 10), pulses = Array.from({ length: 10 }, () => {
    const m = new T.Mesh(pg, new T.MeshBasicMaterial({ color: 0x9fe3d6 })); g.add(m);
    return { m, e: edges[Math.random() * edges.length | 0], t: Math.random(), s: .008 + Math.random() * .01 };
  });

  // Rotación con arrastre, inercia y teclado
  const rot = { x: .25, y: 0 }; let vel = 0, drag = false, lx = 0, ly = 0, run = false;
  const el = ren.domElement;
  el.addEventListener('pointerdown', e => { drag = true; lx = e.clientX; ly = e.clientY; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', e => {
    if (!drag) return;
    vel = (e.clientX - lx) * .005; rot.y += vel; rot.x = Math.max(-1, Math.min(1, rot.x + (e.clientY - ly) * .005)); lx = e.clientX; ly = e.clientY;
  });
  ['pointerup', 'pointercancel'].forEach(t => el.addEventListener(t, () => drag = false));
  box.addEventListener('keydown', e => {
    const k = { ArrowLeft: [-.15, 0], ArrowRight: [.15, 0], ArrowUp: [0, -.15], ArrowDown: [0, .15] }[e.key];
    if (k) { e.preventDefault(); rot.y += k[0]; rot.x = Math.max(-1, Math.min(1, rot.x + k[1])); }
  });

  const resize = () => { const w = box.clientWidth, h = box.clientHeight; if (!w || !h) return; ren.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(box); resize();

  const loop = () => {
    if (!run || document.hidden) { run = false; return; }
    if (!drag) { vel *= .95; rot.y += vel + (reduce ? 0 : .0018); }
    g.rotation.set(rot.x, rot.y, 0);
    if (!reduce) pulses.forEach(p => {
      p.t += p.s; if (p.t >= 1) { p.t = 0; p.e = edges[Math.random() * edges.length | 0]; }
      p.m.position.lerpVectors(p.e[0], p.e[1], p.t);
    });
    ren.render(scene, cam); requestAnimationFrame(loop);
  };
  // Solo se anima mientras el visor está visible (ahorra batería)
  new IntersectionObserver(es => { const v = es[0].isIntersecting; if (v && !run) { run = true; loop(); } if (!v) run = false; }).observe(box);
})();

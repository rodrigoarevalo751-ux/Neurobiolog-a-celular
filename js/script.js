/* NeuroLab · script principal
   1 Navegación · 2 Tema · 3 Neurona interactiva · 4 Potencial de acción
   5 Sinapsis · 6 Neurotransmisores · 7 Juego "Construye la Neurona"
   8 Evaluación (Google Forms) · 9 Glosario */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* 1. NAVEGACIÓN */
function showView(id){
  $$('.view').forEach(v => v.classList.toggle('active-view', v.id === id));
  $$('.main-menu button').forEach(b => b.classList.toggle('active', b.dataset.view === id));
  window.scrollTo({top:0, behavior:'smooth'});
}
$$('[data-view]').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));

/* 2. TEMA */
const themeBtn = $('#themeBtn');
themeBtn.addEventListener('click', () => {
  const root = document.documentElement;
  const dark = root.dataset.theme === 'dark';
  root.dataset.theme = dark ? 'light' : 'dark';
  themeBtn.textContent = dark ? 'Tema oscuro' : 'Tema claro';
});

/* 3. NEURONA INTERACTIVA */
const parts = {
  dendritas:['Dendritas','Ramificaciones que reciben señales de otras neuronas. Poseen receptores que permiten captar información.'],
  soma:['Cuerpo celular (soma)','Contiene el núcleo y los orgánulos. Integra las señales recibidas por la neurona.'],
  nucleo:['Núcleo','Contiene el ADN y controla gran parte de las actividades de la célula.'],
  axon:['Axón','Prolongación que conduce el potencial de acción desde el soma hacia las terminales.'],
  mielina:['Vaina de mielina','Capa aislante que rodea muchos axones y permite que el impulso viaje mucho más rápidamente.'],
  terminales:['Terminales axónicas','Extremos del axón donde se liberan neurotransmisores para comunicarse con otra célula.']
};
function showPart(key){
  $$('.part').forEach(p => p.classList.toggle('active', p.dataset.part === key));
  $('#partInfo').innerHTML = `<h3>${parts[key][0]}</h3><p>${parts[key][1]}</p>`;
}
$$('.part').forEach(p => {
  p.addEventListener('click', () => showPart(p.dataset.part));
  p.addEventListener('keydown', e => {
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); showPart(p.dataset.part); }
  });
});
showPart('soma');

/* 4. POTENCIAL DE ACCIÓN */
const cv = $('#apCanvas'), ctx = cv.getContext('2d');
const stim = $('#stim'), THRESH = -55;
stim.addEventListener('input', () => $('#stimOut').textContent = `${stim.value} mV`);
const X = t => 50 + (t / 7) * (cv.width - 70);
const Y = v => 20 + ((50 - v) / 130) * (cv.height - 50);

function drawAxes(){
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#93a0b8';
  ctx.strokeStyle = '#8a97ae44';
  [-70, 0, 30].forEach(v => {
    ctx.beginPath(); ctx.moveTo(50, Y(v)); ctx.lineTo(cv.width - 10, Y(v)); ctx.stroke();
    ctx.fillText(v, 8, Y(v) + 4);
  });
  ctx.setLineDash([6, 5]);
  ctx.strokeStyle = '#4fd1ff';
  ctx.beginPath(); ctx.moveTo(50, Y(THRESH)); ctx.lineTo(cv.width - 10, Y(THRESH)); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#4fd1ff';
  ctx.fillText('umbral −55 mV', cv.width - 110, Y(THRESH) - 6);
}
const keyframes = s => s >= THRESH
  ? [[0,-70],[1,-70],[1.8,-55],[2.2,35],[3.2,-80],[4.5,-72],[7,-70]]
  : [[0,-70],[1,-70],[1.8,s],[3.5,-70],[7,-70]];

function voltageAt(k, t){
  for(let i = 0; i < k.length - 1; i++){
    if(t >= k[i][0] && t <= k[i+1][0]){
      const f = (t - k[i][0]) / (k[i+1][0] - k[i][0]);
      return k[i][1] + (k[i+1][1] - k[i][1]) * (1 - Math.cos(f * Math.PI)) / 2;
    }
  }
  return -70;
}
function fire(){
  const s = +stim.value, k = keyframes(s);
  let t = 0;
  $('#apMsg').textContent = s >= THRESH
    ? 'Superó el umbral: se produjo un potencial de acción.'
    : 'No llegó al umbral: no se produjo un disparo.';
  (function step(){
    drawAxes();
    ctx.strokeStyle = '#ffb347';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for(let x = 0; x <= t; x += .05){
      const px = X(x), py = Y(voltageAt(k, x));
      x === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.lineWidth = 1;
    t += .06;
    if(t <= 7) requestAnimationFrame(step);
  })();
}
$('#fireBtn').addEventListener('click', fire);
drawAxes();

/* 5. SINAPSIS */
const synSteps = [
  'El potencial de acción llega al terminal presináptico.',
  'La despolarización abre canales de calcio y entra Ca²⁺.',
  'El calcio provoca la fusión de las vesículas con la membrana.',
  'Los neurotransmisores se liberan en la hendidura sináptica.',
  'Los neurotransmisores se unen a receptores de la siguiente neurona.',
  'La señal termina mediante recaptación o degradación.'
];
let synI = -1;
$('#synBtn').addEventListener('click', () => {
  synI = (synI + 1) % synSteps.length;
  $('#synText').innerHTML = `<strong>Paso ${synI + 1} de ${synSteps.length}</strong><p>${synSteps[synI]}</p>`;
  const vs = $$('#vesicles circle'), nts = $('#nts'), rec = $('#receptors');
  if(synI === 0){
    nts.innerHTML = ''; rec.classList.remove('on');
    vs.forEach(v => { v.setAttribute('cy', 70); v.setAttribute('opacity', 1); });
  }
  if(synI === 2) vs.forEach(v => v.setAttribute('cy', 92));
  if(synI === 3){
    vs.forEach(v => v.setAttribute('opacity', .25));
    nts.innerHTML = '';
    [200, 300, 400, 500].forEach(cx => {
      for(let j = 0; j < 2; j++){
        nts.insertAdjacentHTML('beforeend', `<circle cx="${cx + j*14 - 7}" cy="95" r="4"></circle>`);
      }
    });
    setTimeout(() => $$('#nts circle').forEach(c => c.setAttribute('cy', 122)), 50);
  }
  if(synI === 4) rec.classList.add('on');
  if(synI === 5){ nts.innerHTML = ''; vs.forEach(v => v.setAttribute('opacity', 1)); }
});
$('#synBtn').click();

/* 6. NEUROTRANSMISORES */
const nt = {
  Glutamato:'Principal neurotransmisor excitador del cerebro. Participa en aprendizaje y memoria.',
  GABA:'Principal neurotransmisor inhibidor. Reduce la probabilidad de que una neurona dispare.',
  Dopamina:'Participa en movimiento, motivación y recompensa.',
  Serotonina:'Participa en la regulación del estado de ánimo, sueño y apetito.',
  Acetilcolina:'Participa en la contracción muscular, atención y memoria.'
};
Object.keys(nt).forEach(name => {
  const b = document.createElement('button');
  b.textContent = name;
  b.addEventListener('click', () => {
    $$('#ntTabs button').forEach(x => x.setAttribute('aria-selected', x === b));
    $('#ntPanel').innerHTML = `<h3>${name}</h3><p>${nt[name]}</p>`;
  });
  $('#ntTabs').appendChild(b);
});
$('#ntTabs button').click();

/* 7. JUEGO · CONSTRUYE LA NEURONA */
const GAME = [
  ['dendritas', `<path class="line" d="M150 130 L60 60 M150 140 L40 130 M150 160 L50 215 M160 175 L100 260 M150 120 L100 30"/>
    <circle cx="60" cy="60" r="6"/><circle cx="40" cy="130" r="6"/><circle cx="50" cy="215" r="6"/><circle cx="100" cy="260" r="6"/><circle cx="100" cy="30" r="6"/>`],
  ['soma', `<circle class="soma" cx="210" cy="150" r="70"/>`],
  ['nucleo', `<circle class="nuc" cx="210" cy="150" r="26"/>`],
  ['axon', `<path class="line thick" d="M280 150 L640 150"/>`],
  ['mielina', `<rect class="myel" x="320" y="136" width="60" height="28" rx="14"/><rect class="myel" x="400" y="136" width="60" height="28" rx="14"/>
    <rect class="myel" x="480" y="136" width="60" height="28" rx="14"/><rect class="myel" x="560" y="136" width="55" height="28" rx="14"/>`],
  ['terminales', `<path class="line" d="M640 150 L720 90 M640 150 L735 150 M640 150 L720 215"/>
    <circle cx="722" cy="90" r="9"/><circle cx="737" cy="150" r="9"/><circle cx="722" cy="215" r="9"/>`]
];
const COLOR = {dendritas:'var(--cyan)', soma:'var(--blue)', nucleo:'var(--purple)', axon:'var(--cyan)', mielina:'var(--orange)', terminales:'var(--green)'};
/* Zonas de acierto en coordenadas del SVG (800 x 300), con margen para facilitar el arrastre */
const REGION = {
  dendritas:(x,y) => x > 15 && x < 155 && y > 15 && y < 280,
  soma:(x,y) => Math.hypot(x - 210, y - 150) < 85,
  nucleo:(x,y) => Math.hypot(x - 210, y - 150) < 40,
  axon:(x,y) => x > 270 && x < 655 && Math.abs(y - 150) < 30,
  mielina:(x,y) => x > 305 && x < 630 && Math.abs(y - 150) < 32,
  terminales:(x,y) => x > 645 && x < 770 && y > 60 && y < 245
};
const board = $('#gameBoard'), tray = $('#gameTray');
let placed, fails, score, selected;

function svgPoint(cx, cy){
  const p = board.createSVGPoint(); p.x = cx; p.y = cy;
  return p.matrixTransform(board.getScreenCTM().inverse());
}
const isHit = (key, cx, cy) => { const p = svgPoint(cx, cy); return REGION[key](p.x, p.y); };
const gmsg = t => $('#gMsg').textContent = t;
function hud(){
  $('#gScore').textContent = score;
  $('#gPlaced').textContent = `${placed.size} / ${GAME.length}`;
  $('#gFails').textContent = fails;
}
function buildGame(){
  placed = new Set(); fails = 0; score = 0; selected = null;
  board.innerHTML = GAME.map(([k, s]) =>
    `<g class="zone" data-part="${k}"><g class="ghost">${s}</g><g class="fill">${s}</g></g>`).join('');
  tray.innerHTML = '';
  [...GAME].sort(() => Math.random() - .5).forEach(([k]) => {
    const b = document.createElement('button');
    b.className = 'piece'; b.dataset.part = k; b.style.setProperty('--c', COLOR[k]);
    b.innerHTML = `<i></i>${parts[k][0]}`;
    tray.appendChild(b); bindPiece(b);
  });
  $('#gameEnd').hidden = true; $('#gInfo').hidden = true;
  gmsg('Arrastra cada pieza hasta su lugar en la neurona.');
  hud();
}
function place(key){
  placed.add(key); score += 100; selected = null;
  $(`.zone[data-part="${key}"]`, board).classList.add('put');
  const piece = $(`.piece[data-part="${key}"]`, tray);
  piece.classList.remove('sel'); piece.classList.add('used');
  $('#gInfo').hidden = false;
  $('#gInfo').innerHTML = `<h3>${parts[key][0]}</h3><p>${parts[key][1]}</p>`;
  gmsg('Correcto: +100 puntos.');
  hud();
  if(placed.size === GAME.length) setTimeout(() => {
    $('#finalScore').textContent = score; $('#finalFails').textContent = fails;
    $('#gameEnd').hidden = false; $('#restartGame').focus();
  }, 900);
}
function miss(){
  fails++;
  gmsg('Esa pieza no va ahí. Inténtalo nuevamente.');
  board.classList.remove('shake'); void board.getBoundingClientRect(); board.classList.add('shake');
  hud();
}
function select(b){
  $$('.piece', tray).forEach(p => p.classList.toggle('sel', p === b && !p.classList.contains('sel')));
  selected = b.classList.contains('sel') ? b.dataset.part : null;
  if(selected) gmsg('Pieza seleccionada: toca su lugar en la neurona.');
}
board.addEventListener('click', e => {
  if(!selected) return;
  const k = selected;
  isHit(k, e.clientX, e.clientY) ? place(k) : miss();
});
function bindPiece(b){
  let sx, sy, fl = null, dragged = false;
  b.addEventListener('pointerdown', e => { b.setPointerCapture(e.pointerId); sx = e.clientX; sy = e.clientY; dragged = false; });
  b.addEventListener('pointermove', e => {
    if(!b.hasPointerCapture(e.pointerId)) return;
    if(!fl && Math.hypot(e.clientX - sx, e.clientY - sy) > 6){
      fl = b.cloneNode(true); fl.classList.add('float'); fl.style.width = b.offsetWidth + 'px';
      document.body.appendChild(fl); b.classList.add('lift'); dragged = true;
    }
    if(fl){ fl.style.left = e.clientX - fl.offsetWidth / 2 + 'px'; fl.style.top = e.clientY - fl.offsetHeight / 2 + 'px'; }
  });
  const end = (e, drop) => {
    if(!fl) return;
    const key = b.dataset.part, f = fl; fl = null; b.classList.remove('lift');
    if(drop && isHit(key, e.clientX, e.clientY)){ f.remove(); place(key); }
    else {
      const r = b.getBoundingClientRect();
      f.classList.add('back'); f.style.left = r.left + 'px'; f.style.top = r.top + 'px';
      setTimeout(() => f.remove(), 300);
      if(drop) miss();
    }
  };
  b.addEventListener('pointerup', e => end(e, true));
  b.addEventListener('pointercancel', e => end(e, false));
  b.addEventListener('click', () => { if(dragged){ dragged = false; return; } select(b); });
}
$('#restartGame').addEventListener('click', buildGame);
buildGame();

/* 8. EVALUACIÓN · GOOGLE FORMS INCRUSTADO
   Pega el enlace en index.html, atributo data-src del iframe #formFrame.
   La calificación se muestra al enviar si el formulario es un cuestionario
   con "Ver puntuación: inmediatamente después de cada envío". */
const formFrame = $('#formFrame');
if(/^https:\/\/docs\.google\.com\/forms\//.test(formFrame.dataset.src)){
  formFrame.src = formFrame.dataset.src;
  formFrame.hidden = false;
  $('#formNotice').hidden = true;
}

/* 9. GLOSARIO */
const glossary = [
  ['Axón','Prolongación que conduce el potencial de acción.'],
  ['Despolarización','Fase en la que el interior de la neurona se vuelve menos negativo.'],
  ['Dendrita','Ramificación que recibe señales de otras células.'],
  ['GABA','Neurotransmisor que generalmente disminuye la excitabilidad neuronal.'],
  ['Glutamato','Principal neurotransmisor excitador del sistema nervioso central.'],
  ['Mielina','Capa aislante que permite una conducción rápida del impulso.'],
  ['Neurona','Célula especializada en recibir, procesar y transmitir información.'],
  ['Neurotransmisor','Sustancia química utilizada para transmitir señales entre células.'],
  ['Potencial de acción','Cambio rápido del potencial eléctrico de la membrana neuronal.'],
  ['Repolarización','Proceso mediante el cual la membrana vuelve hacia su estado negativo.'],
  ['Sinapsis','Zona de comunicación entre una neurona y otra célula.'],
  ['Soma','Cuerpo celular que contiene el núcleo y otros orgánulos.']
];
function renderGlossary(q = ''){
  const t = q.toLowerCase().trim();
  const list = glossary.filter(([a, b]) => a.toLowerCase().includes(t) || b.toLowerCase().includes(t));
  $('#glossaryGrid').innerHTML = list.length
    ? list.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')
    : '<p>No se encontró ese término. Prueba con otra palabra relacionada con la neurobiología.</p>';
}
renderGlossary();
$('#glossarySearch').addEventListener('input', e => renderGlossary(e.target.value));

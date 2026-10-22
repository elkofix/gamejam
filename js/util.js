const $ = (selector, raiz = document) => raiz.querySelector(selector);
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const FUENTE = '"Pixelify Sans", monospace';
// En canvas no se pueden apagar las ligaduras: se separan "fi"/"fl" con un carácter invisible
const sinLigaduras = texto => String(texto).replace(/f(?=[il])/g, 'f‌');

function mostrarPantalla(id) {
  document.querySelectorAll('.pantalla').forEach(p => p.classList.toggle('activa', p.id === id));
}

// Foto con marco; si el archivo no existe muestra una cámara en pixel art
function crearFoto(src) {
  const caja = document.createElement('div');
  caja.className = 'foto';
  const vacia = () => {
    caja.classList.add('sin-foto');
    caja.innerHTML = Sprites.img('camara', 5);
  };
  if (!src) {
    vacia();
    return caja;
  }
  const img = new Image();
  img.alt = '';
  img.onerror = vacia;
  img.src = src;
  caja.append(img);
  return caja;
}

// ---------- Pastel grande (nivel 1 y final) ----------
// Se dibuja a 60x70 pixeles y se muestra a escala 4.
const PASTEL = { ancho: 60, alto: 70, escala: 4, velas: [14, 21, 28, 35, 42], arribaVelas: 12 };
let urlPastel = null;

function dibujarPastel() {
  const P = Sprites.PALETA;
  const c = document.createElement('canvas');
  c.width = PASTEL.ancho;
  c.height = PASTEL.alto;
  const x = c.getContext('2d');
  const rect = (color, a, b, w, h) => {
    x.fillStyle = color;
    x.fillRect(a, b, w, h);
  };
  const piso = (x0, y0, w, h, base, sombra) => {
    rect(P.k, x0, y0, w, h);
    rect(base, x0 + 1, y0 + 1, w - 2, h - 2);
    rect(sombra, x0 + 1, y0 + h - 3, w - 2, 2);
    rect(P.w, x0 + 1, y0 + 1, w - 2, 3);
    // chorreado del glaseado
    for (let i = x0 + 2, n = 0; i < x0 + w - 3; i += 4, n++) {
      const largo = [2, 4, 3, 5, 2, 3][n % 6];
      rect(P.w, i, y0 + 4, 2, largo);
      rect(P.W, i, y0 + 3 + largo, 2, 1);
    }
    // puntitos de chispas
    for (let i = x0 + 4, n = 0; i < x0 + w - 4; i += 6, n++) rect([P.y, P.b, P.v, P.m][n % 4], i, y0 + h - 7 - (n % 2) * 2, 1, 1);
  };
  rect(P.k, 1, 63, 58, 6);
  rect(P.W, 2, 64, 56, 4);
  rect(P.w, 4, 64, 52, 1);
  rect(P.g, 2, 67, 56, 1);
  piso(5, 43, 50, 21, P.p, P.P);
  piso(12, 26, 36, 18, P.l, P.p);
  return c;
}

function pastelHTML(decoraciones = [], conVelas = false) {
  urlPastel ??= Sprites.escalar(dibujarPastel(), PASTEL.escala).toDataURL();
  const e = PASTEL.escala;
  const velas = conVelas
    ? PASTEL.velas.map(v => `
        <div class="vela" style="left:${v * e}px;top:${PASTEL.arribaVelas * e}px">
          ${Sprites.img('vela', e)}<div class="llama"></div>
        </div>`).join('')
    : '';
  return `
    <div class="pastel" style="width:${PASTEL.ancho * e}px;height:${PASTEL.alto * e}px">
      <img class="px" src="${urlPastel}" alt="" draggable="false">
      ${velas}
      ${decoraciones.filter(d => Sprites.DEF[d.e]).map(decoHTML).join('')}
    </div>`;
}

// Las decoraciones guardan su centro en pixeles del pastel
const decoHTML = (d, nueva) => Sprites.img(d.e, PASTEL.escala, `deco${nueva === true ? ' nueva' : ''}`)
  .replace('<img ', `<img style="left:${(d.x - 4) * PASTEL.escala}px;top:${(d.y - 4) * PASTEL.escala}px" `);

// ---------- Lienzos pixelados ----------
// Se dibuja en un buffer pequeño y se amplía sin suavizado.
// opciones: { escala } px de pantalla por pixel, o { ancho } pixeles de ancho fijos.
function ajustarLienzo(canvas) {
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(r.width * dpr);
  canvas.height = Math.round(r.height * dpr);
  return { W: r.width, H: r.height, dpr };
}

function crearPixelLienzo(canvas, opciones) {
  const ctx = canvas.getContext('2d');
  const buffer = document.createElement('canvas');
  const l = { b: buffer.getContext('2d'), ctx, W: 0, H: 0, w: 0, h: 0, k: 1, dpr: 1 };
  l.ajustar = () => {
    Object.assign(l, ajustarLienzo(canvas));
    l.k = opciones.ancho ? l.W / opciones.ancho : opciones.escala;
    l.w = Math.ceil(l.W / l.k);
    l.h = Math.ceil(l.H / l.k);
    buffer.width = l.w;
    buffer.height = l.h;
    l.b.imageSmoothingEnabled = false;
  };
  // dx/dy: desplazamiento en pixeles de arte (para sacudir la pantalla)
  l.presentar = (dx = 0, dy = 0) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const p = l.k * l.dpr;
    ctx.drawImage(buffer, dx * p, dy * p, l.w * p, l.h * p);
    ctx.setTransform(l.dpr, 0, 0, l.dpr, 0, 0);
  };
  l.ajustar();
  return l;
}

// Texto con contorno grueso, estilo videojuego retro
function textoPixel(ctx, texto, x, y, { tam = 16, color = '#fff', borde = '#2a1a2e', alinear = 'center' } = {}) {
  texto = sinLigaduras(texto);
  ctx.font = `700 ${tam}px ${FUENTE}`;
  ctx.textAlign = alinear;
  ctx.textBaseline = 'middle';
  const g = Math.max(2, Math.round(tam / 8));
  ctx.fillStyle = borde;
  for (const [dx, dy] of [[-g, 0], [g, 0], [0, -g], [0, g], [g, g]]) ctx.fillText(texto, x + dx, y + dy);
  ctx.fillStyle = color;
  ctx.fillText(texto, x, y);
}

// Bandas horizontales de colores (degradado retro)
function bandas(b, colores, alto, ancho, desde = 0) {
  const h = Math.ceil(alto / colores.length);
  colores.forEach((c, i) => {
    b.fillStyle = c;
    b.fillRect(0, desde + i * h, ancho, h);
  });
}

function circuloPixel(b, cx, cy, r, color, grosor = r + 1) {
  b.fillStyle = color;
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const d = Math.hypot(x, y);
      if (d <= r + 0.3 && d > r - grosor + 0.3) b.fillRect(cx + x, cy + y, 1, 1);
    }
  }
}

// ---------- Confeti de pixeles ----------
const Confeti = (() => {
  const canvas = document.getElementById('confeti');
  const ctx = canvas.getContext('2d');
  const COLORES = ['#ff7eb6', '#ffd23f', '#4cc9f0', '#6fcf5a', '#a06cff', '#ff8a3d'];
  const PX = 4;
  let piezas = [];
  let raf = 0;
  let ultimo = 0;
  let dpr = 1;

  function lanzar(cantidad = 160) {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    for (let i = 0; i < cantidad; i++) {
      piezas.push({
        x: innerWidth / 2 + (Math.random() - 0.5) * innerWidth * 0.4,
        y: innerHeight * 0.4,
        vx: (Math.random() - 0.5) * 800,
        vy: -Math.random() * 800 - 250,
        fase: Math.random() * 10,
        giro: 6 + Math.random() * 8,
        tam: Math.random() < 0.5 ? 2 : 3,
        c: COLORES[i % COLORES.length],
      });
    }
    if (!raf) {
      ultimo = performance.now();
      raf = requestAnimationFrame(cuadro);
    }
  }

  function cuadro(t) {
    const dt = Math.min(0.033, (t - ultimo) / 1000);
    ultimo = t;
    // si giran el celular mientras cae el confeti, el lienzo se ajusta a la nueva pantalla
    if (canvas.width !== Math.round(innerWidth * dpr) || canvas.height !== Math.round(innerHeight * dpr)) {
      canvas.width = Math.round(innerWidth * dpr);
      canvas.height = Math.round(innerHeight * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of piezas) {
      p.vy = Math.min(p.vy + 900 * dt, 200);
      p.vx *= 0.985;
      p.x += (p.vx + Math.sin(t / 300 + p.fase) * 40) * dt;
      p.y += p.vy * dt;
      // "gira" encogiéndose de ancho en pasos, como sprite de 2 cuadros
      const ancho = Math.sin(t / 1000 * p.giro + p.fase) > 0 ? p.tam : 1;
      ctx.fillStyle = p.c;
      ctx.fillRect(Math.round(p.x / PX) * PX, Math.round(p.y / PX) * PX, ancho * PX, p.tam * PX);
    }
    piezas = piezas.filter(p => p.y < innerHeight + 20);
    if (piezas.length) {
      raf = requestAnimationFrame(cuadro);
    } else {
      raf = 0;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
    }
  }

  return { lanzar };
})();

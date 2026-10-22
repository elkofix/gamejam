// Nivel 4 — inspirado en Bread & Fred (Pan y Federico)
// Ella controla un pingüino; el otro la sigue atado con una cuerda y la sostiene si se cae.
const NivelPinguinos = (() => {
  const ANCHO = 360; // ancho lógico del mundo
  const ARTE = 2; // unidades del mundo por pixel de arte (el lienzo mide 180 pixeles)
  const PASO = 92; // separación vertical entre plataformas
  const GRAVEDAD = 1500;
  const SALTO = 600;
  const VEL = 175;
  const CUERDA = 170;
  const CERCA = 45; // distancia a la que el compañero deja de seguirla
  // [x, ancho, piso, tipo] en fracciones del ancho
  const MAPA = [
    [0.55, 0.4, 1], [0.08, 0.38, 2, 'hielo'], [0.5, 0.3, 3], [0.15, 0.3, 4],
    [0.58, 0.32, 5, 'hielo'], [0.1, 0.25, 6], [0.45, 0.2, 7], [0.75, 0.22, 8, 'hielo'],
    [0.35, 0.22, 9], [0.05, 0.25, 10, 'hielo'], [0.4, 0.18, 11], [0.7, 0.25, 12], [0.28, 0.44, 13, 'cima'],
  ];
  const FRASES = ['¡Te tengo!', 'Casi me arrastras', '¡No te suelto!', 'Respira... seguimos', 'Otra vez tú, jaja', 'Para eso estoy'];
  const CIELO = ['#7ec4ef', '#8fcdf2', '#a1d6f5', '#b4def7', '#c7e7fa', '#daf0fc', '#eef7fc'];
  let sesion = 0;
  let raf = 0;
  let limpiar = [];

  function iniciar(el, terminar) {
    const id = ++sesion;
    el.innerHTML = `
      <div class="montana">
        <div class="hud">
          <span>ALTURA <b class="hud-altura">0%</b></span>
          <span>${Sprites.img('corazon', 2)} <b class="hud-rescates">0</b></span>
        </div>
        <canvas class="lienzo"></canvas>
        <div class="controles">
          <div>
            <button data-k="izq">${Sprites.img('flecha', 5, '', { voltear: true })}</button>
            <button data-k="der">${Sprites.img('flecha', 5)}</button>
          </div>
          <button data-k="arriba">${Sprites.img('flechaArriba', 5)}</button>
        </div>
      </div>`;
    const canvas = $('.lienzo', el);
    const L = crearPixelLienzo(canvas, { ancho: ANCHO / ARTE });
    const hudAltura = $('.hud-altura', el);
    const hudRescates = $('.hud-rescates', el);
    let s, vistaH;
    const ajustar = () => {
      L.ajustar();
      s = L.W / ANCHO;
      vistaH = L.H / s;
    };
    ajustar();

    const plataformas = [
      { x1: -50, x2: ANCHO + 50, y: 0, tipo: 'suelo' },
      ...MAPA.map(([x, w, n, tipo]) => ({ x1: x * ANCHO, x2: (x + w) * ANCHO, y: -n * PASO, tipo })),
    ];
    const cima = plataformas[plataformas.length - 1];
    const ella = { x: 80, y: 0, vx: 0, vy: 0, suelo: plataformas[0] };
    const yo = { x: 40, y: 0, moviendo: false };
    const migas = []; // posiciones donde ella pisó; el compañero las recorre
    const teclas = { izq: false, der: false };
    let bufferSalto = 0;
    let largo = CUERDA;
    let colgando = false;
    let rescatada = false;
    let rescates = 0;
    let burbuja = { texto: '¡Vamos juntos a la cima!', t: 3 };
    let camY = null;
    let ganado = false;
    let reloj = 0;
    let ultimo = performance.now();
    const copos = Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random(), v: 0.03 + Math.random() * 0.05, g: Math.random() < 0.3 ? 2 : 1 }));

    // Controles táctiles y de teclado
    el.querySelectorAll('.controles button').forEach(b => {
      const k = b.dataset.k;
      const presionar = e => {
        e.preventDefault();
        if (k === 'arriba') bufferSalto = 0.15;
        else teclas[k] = true;
        b.classList.add('activo');
      };
      const soltar = () => {
        if (k !== 'arriba') teclas[k] = false;
        b.classList.remove('activo');
      };
      b.addEventListener('pointerdown', presionar);
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(tipo => b.addEventListener(tipo, soltar));
      b.addEventListener('contextmenu', e => e.preventDefault());
    });
    const TECLAS = { ArrowLeft: 'izq', KeyA: 'izq', ArrowRight: 'der', KeyD: 'der' };
    const abajo = e => {
      if (TECLAS[e.code]) teclas[TECLAS[e.code]] = true;
      else if (['ArrowUp', 'KeyW', 'Space'].includes(e.code) && !e.repeat) bufferSalto = 0.15;
      else return;
      e.preventDefault();
    };
    const arriba = e => {
      if (TECLAS[e.code]) teclas[TECLAS[e.code]] = false;
    };
    window.addEventListener('keydown', abajo);
    window.addEventListener('keyup', arriba);
    window.addEventListener('resize', ajustar);
    limpiar.push(() => {
      window.removeEventListener('keydown', abajo);
      window.removeEventListener('keyup', arriba);
      window.removeEventListener('resize', ajustar);
    });

    const decir = (texto, t = 1.8) => (burbuja = { texto, t });

    const actualizar = dt => {
      // Movimiento de ella
      const hielo = ella.suelo?.tipo === 'hielo';
      const objetivo = ganado ? 0 : ((teclas.der ? 1 : 0) - (teclas.izq ? 1 : 0)) * VEL;
      const agarre = ella.suelo ? (hielo ? 2 : 16) : 5;
      ella.vx += (objetivo - ella.vx) * Math.min(1, agarre * dt);

      bufferSalto -= dt;
      if (bufferSalto > 0 && !ganado && (ella.suelo || colgando)) {
        ella.vy = -SALTO;
        ella.suelo = null;
        bufferSalto = 0;
        Sonido.tono(520, 0.1, { tipo: 'square', vol: 0.06 });
      }

      ella.vy += GRAVEDAD * dt;
      const yPrevia = ella.y;
      ella.x = clamp(ella.x + ella.vx * dt, 12, ANCHO - 12);
      ella.y += ella.vy * dt;

      // Plataformas de un solo sentido: solo se aterriza cayendo desde arriba
      ella.suelo = null;
      if (ella.vy >= 0) {
        for (const p of plataformas) {
          if (yPrevia <= p.y + 0.5 && ella.y >= p.y && ella.x > p.x1 - 6 && ella.x < p.x2 + 6) {
            ella.y = p.y;
            ella.vy = 0;
            ella.suelo = p;
            break;
          }
        }
      }

      // La cuerda: si está en el aire y se aleja demasiado, la sostiene
      colgando = false;
      if (ella.suelo) {
        rescatada = false;
        largo = CUERDA;
      } else {
        const dx = ella.x - yo.x;
        const dy = ella.y - yo.y;
        const d = Math.hypot(dx, dy);
        if (d > largo) {
          const nx = dx / d;
          const ny = dy / d;
          const vr = ella.vx * nx + ella.vy * ny;
          if (!rescatada && ella.vy > 300 && ny > 0.2) {
            rescatada = true;
            rescates++;
            hudRescates.textContent = rescates;
            decir(FRASES[(rescates - 1) % FRASES.length]);
            Sonido.tono(300, 0.2, { tipo: 'sine', vol: 0.2 });
          }
          ella.x = clamp(yo.x + nx * largo, 12, ANCHO - 12);
          ella.y = yo.y + ny * largo;
          if (vr > 0) {
            ella.vx -= vr * nx;
            ella.vy -= vr * ny;
          }
          colgando = ny > 0;
        }
      }
      // Colgando, el compañero la va subiendo poco a poco
      if (colgando) largo = Math.max(55, largo - 60 * dt);

      // El compañero recorre las huellas de ella
      if (ella.suelo) {
        const u = migas[migas.length - 1] || yo;
        if (Math.hypot(ella.x - u.x, ella.y - u.y) > 8) migas.push({ x: ella.x, y: ella.y });
      }
      yo.moviendo = false;
      if (Math.hypot(ella.x - yo.x, ella.y - yo.y) > CERCA) {
        let avance = 280 * dt;
        while (avance > 0 && migas.length) {
          yo.moviendo = true;
          const m = migas[0];
          const dx = m.x - yo.x;
          const dy = m.y - yo.y;
          const d = Math.hypot(dx, dy);
          if (d <= avance) {
            yo.x = m.x;
            yo.y = m.y;
            migas.shift();
            avance -= d;
          } else {
            yo.x += (dx / d) * avance;
            yo.y += (dy / d) * avance;
            avance = 0;
          }
        }
      }

      burbuja.t -= dt;
      hudAltura.textContent = `${Math.round(clamp(ella.y / cima.y, 0, 1) * 100)}%`;

      if (ella.suelo === cima && !ganado) {
        ganado = true;
        decir('¡Lo logramos!', 5);
        Sonido.victoria();
        Confeti.lanzar(120);
        setTimeout(() => id === sesion && terminar({
          mensaje: rescates
            ? `Te sostuve ${rescates} ${rescates === 1 ? 'vez' : 'veces'} en el camino... y te voy a seguir sosteniendo siempre.`
            : '¡Subiste sin caerte ni una vez! Pero si algún día te caes, ahí voy a estar.',
        }), 2800);
      }

      const camObjetivo = clamp(ella.y - vistaH * 0.6, cima.y - 140, -(vistaH - 70));
      camY = camY === null ? camObjetivo : camY + (camObjetivo - camY) * Math.min(1, 4 * dt);
      for (const c of copos) {
        c.y += c.v * dt;
        if (c.y > 1) { c.y = 0; c.x = Math.random(); }
      }
    };

    // Mundo → pixeles de arte
    const ax = x => Math.round(x / ARTE);
    const ay = y => Math.round((y - camY) / ARTE);

    const dibujarPlataforma = (b, p) => {
      const P = Sprites.PALETA;
      const x0 = ax(p.x1);
      const y0 = ay(p.y);
      const w = ax(p.x2) - x0;
      if (p.tipo === 'suelo') {
        b.fillStyle = '#ffffff';
        b.fillRect(x0, y0, w, L.h);
        b.fillStyle = '#d4e9f5';
        for (let x = x0; x < x0 + w; x++) if ((x * 7) % 11 === 0) b.fillRect(x, y0 + 3 + (x % 5), 1, 1);
        return;
      }
      const hielo = p.tipo === 'hielo';
      b.fillStyle = P.k;
      b.fillRect(x0, y0, w, 8);
      b.fillStyle = hielo ? '#a8e4ff' : '#8a7a8f';
      b.fillRect(x0 + 1, y0 + 1, w - 2, 6);
      b.fillStyle = hielo ? '#6cc3ea' : '#6d6380';
      b.fillRect(x0 + 1, y0 + 6, w - 2, 1);
      if (hielo) {
        b.fillStyle = '#ffffff';
        b.fillRect(x0 + 3, y0 + 2, Math.floor(w * 0.4), 1);
        b.fillRect(x0 + w - 6, y0 + 3, 2, 1);
      } else {
        b.fillStyle = '#6d6380';
        for (let x = x0 + 2; x < x0 + w - 2; x += 5) b.fillRect(x, y0 + 4 + (x % 2), 2, 1);
        // capa de nieve con chorreado
        b.fillStyle = '#ffffff';
        b.fillRect(x0 - 1, y0 - 1, w + 2, 3);
        for (let x = x0; x < x0 + w; x += 3) b.fillRect(x, y0 + 2, 2, (x * 5) % 3);
      }
    };

    const dibujarPinguino = (b, p, paleta, andando) => {
      const paso = andando ? Math.floor(reloj * 8) % 2 : 0;
      Sprites.dibujar(b, 'pinguino', ax(p.x) - 8, ay(p.y) - 16 - paso, { paleta });
    };

    const dibujarCuerda = b => {
      const x1 = yo.x, y1 = yo.y - 14, x2 = ella.x, y2 = ella.y - 14;
      const comba = Math.max(0, largo - Math.hypot(x2 - x1, y2 - y1)) * 0.5;
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2 + comba;
      b.fillStyle = '#ef4060';
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const x = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t ** 2 * x2;
        const y = (1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t ** 2 * y2;
        b.fillRect(ax(x), ay(y), 1, 1);
      }
    };

    const etiqueta = (texto, p, color) => {
      texto = sinLigaduras(texto);
      const ctx = L.ctx;
      const x = ax(p.x) * L.k;
      const y = (ay(p.y) - 22) * L.k;
      ctx.font = `700 12px ${FUENTE}`;
      const w = Math.ceil(ctx.measureText(texto).width) + 10;
      ctx.fillStyle = '#2a1a2e';
      ctx.fillRect(Math.round(x - w / 2) - 2, y - 9, w + 4, 18);
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x - w / 2), y - 7, w, 14);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(texto, x, y);
    };

    const dibujarBurbuja = () => {
      if (burbuja.t <= 0) return;
      const texto = sinLigaduras(burbuja.texto);
      const ctx = L.ctx;
      ctx.font = `700 13px ${FUENTE}`;
      const w = Math.ceil(ctx.measureText(texto).width) + 16;
      const px = ax(yo.x) * L.k;
      const x = clamp(px, w / 2 + 6, L.W - w / 2 - 6);
      const y = (ay(yo.y) - 40) * L.k;
      ctx.fillStyle = '#2a1a2e';
      ctx.fillRect(x - w / 2 - 3, y - 13, w + 6, 26);
      ctx.fillRect(px - 6, y + 10, 12, 6);
      ctx.fillRect(px - 3, y + 16, 6, 3);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x - w / 2, y - 10, w, 20);
      ctx.fillRect(px - 3, y + 10, 6, 3);
      ctx.fillStyle = '#2a1a2e';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(texto, x, y);
    };

    const dibujar = () => {
      const { b, w, h } = L;
      bandas(b, CIELO, h, w);

      // Montañas lejanas (parallax)
      const subida = -(camY + (vistaH - 70)) / ARTE;
      [['#cfe3ef', 0.08, 0.45, 40], ['#b3d1e4', 0.18, 0.62, 26]].forEach(([color, factor, base, alto]) => {
        b.fillStyle = color;
        for (let x = 0; x < w; x++) {
          const cumbre = Math.round(h * base + subida * factor - Math.abs(((x + factor * 300) % 90) - 45) / 45 * alto);
          b.fillRect(x, cumbre, 1, h - cumbre);
          if (color === '#cfe3ef') {
            b.fillStyle = '#ffffff';
            const nieve = Math.round(h * base + subida * factor - alto + 4);
            if (cumbre < nieve) b.fillRect(x, cumbre, 1, Math.min(3, nieve - cumbre));
            b.fillStyle = color;
          }
        }
      });

      for (const p of plataformas) dibujarPlataforma(b, p);
      Sprites.dibujar(b, 'bandera', ax(cima.x2) - 18, ay(cima.y) - 16);
      Sprites.dibujar(b, 'pastelito', ax(cima.x1) + 6, ay(cima.y) - 14);

      dibujarCuerda(b);
      dibujarPinguino(b, yo, { x: Sprites.PALETA.b }, yo.moviendo);
      dibujarPinguino(b, ella, { x: Sprites.PALETA.p }, ella.suelo && Math.abs(ella.vx) > 20);

      b.fillStyle = '#ffffff';
      for (const c of copos) b.fillRect(Math.floor(c.x * w), Math.floor(c.y * h), c.g, c.g);
      L.presentar();

      etiqueta(CONFIG.tuNombre, yo, '#4c8bf5');
      etiqueta(CONFIG.nombre, ella, '#ff7eb6');
      dibujarBurbuja();
    };

    const cuadro = t => {
      if (id !== sesion) return;
      const dt = Math.min(0.033, (t - ultimo) / 1000);
      ultimo = t;
      reloj += dt;
      actualizar(dt);
      dibujar();
      raf = requestAnimationFrame(cuadro);
    };
    raf = requestAnimationFrame(cuadro);
  }

  function detener() {
    sesion++;
    cancelAnimationFrame(raf);
    limpiar.forEach(f => f());
    limpiar = [];
  }

  return { iniciar, detener };
})();

// Nivel 3 — inspirado en Just Dance
const NivelBaile = (() => {
  const CARRILES = [
    { x: '#ff7eb6', X: '#d9487f' },
    { x: '#4cc9f0', X: '#2a8fb0' },
    { x: '#ffd23f', X: '#e8901a' },
    { x: '#6fcf5a', X: '#2f8f46' },
  ];
  const FONDO = ['#1d0b3a', '#2b1055', '#3a1a6e', '#4a2585', '#5b3299', '#6b40ad'];
  const PX = 3;
  const VIAJE = 1.5; // segundos que tarda una nota en caer
  const CALIFICACIONES = [
    { max: 0.06, texto: 'PERFECT', puntos: 300 },
    { max: 0.11, texto: 'SUPER', puntos: 200 },
    { max: 0.16, texto: 'GOOD', puntos: 100 },
  ];
  let sesion = 0;
  let raf = 0;
  let limpiar = [];

  function semilla(a) {
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function generarNotas(beat, duracion) {
    const azar = semilla(14);
    const notas = [];
    let carril = 0;
    for (let t = beat * 4; t < duracion; t += beat) {
      if (azar() < 0.15) continue;
      carril = (carril + 1 + Math.floor(azar() * 3)) % 4;
      notas.push({ t, carril, estado: 0 });
      if (beat > 0.45 && azar() < 0.3) notas.push({ t: t + beat / 2, carril: (carril + 2) % 4, estado: 0 });
    }
    return notas;
  }

  function iniciar(el, terminar) {
    const id = ++sesion;
    const { archivo, inicio = 0, bpm = 110, duracion = 45 } = CONFIG.cancion || {};
    const beat = 60 / bpm;
    const notas = generarNotas(beat, duracion);

    el.innerHTML = `
      <div class="baile">
        <div class="baile-hud"><span class="baile-puntos">0</span><span class="baile-combo"></span></div>
        <canvas class="lienzo"></canvas>
      </div>`;
    const canvas = $('.lienzo', el);
    const L = crearPixelLienzo(canvas, { escala: PX });
    const hudPuntos = $('.baile-puntos', el);
    const hudCombo = $('.baile-combo', el);
    const ajustar = () => L.ajustar();

    // Reloj: la canción si existe, si no un ritmo generado
    let modo = null;
    let audio = null;
    let ritmo = null;
    let t0 = 0;
    const usarRitmo = () => {
      if (modo === 'ritmo' || id !== sesion) return;
      audio?.pause();
      modo = 'ritmo';
      ritmo = Sonido.ritmo(bpm);
      t0 = ritmo.inicio;
    };
    if (archivo) {
      modo = 'audio';
      audio = new Audio(`${archivo}#t=${inicio}`);
      audio.addEventListener('loadedmetadata', () => {
        if (audio.currentTime < inicio) audio.currentTime = inicio;
      });
      audio.addEventListener('error', usarRitmo);
      audio.play().catch(usarRitmo);
    } else {
      usarRitmo();
    }
    const ahora = () => (modo === 'audio' ? audio.currentTime - inicio : Sonido.contexto().currentTime - t0);

    const presion = [0, 0, 0, 0];
    let juicios = [];
    let puntos = 0;
    let combo = 0;
    let aciertos = 0;
    let fin = false;
    let ultimo = performance.now();

    // Coordenadas en pixeles de arte
    const lineaY = () => L.h - 30;
    const carrilX = i => Math.round((i + 0.5) * (L.w / 4));

    const juzgar = (carril, texto) => {
      juicios.push({ carril, texto, t: 0.5 });
      hudPuntos.textContent = puntos;
      hudCombo.textContent = combo > 2 ? `COMBO x${combo}` : '';
    };

    const tocar = carril => {
      if (fin) return;
      const t = ahora();
      presion[carril] = 0.15;
      let mejor = null;
      let mejorDt = 1;
      for (const n of notas) {
        if (n.estado || n.carril !== carril) continue;
        const d = Math.abs(n.t - t);
        if (d < mejorDt) {
          mejorDt = d;
          mejor = n;
        }
      }
      const cal = CALIFICACIONES.find(c => mejorDt <= c.max);
      if (!mejor || !cal) return;
      mejor.estado = 1;
      combo++;
      aciertos++;
      puntos += cal.puntos + combo * 5;
      Sonido.tono(523 * Math.pow(2, carril / 4), 0.08, { tipo: 'square', vol: 0.05 });
      juzgar(carril, cal.texto);
    };

    const alTocar = e => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      tocar(clamp(Math.floor(((e.clientX - r.left) / r.width) * 4), 0, 3));
    };
    const TECLAS = { KeyD: 0, KeyF: 1, KeyJ: 2, KeyK: 3, ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3 };
    const alTeclear = e => {
      if (e.repeat || !(e.code in TECLAS)) return;
      e.preventDefault();
      tocar(TECLAS[e.code]);
    };
    canvas.addEventListener('pointerdown', alTocar);
    window.addEventListener('keydown', alTeclear);
    window.addEventListener('resize', ajustar);
    limpiar.push(() => {
      window.removeEventListener('keydown', alTeclear);
      window.removeEventListener('resize', ajustar);
      audio?.pause();
      ritmo?.detener();
    });

    const terminarBaile = () => {
      fin = true;
      ritmo?.detener();
      if (audio) {
        const bajar = setInterval(() => {
          audio.volume = Math.max(0, audio.volume - 0.1);
          if (audio.volume <= 0) {
            clearInterval(bajar);
            audio.pause();
          }
        }, 100);
      }
      const final = document.createElement('div');
      final.className = 'baile-final';
      final.innerHTML = `<div>${Sprites.img('estrella', 5).repeat(5)}</div><strong>PERFECT</strong>`;
      $('.baile', el).append(final);
      Sonido.victoria();
      Confeti.lanzar(100);
      setTimeout(() => id === sesion && terminar({
        mensaje: `Hiciste ${puntos} puntos y acertaste ${aciertos} de ${notas.length} pasos.\nPero para mí siempre eres PERFECT.`,
      }), 2500);
    };

    const actualizar = (dt, t) => {
      for (let i = 0; i < 4; i++) presion[i] = Math.max(0, presion[i] - dt);
      for (const n of notas) {
        if (n.estado === 0 && t - n.t > 0.16) {
          n.estado = 2;
          combo = 0;
          juzgar(n.carril, 'X');
        }
      }
      juicios.forEach(j => (j.t -= dt));
      juicios = juicios.filter(j => j.t > 0);
      if (t > duracion + 1) terminarBaile();
    };

    const dibujar = t => {
      const { b, w, h } = L;
      const pulso = Math.floor(t / beat);
      const golpe = (((t / beat) % 1) + 1) % 1 < 0.15;
      bandas(b, FONDO, h, w);

      // luces del escenario que cambian con cada tiempo
      for (let i = 0; i < 4; i++) {
        if ((pulso + i) % 2) continue;
        b.fillStyle = 'rgba(255,255,255,0.06)';
        const x0 = carrilX(i);
        for (let y = 0; y < h; y += 2) b.fillRect(x0 - 2 - Math.floor(y / 8), y, 4 + Math.floor(y / 4), 2);
      }

      // bailarina: cambia de pose con cada tiempo
      const pose = pulso % 2 ? 'bailarina2' : 'bailarina';
      const bx = Math.round(w / 2 - 16);
      const by = 14 - (golpe ? 2 : 0);
      b.fillStyle = 'rgba(0,0,0,0.25)';
      b.fillRect(bx + 4, by + 44, 24, 2);
      b.drawImage(Sprites.lienzo(pose), bx, by, 32, 44);

      // carriles y aros
      const y0 = lineaY();
      for (let i = 0; i < 4; i++) {
        const x = carrilX(i);
        b.fillStyle = 'rgba(255,255,255,0.12)';
        for (let y = 70; y < y0 - 10; y += 4) b.fillRect(x, y, 1, 2);
        circuloPixel(b, x, y0, 9, CARRILES[i].x, presion[i] > 0 ? 10 : 2);
        circuloPixel(b, x, y0, 10, '#1d0b3a', 1);
      }

      for (const n of notas) {
        if (n.estado) continue;
        const falta = n.t - t;
        if (falta > VIAJE || falta < -0.2) continue;
        const y = Math.round(y0 - (falta / VIAJE) * (y0 + 10));
        Sprites.dibujar(b, 'orbe', carrilX(n.carril) - 6, y - 6, { paleta: CARRILES[n.carril] });
      }
      L.presentar();

      for (const j of juicios) {
        L.ctx.globalAlpha = Math.min(1, j.t * 3);
        textoPixel(L.ctx, j.texto, carrilX(j.carril) * PX, (y0 - 22) * PX - (0.5 - j.t) * 40, {
          tam: 16,
          color: j.texto === 'X' ? '#ef4060' : CARRILES[j.carril].x,
        });
      }
      L.ctx.globalAlpha = 1;
    };

    const cuadro = ms => {
      if (id !== sesion) return;
      const dt = Math.min(0.05, (ms - ultimo) / 1000);
      ultimo = ms;
      const t = ahora();
      if (!fin) actualizar(dt, t);
      dibujar(t);
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

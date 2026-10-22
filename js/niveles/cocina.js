// Nivel 1 — inspirado en Cooking Mama
const NivelCocina = (() => {
  const ADORNOS = ['fresa', 'cereza', 'flor', 'estrella', 'corazon', 'arandano'];
  const MIN_ADORNOS = 6;
  let sesion = 0;
  let raf = 0;

  function iniciar(el, terminar) {
    const id = ++sesion;
    const vivo = () => id === sesion;
    el.innerHTML = `
      <div class="cocina">
        <div class="cocina-cabecera">
          <span class="cocina-paso"></span>
          <div class="barra"><div class="barra-relleno"></div></div>
        </div>
        <div class="mama">${Sprites.img('chef', 3, 'mama-cara')}<div class="burbuja"></div></div>
        <div class="cocina-zona"></div>
      </div>`;
    const zona = $('.cocina-zona', el);
    const burbuja = $('.burbuja', el);
    const relleno = $('.barra-relleno', el);
    const PASOS = [huevos, batir, hornear, decorar];
    let paso = 0;

    const decir = texto => {
      burbuja.textContent = texto;
      burbuja.classList.remove('saltar');
      void burbuja.offsetWidth;
      burbuja.classList.add('saltar');
    };
    const progreso = f => (relleno.style.width = `${((paso + f) / PASOS.length) * 100}%`);

    const siguiente = () => {
      if (!vivo()) return;
      zona.innerHTML = '';
      $('.cocina-paso', el).textContent = `PASO ${paso + 1}/${PASOS.length}`;
      progreso(0);
      PASOS[paso]({ zona, decir, progreso, vivo }, datos => {
        Sonido.bien();
        progreso(1);
        paso++;
        if (paso < PASOS.length) {
          setTimeout(siguiente, 1300);
        } else {
          setTimeout(() => sello(el, vivo, () => terminar({
            mensaje: 'Tu pastel quedó precioso. Guárdalo bien... lo vas a necesitar al final.',
            decoraciones: datos,
          })), 600);
        }
      });
    };
    siguiente();
  }

  function sello(el, vivo, listo) {
    if (!vivo()) return;
    const s = document.createElement('div');
    s.className = 'sello';
    s.innerHTML = `${Sprites.img('estrella', 12)}<span>¡Incluso mejor<br>que mamá!</span>`;
    $('.cocina', el).append(s);
    Sonido.victoria();
    Confeti.lanzar(80);
    setTimeout(() => vivo() && listo(), 2200);
  }

  function huevos({ zona, decir, progreso }, listo) {
    decir('¡Rompe 3 huevos! Toca cada uno hasta que se rompa.');
    zona.innerHTML = `
      <div class="huevos">${`<button class="huevo">${Sprites.img('huevo', 6)}</button>`.repeat(3)}</div>
      ${Sprites.img('bol', 6)}`;
    let rotos = 0;
    zona.querySelectorAll('.huevo').forEach(h => {
      let toques = 0;
      h.addEventListener('pointerdown', () => {
        if (h.classList.contains('roto')) return;
        toques++;
        Sonido.pop();
        h.classList.remove('sacudir');
        void h.offsetWidth;
        h.classList.add('sacudir');
        if (toques < 3) return;
        h.classList.add('roto');
        h.innerHTML = Sprites.img('huevoRoto', 6);
        rotos++;
        progreso(rotos / 3);
        if (rotos === 3) {
          decir('¡Perfecto! Ni una cáscara.');
          listo();
        }
      });
    });
  }

  function batir({ zona, decir, progreso }, listo) {
    decir('¡Ahora bate! Haz círculos con el dedo sobre el bol.');
    zona.innerHTML = '<canvas class="bol-pixel"></canvas><small class="suave">Sigue girando...</small>';
    const canvas = $('.bol-pixel', zona);
    const L = crearPixelLienzo(canvas, { escala: 6 });
    const P = Sprites.PALETA;
    const META = Math.PI * 2 * 6;
    // la mezcla pasa de rayada a suave según se bate
    const MEZCLAS = [['#ffd23f', '#fff6e0'], ['#ffe27a', '#fff6e0'], ['#fff1c1', '#fff6e0']];
    let previo = null;
    let angulo = 0;
    let total = 0;
    let animo = false;
    let hecho = false;

    const dibujar = () => {
      const { b, w, h } = L;
      const cx = Math.floor(w / 2);
      const cy = Math.floor(h / 2);
      b.clearRect(0, 0, w, h);
      circuloPixel(b, cx, cy, 19, P.k);
      circuloPixel(b, cx, cy, 18, P.b);
      circuloPixel(b, cx, cy, 16, P.c, 1);
      circuloPixel(b, cx, cy, 15, P.k, 1);
      const [c1, c2] = MEZCLAS[Math.min(2, Math.floor((total / META) * 3))];
      for (let y = -14; y <= 14; y++) {
        for (let x = -14; x <= 14; x++) {
          const d = Math.hypot(x, y);
          if (d > 14.3) continue;
          const t = (Math.atan2(y, x) + d * 0.35 - total) / (Math.PI * 2);
          b.fillStyle = (((t * 4) % 1) + 1) % 1 < 0.5 ? c1 : c2;
          b.fillRect(cx + x, cy + y, 1, 1);
        }
      }
      Sprites.dibujar(b, 'cuchara', cx + Math.cos(angulo) * 8 - 3, cy + Math.sin(angulo) * 8 - 9);
      L.presentar();
    };
    dibujar();

    const anguloDe = e => {
      const r = canvas.getBoundingClientRect();
      return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
    };
    canvas.addEventListener('pointerdown', e => {
      canvas.setPointerCapture(e.pointerId);
      previo = anguloDe(e);
    });
    canvas.addEventListener('pointermove', e => {
      if (previo === null || hecho) return;
      angulo = anguloDe(e);
      let d = angulo - previo;
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      total += Math.abs(d);
      previo = angulo;
      dibujar();
      progreso(Math.min(1, total / META));
      if (!animo && total > META / 2) {
        animo = true;
        decir('¡Eso! Ya casi está suavecita.');
      }
      if (total >= META) {
        hecho = true;
        decir('¡Qué mezcla tan suave!');
        listo();
      }
    });
    const soltar = () => (previo = null);
    canvas.addEventListener('pointerup', soltar);
    canvas.addEventListener('pointercancel', soltar);
  }

  function hornear({ zona, decir, progreso, vivo }, listo) {
    decir('¡Al horno! Toca "Sacar" cuando la flecha esté en la zona verde.');
    const SEGMENTOS = 20;
    const colores = Array.from({ length: SEGMENTOS }, (_, i) =>
      i < 5 ? '#4cc9f0' : i < 8 ? '#a8e4ff' : i < 12 ? '#6fcf5a' : i < 16 ? '#ff8a3d' : '#ef4060');
    zona.innerHTML = `
      <div class="horno">
        <div class="horno-perillas"><i></i><i></i><i></i></div>
        <div class="horno-ventana">${Sprites.img('pastelito', 6)}</div>
      </div>
      <div class="termometro">
        <div class="segmentos">${colores.map(c => `<i style="background:${c}"></i>`).join('')}</div>
        <div class="aguja">${Sprites.img('flechaArriba', 4)}</div>
      </div>
      <button class="boton">¡Sacar!</button>`;
    const aguja = $('.aguja', zona);
    const boton = $('.boton', zona);
    let pos = 0;
    let dir = 1;
    let activo = true;
    let ultimo = performance.now();

    // La flecha avanza de segmento en segmento, como en un juego retro
    const mover = t => {
      if (!activo || !vivo()) return;
      const dt = Math.min(0.05, (t - ultimo) / 1000);
      ultimo = t;
      pos += dir * 0.9 * dt;
      if (pos > 1) { pos = 1; dir = -1; }
      if (pos < 0) { pos = 0; dir = 1; }
      const seg = Math.min(SEGMENTOS - 1, Math.floor(pos * SEGMENTOS));
      aguja.style.left = `${((seg + 0.5) / SEGMENTOS) * 100}%`;
      aguja.dataset.seg = seg;
      raf = requestAnimationFrame(mover);
    };
    raf = requestAnimationFrame(mover);

    boton.addEventListener('click', () => {
      if (!activo) return;
      const seg = Number(aguja.dataset.seg);
      if (seg >= 8 && seg < 12) {
        activo = false;
        progreso(1);
        decir('¡Doradito perfecto!');
        listo();
      } else {
        Sonido.mal();
        decir(seg < 8 ? 'Uy, todavía está crudo. ¡Otra vez!' : '¡Se nos quema! ¡Otra vez!');
        zona.classList.remove('sacudir');
        void zona.offsetWidth;
        zona.classList.add('sacudir');
      }
    });
  }

  function decorar({ zona, decir, progreso }, listo) {
    decir('¡Ahora decóralo a tu gusto! Elige un adorno y toca el pastel.');
    zona.innerHTML = `
      ${pastelHTML()}
      <div class="adornos">${ADORNOS.map((a, i) => `<button class="adorno${i ? '' : ' elegido'}" data-a="${a}">${Sprites.img(a, 4)}</button>`).join('')}</div>
      <button class="boton" disabled>Terminé (0/${MIN_ADORNOS})</button>`;
    const pastel = $('.pastel', zona);
    const boton = zona.querySelector(':scope > .boton');
    const decos = [];
    let elegido = ADORNOS[0];

    zona.querySelectorAll('.adorno').forEach(b => b.addEventListener('click', () => {
      zona.querySelectorAll('.adorno').forEach(x => x.classList.remove('elegido'));
      b.classList.add('elegido');
      elegido = b.dataset.a;
    }));

    pastel.addEventListener('pointerdown', e => {
      if (decos.length >= 24) return;
      const r = pastel.getBoundingClientRect();
      const y = clamp(Math.round(((e.clientY - r.top) / r.height) * PASTEL.alto), 31, 58);
      const margen = y < 43 ? 17 : 10; // el piso de arriba es más angosto
      const x = clamp(Math.round(((e.clientX - r.left) / r.width) * PASTEL.ancho), margen, PASTEL.ancho - margen);
      const d = { e: elegido, x, y };
      decos.push(d);
      pastel.insertAdjacentHTML('beforeend', decoHTML(d, true));
      Sonido.pop();
      progreso(Math.min(1, decos.length / MIN_ADORNOS));
      boton.disabled = decos.length < MIN_ADORNOS;
      boton.textContent = decos.length < MIN_ADORNOS ? `Terminé (${decos.length}/${MIN_ADORNOS})` : '¡Terminé!';
    });

    boton.addEventListener('click', () => {
      boton.disabled = true;
      decir('¡Está hermoso!');
      listo(decos);
    });
  }

  function detener() {
    sesion++;
    cancelAnimationFrame(raf);
  }

  return { iniciar, detener };
})();

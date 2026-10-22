// Nivel 2 — inspirado en Banana Kong
const NivelBananas = (() => {
  const GRAVEDAD = 1800;
  const SALTO = 620;
  const PX = 3; // pixeles de pantalla por pixel de arte
  const CIELO = ['#ff94b0', '#ff9fb0', '#ffaaa8', '#ffb4a2', '#ffbda3', '#ffc6a5', '#ffcea5', '#ffd6a5', '#ffdeab', '#ffe5b0', '#ffebb8', '#fff1c1'];
  let sesion = 0;
  let raf = 0;
  let limpiar = [];

  function iniciar(el, terminar) {
    const id = ++sesion;
    const meta = CONFIG.edad;
    const recuerdos = CONFIG.recuerdos || [];
    // Reparte los recuerdos a lo largo de la carrera
    const hitos = recuerdos.map((_, i) => Math.max(1, Math.round((meta * (i + 1)) / (recuerdos.length + 1))));

    el.innerHTML = `
      <div class="runner">
        <div class="hud"><span>${Sprites.img('banana', 2)} <b class="hud-bananas">0/${meta}</b></span></div>
        <canvas class="lienzo"></canvas>
        <div class="pista-toque">TOCA PARA SALTAR<br><small>dos toques = doble salto</small></div>
        <div class="modal oculto">
          <div class="tarjeta">
            <small class="etiqueta">Recuerdo desbloqueado</small>
            <div class="modal-foto"></div>
            <p class="modal-texto"></p>
            <button class="boton">Seguir corriendo</button>
          </div>
        </div>
      </div>`;

    const canvas = $('.lienzo', el);
    const L = crearPixelLienzo(canvas, { escala: PX });
    const hud = $('.hud-bananas', el);
    const modal = $('.modal', el);
    let piso;
    const ajustar = () => {
      L.ajustar();
      piso = Math.round((L.H - 70) / PX) * PX;
    };
    ajustar();

    const kong = { h: 0, vy: 0, saltos: 0, inv: 0 };
    let objetos = [];
    let textos = [];
    let bananas = 0;
    let sigHito = 0;
    let pausa = false;
    let fin = false;
    let vel = 230;
    let recorrido = 0;
    let distSpawn = 200;
    let reloj = 0;
    let ultimo = performance.now();

    const saltar = () => {
      if (pausa || fin || kong.saltos >= 2) return;
      kong.vy = SALTO;
      kong.saltos++;
      Sonido.tono(kong.saltos === 1 ? 440 : 620, 0.1, { tipo: 'square', vol: 0.06 });
      $('.pista-toque', el)?.remove();
    };
    const alTocar = e => {
      e.preventDefault();
      saltar();
    };
    const alTeclear = e => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        saltar();
      }
    };
    canvas.addEventListener('pointerdown', alTocar);
    window.addEventListener('keydown', alTeclear);
    window.addEventListener('resize', ajustar);
    limpiar.push(() => {
      window.removeEventListener('keydown', alTeclear);
      window.removeEventListener('resize', ajustar);
    });

    $('.boton', modal).addEventListener('click', () => {
      modal.classList.add('oculto');
      pausa = false;
    });

    const mostrarRecuerdo = r => {
      pausa = true;
      const caja = $('.modal-foto', modal);
      caja.innerHTML = '';
      caja.append(crearFoto(r.foto));
      $('.modal-texto', modal).textContent = r.texto;
      modal.classList.remove('oculto');
      Sonido.bien();
    };

    const generar = () => {
      const x = L.W + 40;
      const tipo = Math.random();
      if (tipo < 0.35) {
        const h = [30, 70, 120][Math.floor(Math.random() * 3)];
        for (let i = 0; i < 4; i++) objetos.push({ t: 'banana', x: x + i * 42, h });
      } else if (tipo < 0.75) {
        objetos.push({ t: 'roca', x, h: 0 });
        [70, 115, 70].forEach((h, i) => objetos.push({ t: 'banana', x: x - 42 + i * 42, h }));
      } else {
        for (let i = 0; i < 5; i++) objetos.push({ t: 'banana', x: x + i * 39, h: 40 + Math.sin((i / 4) * Math.PI) * 90 });
      }
      distSpawn = 280 + Math.random() * 180;
    };

    const kongX = () => L.W * 0.22;

    const actualizar = dt => {
      vel = Math.min(340, 230 + bananas * 3);
      const avance = vel * dt;
      recorrido += avance;
      distSpawn -= avance;
      if (distSpawn <= 0) generar();

      kong.vy -= GRAVEDAD * dt;
      kong.h += kong.vy * dt;
      if (kong.h <= 0) {
        kong.h = 0;
        kong.vy = 0;
        kong.saltos = 0;
      }
      kong.inv -= dt;

      const kx = kongX();
      for (const o of objetos) {
        o.x -= avance;
        if (o.tomado || Math.abs(o.x - kx) > 28) continue;
        if (o.t === 'banana' && Math.abs(kong.h + 24 - o.h) < 32) {
          o.tomado = true;
          bananas++;
          Sonido.pop();
          textos.push({ texto: '+1', x: o.x, y: piso - o.h, t: 0.6 });
        } else if (o.t === 'roca' && kong.h < 26 && kong.inv <= 0) {
          o.tomado = true;
          kong.inv = 1.2;
          bananas = Math.max(0, bananas - 1);
          Sonido.mal();
          textos.push({ texto: '¡AUCH!', x: kx, y: piso - 90, t: 0.9 });
        }
      }
      objetos = objetos.filter(o => o.x > -60 && !(o.tomado && o.t === 'banana'));
      textos.forEach(tx => { tx.t -= dt; tx.y -= 40 * dt; });
      textos = textos.filter(tx => tx.t > 0);
      hud.textContent = `${bananas}/${meta}`;

      if (bananas >= meta) {
        fin = true;
        Sonido.victoria();
        Confeti.lanzar(80);
        textos.push({ texto: '¡LO LOGRASTE!', x: L.W / 2, y: L.H * 0.35, t: 3, grande: true });
        setTimeout(() => id === sesion && terminar({
          mensaje: `¡Juntaste ${meta} bananas, una por cada año que cumples!`,
        }), 1800);
      } else if (sigHito < hitos.length && bananas >= hitos[sigHito]) {
        mostrarRecuerdo(recuerdos[sigHito++]);
      }
    };

    // Todo se dibuja en pixeles de arte: posición de pantalla / PX
    const dibujar = () => {
      const { b, w, h } = L;
      const pisoB = piso / PX;
      const rb = recorrido / PX;
      bandas(b, CIELO, pisoB - 20, w);
      b.fillStyle = CIELO[CIELO.length - 1];
      b.fillRect(0, pisoB - 30, w, 30);

      // sol y nubes
      circuloPixel(b, w - 28, 26, 10, '#fff6e0');
      circuloPixel(b, w - 28, 26, 10, '#ffe27a', 2);
      for (let i = 0; i < 3; i++) {
        const nx = ((i * 70 - rb * 0.1) % (w + 40) + w + 40) % (w + 40) - 20;
        Sprites.dibujar(b, 'nube', nx, 40 + i * 17);
      }

      // colinas lejanas y cercanas
      for (let x = 0; x < w; x++) {
        const lejos = Math.round(22 + Math.sin((x + rb * 0.2) / 14) * 6);
        b.fillStyle = '#9ed98a';
        b.fillRect(x, pisoB - lejos, 1, lejos);
        const cerca = Math.round(10 + Math.sin((x + rb * 0.4) / 9) * 4);
        b.fillStyle = '#6fcf5a';
        b.fillRect(x, pisoB - cerca, 1, cerca);
      }
      const sep = 64;
      for (let x = -((rb * 0.6) % sep); x < w + sep; x += sep) Sprites.dibujar(b, 'palmera', x - 10, pisoB - 22);

      // suelo
      for (let x = 0; x < w; x++) {
        const mundo = Math.floor(x + rb);
        b.fillStyle = '#2f8f46';
        b.fillRect(x, pisoB, 1, 4);
        b.fillStyle = '#6fcf5a';
        b.fillRect(x, pisoB, 1, mundo % 7 === 0 ? 1 : 2);
        b.fillStyle = '#9b6238';
        b.fillRect(x, pisoB + 4, 1, h - pisoB - 4);
        b.fillStyle = '#6a3d22';
        if (mundo % 13 === 0) b.fillRect(x, pisoB + 10, 2, 1);
        if (mundo % 17 === 5) b.fillRect(x, pisoB + 18, 1, 1);
      }

      const balanceo = Math.floor(reloj * 4) % 2;
      for (const o of objetos) {
        if (o.t === 'banana') Sprites.dibujar(b, 'banana', o.x / PX - 6, (piso - o.h) / PX - 6 + balanceo);
        else Sprites.dibujar(b, 'roca', o.x / PX - 8, pisoB - 9);
      }

      const parpadeo = kong.inv > 0 && Math.floor(kong.inv * 10) % 2 === 0;
      if (!parpadeo) {
        const trote = kong.h === 0 && !fin ? Math.floor(recorrido / 30) % 2 : 0;
        Sprites.dibujar(b, 'gorila', kongX() / PX - 8, (piso - kong.h) / PX - 16 - trote);
      }
      L.presentar();

      for (const tx of textos) {
        L.ctx.globalAlpha = Math.min(1, tx.t * 2);
        textoPixel(L.ctx, tx.texto, tx.x, tx.y, { tam: tx.grande ? 32 : 18, color: tx.grande ? '#ffd23f' : '#fff' });
      }
      L.ctx.globalAlpha = 1;
    };

    const cuadro = t => {
      if (id !== sesion) return;
      const dt = Math.min(0.033, (t - ultimo) / 1000);
      ultimo = t;
      reloj += dt;
      if (!pausa && !fin) actualizar(dt);
      else textos.forEach(tx => (tx.t -= fin ? dt : 0));
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

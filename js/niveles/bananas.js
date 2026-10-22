// Nivel 2 — inspirado en Banana Kong (se juega con el celular en horizontal)
// Una avalancha de bananas la persigue: hay que llegar a la meta sin chocar con las rocas.
const NivelBananas = (() => {
  const opciones = { distancia: 24000 }; // largo del recorrido en px (~70 s)
  const GRAVEDAD = 1800;
  const SALTO = 620;
  const PX = 3; // pixeles de pantalla por pixel de arte
  const BAJA = 70; // altura de las plataformas
  const ALTA = 140;
  const BUFFER = 0.25; // un toque antes de aterrizar igual cuenta (cubre caídas desde plataformas)
  const GRACIA = 0.08; // al despegar, unos instantes en que una roca todavía no lo tumba
  const COYOTE = 0.12; // al caerse de un borde, todavía puede saltar desde el piso un instante
  const VEL_INICIAL = 240;
  const VEL_FINAL = 450;
  const INTRO = { calma: 1, temblor: 1.2 }; // segundos de cada parte de la animación inicial
  const CIELO = ['#ff94b0', '#ff9fb0', '#ffaaa8', '#ffb4a2', '#ffbda3', '#ffc6a5', '#ffcea5', '#ffd6a5', '#ffdeab', '#ffe5b0', '#ffebb8', '#fff1c1'];
  const DORADA = { y: '#fff7c2', Y: '#ffc93d', k: '#b06a00', N: '#7a4a00' };
  const tactil = () => matchMedia('(pointer: coarse)').matches;
  let sesion = 0;
  let raf = 0;
  let limpiar = [];

  // En Android se puede forzar pantalla completa y horizontal; en iPhone solo se le pide que gire
  function pedirHorizontal() {
    if (!tactil()) return;
    const raiz = document.documentElement;
    Promise.resolve(raiz.requestFullscreen?.())
      .then(() => screen.orientation?.lock?.('landscape'))
      .catch(() => {});
  }

  function soltarHorizontal() {
    try { screen.orientation?.unlock?.(); } catch {}
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }

  // Ícono del marcador: la misma burbuja rosa que tienen las bananas de recuerdo en el juego
  function iconoRecuerdo(escala) {
    const c = document.createElement('canvas');
    c.width = c.height = 16;
    const b = c.getContext('2d');
    circuloPixel(b, 8, 8, 7, 'rgba(255,126,182,0.45)');
    circuloPixel(b, 8, 8, 7, '#ff7eb6', 1);
    Sprites.dibujar(b, 'banana', 2, 2, { paleta: DORADA });
    return `<img class="px" src="${Sprites.escalar(c, escala).toDataURL()}" width="${16 * escala}" height="${16 * escala}" alt="">`;
  }

  function iniciar(el, terminar) {
    const id = ++sesion;
    const recuerdos = CONFIG.recuerdos || [];
    const DISTANCIA = opciones.distancia;

    document.body.classList.add('horizontal');
    pedirHorizontal();
    limpiar.push(() => {
      document.body.classList.remove('horizontal');
      soltarHorizontal();
    });

    el.innerHTML = `
      <div class="runner">
        <div class="hud">
          <span>${Sprites.img('banana', 2)} <b class="hud-bananas">0</b></span>
          <span>${iconoRecuerdo(2)} <b class="hud-recuerdos">0/${recuerdos.length}</b></span>
          <span class="hud-camino"><span class="camino"><i></i></span>${Sprites.img('bandera', 2)}</span>
        </div>
        <canvas class="lienzo"></canvas>
        <div class="pista-toque oculto">TOCA PARA SALTAR<br><small>dos toques = doble salto</small></div>
        <div class="modal recuerdo oculto" role="dialog" aria-modal="true" aria-labelledby="recuerdo-titulo" aria-describedby="recuerdo-texto">
          <div class="tarjeta">
            <div class="modal-foto"></div>
            <div class="modal-lado">
              <small id="recuerdo-titulo" class="etiqueta modal-titulo"></small>
              <p id="recuerdo-texto" class="modal-texto"></p>
              <button class="boton">Seguir corriendo</button>
            </div>
          </div>
        </div>
        <div class="modal derrota oculto">
          <div class="tarjeta">
            <h2>¡Te atrapó la avalancha!</h2>
            <p class="derrota-texto"></p>
            <button class="boton">Intentar otra vez</button>
          </div>
        </div>
        <div class="girar oculto">
          ${Sprites.img('celular', 6, 'girar-celular')}
          <p>Gira tu celular</p>
          <small>Este nivel se juega en horizontal</small>
        </div>
      </div>`;

    const canvas = $('.lienzo', el);
    const L = crearPixelLienzo(canvas, { escala: PX });
    const hudBananas = $('.hud-bananas', el);
    const hudRecuerdos = $('.hud-recuerdos', el);
    const hudCamino = $('.hud-camino i', el);
    const pista = $('.pista-toque', el);
    const modalRecuerdo = $('.modal.recuerdo', el);
    const modalDerrota = $('.modal.derrota', el);
    const aviso = $('.girar', el);
    let piso;
    const ajustar = () => {
      L.ajustar();
      piso = Math.round((L.H - 50) / PX) * PX;
    };
    ajustar();

    const kongX = () => Math.max(170, L.W * 0.26);
    const bordeCarrera = () => kongX() - 85;
    // Los recuerdos se reparten a lo largo de todo el recorrido
    const marcasRecuerdo = recuerdos.map((_, i) => (DISTANCIA * (i + 1)) / (recuerdos.length + 1));

    let reloj = 0;
    let pausa = false;
    let girando = false;
    let j; // estado de la partida actual

    const nuevaPartida = () => {
      j = {
        fase: 'intro', // intro → carrera → (choque → derrota) | llegada
        tFase: 0,
        kong: { h: 0, vy: 0, saltos: 0, suelo: true, coyote: 0, buffer: 0, tSalto: 1 },
        objetos: [],
        plataformas: [],
        textos: [],
        bananas: 0,
        encontrados: 0,
        sigRecuerdo: 0,
        recuerdoPendiente: null,
        recorrido: 0,
        vel: 0,
        distSpawn: 450,
        metaPuesta: false,
        avalancha: -120, // borde delantero de la avalancha, en px de pantalla
      };
      hudBananas.textContent = '0';
      hudRecuerdos.textContent = `0/${recuerdos.length}`;
      hudCamino.style.width = '0%';
      pista.classList.add('oculto');
      modalDerrota.classList.add('oculto');
    };
    nuevaPartida();

    const cambiarFase = fase => {
      j.fase = fase;
      j.tFase = 0;
    };

    // Salta si puede; si no, el toque queda guardado BUFFER segundos
    const intentarSalto = () => {
      const k = j.kong;
      if (k.buffer <= 0 || k.saltos >= 2) return;
      k.vy = SALTO;
      k.saltos++;
      k.suelo = false;
      k.coyote = 0;
      k.buffer = 0;
      k.tSalto = 0;
      Sonido.tono(k.saltos === 1 ? 440 : 620, 0.1, { tipo: 'square', vol: 0.06 });
    };
    const saltar = () => {
      if (pausa || girando || j.fase !== 'carrera') return;
      j.kong.buffer = BUFFER;
      intentarSalto();
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
    // Se escucha en todo el nivel (también sobre el marcador), salvo en botones y tarjetas
    const runner = $('.runner', el);
    runner.addEventListener('pointerdown', e => {
      if (!e.target.closest('button, .modal, .girar')) alTocar(e);
    });
    window.addEventListener('keydown', alTeclear);
    window.addEventListener('resize', ajustar);
    limpiar.push(() => {
      window.removeEventListener('keydown', alTeclear);
      window.removeEventListener('resize', ajustar);
    });

    $('.boton', modalRecuerdo).addEventListener('click', () => {
      modalRecuerdo.classList.add('oculto');
      pausa = false;
    });
    $('.boton', modalDerrota).addEventListener('click', nuevaPartida);

    const mostrarRecuerdo = i => {
      pausa = true;
      const caja = $('.modal-foto', modalRecuerdo);
      caja.innerHTML = '';
      caja.append(crearFoto(recuerdos[i].foto));
      $('.modal-titulo', modalRecuerdo).textContent = `Recuerdo ${i + 1} de ${recuerdos.length}`;
      $('.modal-texto', modalRecuerdo).textContent = recuerdos[i].texto;
      modalRecuerdo.classList.remove('oculto');
      $('.tarjeta', modalRecuerdo).scrollTop = 0;
      $('.boton', modalRecuerdo).focus({ preventScroll: true });
      Sonido.victoria();
    };

    const decir = (texto, x, y, t = 0.9, grande = false) => j.textos.push({ texto, x, y, t, grande });

    // ---------- Generación del camino ----------
    const plataforma = (x, w, h) => j.plataformas.push({ x, w, h });
    const roca = x => j.objetos.push({ t: 'roca', x, h: 0 });
    const filaBananas = (x, n, h, sep = 42) => {
      for (let i = 0; i < n; i++) j.objetos.push({ t: 'banana', x: x + i * sep, h });
    };

    // Devuelven el ancho que ocupan
    const PATRONES = [
      x => { filaBananas(x, 4, [30, 70][Math.floor(Math.random() * 2)]); return 170; },
      x => {
        roca(x + 42);
        [70, 115, 70].forEach((h, i) => j.objetos.push({ t: 'banana', x: x + i * 42, h }));
        return 130;
      },
      x => {
        for (let i = 0; i < 5; i++) j.objetos.push({ t: 'banana', x: x + i * 39, h: 40 + Math.sin((i / 4) * Math.PI) * 90 });
        return 160;
      },
      x => {
        plataforma(x, 170, BAJA);
        filaBananas(x + 25, 3, BAJA + 30, 55);
        if (Math.random() < 0.6) roca(x + 85);
        return 170;
      },
      x => {
        plataforma(x, 130, BAJA);
        plataforma(x + 180, 150, ALTA);
        filaBananas(x + 30, 2, BAJA + 30, 60);
        filaBananas(x + 210, 3, ALTA + 30, 45);
        roca(x + 250);
        return 330;
      },
      x => {
        roca(x);
        roca(x + 300);
        filaBananas(x + 110, 3, 30, 40);
        return 320;
      },
    ];

    // Los recuerdos quedan en lugares difíciles: si no los alcanza, se pierden hasta la próxima partida
    const PATRONES_RECUERDO = [
      (x, i) => {
        plataforma(x, 130, BAJA);
        plataforma(x + 180, 150, ALTA);
        filaBananas(x + 30, 2, BAJA + 30, 60);
        j.objetos.push({ t: 'recuerdo', i, x: x + 255, h: ALTA + 75 });
        return 330;
      },
      (x, i) => {
        roca(x + 60);
        filaBananas(x - 20, 2, 60, 40);
        j.objetos.push({ t: 'recuerdo', i, x: x + 60, h: 195 });
        filaBananas(x + 120, 2, 60, 40);
        return 200;
      },
    ];

    const generar = () => {
      const x = L.W + 40;
      let ancho;
      if (j.recuerdoPendiente !== null) {
        ancho = PATRONES_RECUERDO[j.recuerdoPendiente % PATRONES_RECUERDO.length](x, j.recuerdoPendiente);
        j.recuerdoPendiente = null;
      } else {
        ancho = PATRONES[Math.floor(Math.random() * PATRONES.length)](x);
      }
      j.distSpawn = ancho + 190 + Math.random() * 160;
    };

    // ---------- Fases ----------
    const actualizarIntro = dt => {
      if (j.tFase === 0) pista.classList.remove('oculto');
      j.tFase += dt;
      const { calma, temblor } = INTRO;
      if (j.tFase > calma && !j.alerta) {
        j.alerta = true;
        j.kong.vy = 300; // brinco del susto
        Sonido.tono(55, temblor, { tipo: 'sawtooth', vol: 0.15 });
        Sonido.tono(880, 0.15, { tipo: 'square', vol: 0.06 });
      }
      if (j.tFase > calma) {
        const f = Math.min(1, (j.tFase - calma) / temblor);
        j.avalancha = -120 + (bordeCarrera() + 120) * f;
      }
      fisicaKong(dt);
      if (j.tFase > calma + temblor) {
        pista.classList.add('oculto');
        decir('¡CORRE!', L.W / 2, L.H * 0.35, 1.2, true);
        cambiarFase('carrera');
      }
    };

    const fisicaKong = dt => {
      const k = j.kong;
      const kx = kongX();
      k.buffer -= dt;
      k.tSalto += dt;
      intentarSalto();

      const hPrevia = k.h;
      k.vy -= GRAVEDAD * dt;
      k.h += k.vy * dt;
      const aterrizar = h => {
        k.h = h;
        k.vy = 0;
        k.saltos = 0;
        k.suelo = true;
        k.coyote = COYOTE;
      };
      k.suelo = false;
      if (k.h <= 0) {
        aterrizar(0);
      } else if (k.vy <= 0) {
        // las plataformas solo frenan cuando cae desde arriba
        for (const p of j.plataformas) {
          if (hPrevia >= p.h - 0.5 && k.h <= p.h && kx > p.x - 10 && kx < p.x + p.w + 10) {
            aterrizar(p.h);
            break;
          }
        }
      }

      if (k.suelo) {
        intentarSalto(); // toque guardado de antes de aterrizar
      } else {
        k.coyote -= dt;
        // se cayó de un borde sin saltar: pasado el coyote time solo le queda el doble salto
        if (k.coyote <= 0 && k.saltos === 0) k.saltos = 1;
      }
    };

    const avanzarMundo = avance => {
      j.recorrido += avance;
      j.plataformas.forEach(p => (p.x -= avance));
      j.plataformas = j.plataformas.filter(p => p.x + p.w > -20);
      j.objetos.forEach(o => (o.x -= avance));
      j.objetos = j.objetos.filter(o => o.x > -60 && !(o.tomado && o.t !== 'roca'));
    };

    const actualizarCarrera = dt => {
      j.tFase += dt;
      const progreso = clamp(j.recorrido / DISTANCIA, 0, 1);
      const objetivo = VEL_INICIAL + (VEL_FINAL - VEL_INICIAL) * progreso;
      j.vel = Math.min(objetivo, j.vel + 500 * dt);
      const avance = j.vel * dt;
      avanzarMundo(avance);
      hudCamino.style.width = `${progreso * 100}%`;
      j.avalancha = bordeCarrera() + Math.sin(reloj * 3) * 6;

      // Recuerdos repartidos por distancia; la meta aparece al final del recorrido
      if (j.recuerdoPendiente === null && j.sigRecuerdo < marcasRecuerdo.length && j.recorrido >= marcasRecuerdo[j.sigRecuerdo]) {
        j.recuerdoPendiente = j.sigRecuerdo++;
      }
      const restante = DISTANCIA - j.recorrido;
      if (!j.metaPuesta && restante <= L.W + 40 - kongX()) {
        j.metaPuesta = true;
        j.objetos.push({ t: 'meta', x: L.W + 40, h: 0 });
      }
      if (!j.metaPuesta) {
        j.distSpawn -= avance;
        if (j.distSpawn <= 0) generar();
      }

      fisicaKong(dt);

      const kx = kongX();
      for (const o of j.objetos) {
        if (o.tomado) continue;
        if (o.t === 'meta') {
          if (o.x <= kx) llegar();
          continue;
        }
        if (Math.abs(o.x - kx) > 28) continue;
        if ((o.t === 'banana' || o.t === 'recuerdo') && Math.abs(j.kong.h + 24 - o.h) < 32) {
          o.tomado = true;
          if (o.t === 'recuerdo') {
            j.encontrados++;
            hudRecuerdos.textContent = `${j.encontrados}/${recuerdos.length}`;
            marcarRecuerdo(o.i);
            mostrarRecuerdo(o.i);
          } else {
            j.bananas++;
            hudBananas.textContent = j.bananas;
            Sonido.pop();
            decir('+1', o.x, piso - o.h, 0.6);
          }
        } else if (o.t === 'roca' && j.kong.h < 18 && Math.abs(o.x - kx) < 20 && j.kong.tSalto > GRACIA) {
          // caja de choque más chica que el dibujo: los roces no cuentan
          chocar();
          return;
        }
      }
    };

    const chocar = () => {
      cambiarFase('choque');
      j.kong.h = 0;
      j.kong.vy = 0;
      Sonido.mal();
      Sonido.tono(90, 0.6, { tipo: 'sawtooth', vol: 0.12, cuando: 0.1 });
      decir('¡PLAF!', kongX(), piso - 90, 1.2);
    };

    const actualizarChoque = dt => {
      j.tFase += dt;
      j.vel = Math.max(0, j.vel - 900 * dt);
      avanzarMundo(j.vel * dt);
      // la avalancha alcanza al gorila aturdido
      if (j.tFase > 0.5) j.avalancha += 380 * dt;
      if (j.avalancha > kongX() + 60 && !j.atrapado) {
        j.atrapado = true;
        const pct = Math.round(clamp(j.recorrido / DISTANCIA, 0, 1) * 100);
        $('.derrota-texto', modalDerrota).textContent =
          `Llegaste al ${pct}% del camino con ${j.bananas} bananas.` +
          (j.encontrados ? ` Los recuerdos que encontraste quedan guardados.` : '');
        setTimeout(() => id === sesion && modalDerrota.classList.remove('oculto'), 500);
      }
    };

    const llegar = () => {
      cambiarFase('llegada');
      Sonido.victoria();
      Confeti.lanzar(100);
      decir('¡ESCAPASTE!', L.W / 2, L.H * 0.35, 3, true);
      const edad = CONFIG.edad;
      const total = estado.recuerdos.length;
      const faltan = recuerdos.length - total;
      setTimeout(() => id === sesion && terminar({
        mensaje: `¡Escapaste de la avalancha!\n` +
          `Juntaste ${j.bananas} bananas${j.bananas >= edad ? `, ¡más que tus ${edad} años!` : '.'}\n` +
          `Encontraste ${total} de ${recuerdos.length} recuerdos.` +
          (faltan ? `\nPuedes volver a jugar este nivel desde el mapa para encontrar ${faltan === 1 ? 'el que falta' : `los ${faltan} que faltan`}.` : ''),
      }), 2600);
    };

    const actualizarLlegada = dt => {
      j.tFase += dt;
      j.vel = Math.max(0, j.vel - 250 * dt);
      avanzarMundo(j.vel * dt);
      j.avalancha -= 300 * dt; // la avalancha se queda atrás
      fisicaKong(dt);
    };

    const actualizar = dt => {
      if (j.fase === 'intro') actualizarIntro(dt);
      else if (j.fase === 'carrera') actualizarCarrera(dt);
      else if (j.fase === 'choque') actualizarChoque(dt);
      else if (j.fase === 'llegada') actualizarLlegada(dt);
      j.textos.forEach(tx => { tx.t -= dt; if (!tx.grande) tx.y -= 40 * dt; });
      j.textos = j.textos.filter(tx => tx.t > 0);
    };

    // ---------- Dibujo (en pixeles de arte: posición de pantalla / PX) ----------
    const dibujarPlataforma = (b, p) => {
      const P = Sprites.PALETA;
      const x0 = Math.round(p.x / PX);
      const y0 = Math.round((piso - p.h) / PX);
      const w = Math.round(p.w / PX);
      // lianas que la sostienen
      b.fillStyle = P.V;
      b.fillRect(x0 + 3, 0, 1, y0);
      b.fillRect(x0 + w - 4, 0, 1, y0);
      b.fillStyle = P.v;
      for (let y = (x0 * 3) % 7; y < y0; y += 7) {
        b.fillRect(x0 + 2, y, 1, 2);
        b.fillRect(x0 + w - 3, y + 3, 1, 2);
      }
      b.fillStyle = P.k;
      b.fillRect(x0, y0, w, 6);
      b.fillStyle = '#c98a4a';
      b.fillRect(x0 + 1, y0 + 1, w - 2, 4);
      b.fillStyle = '#e8b070';
      b.fillRect(x0 + 1, y0 + 1, w - 2, 1);
      b.fillStyle = P.N;
      for (let x = x0 + 6; x < x0 + w - 2; x += 7) b.fillRect(x, y0 + 2, 1, 3);
      // hojas en las puntas
      for (const lado of [x0 - 2, x0 + w - 4]) {
        b.fillStyle = P.v;
        b.fillRect(lado, y0 - 1, 6, 2);
        b.fillStyle = P.V;
        b.fillRect(lado + 1, y0 + 1, 4, 2);
        b.fillRect(lado + 2, y0 + 3, 2, 2);
      }
    };

    const dibujarRecuerdo = (b, o) => {
      const cx = Math.round(o.x / PX);
      const cy = Math.round((piso - o.h) / PX);
      const latido = Math.floor(reloj * 4) % 2;
      circuloPixel(b, cx, cy, 11 + latido, 'rgba(255,126,182,0.35)');
      circuloPixel(b, cx, cy, 11 + latido, '#ff7eb6', 1);
      Sprites.dibujar(b, 'banana', cx - 6, cy - 6, { paleta: DORADA });
      for (let i = 0; i < 3; i++) {
        const a = reloj * 2 + (i * Math.PI * 2) / 3;
        Sprites.dibujar(b, 'chispa', cx + Math.cos(a) * 15 - 2, cy + Math.sin(a) * 15 - 2);
      }
    };

    // Arco de llegada a cuadros
    const dibujarMeta = (b, o) => {
      const P = Sprites.PALETA;
      const x0 = Math.round(o.x / PX) - 4;
      const pisoB = piso / PX;
      const alto = 44;
      const ancho = 30;
      b.fillStyle = P.k;
      b.fillRect(x0 - 1, pisoB - alto, 4, alto);
      b.fillRect(x0 + ancho - 1, pisoB - alto, 4, alto);
      b.fillStyle = P.w;
      b.fillRect(x0, pisoB - alto, 2, alto);
      b.fillRect(x0 + ancho, pisoB - alto, 2, alto);
      for (let y = 0; y < 6; y++) {
        for (let x = 0; x < ancho + 4; x += 2) {
          b.fillStyle = (x / 2 + y) % 2 ? P.k : P.w;
          b.fillRect(x0 - 1 + x, pisoB - alto - 6 + y, 2, 1);
        }
      }
      Sprites.dibujar(b, 'bandera', x0 + ancho - 1, pisoB - alto - 22);
    };

    // La avalancha: una ola de bananas que se revuelca detrás del gorila
    const alturaAvalancha = (x, borde) => Math.round(Math.min(50, 8 + (borde - x) * 1.6 + Math.sin(x * 0.6 + reloj * 10) * 2));
    const dibujarAvalancha = b => {
      const borde = Math.round(j.avalancha / PX);
      if (borde < -6) return;
      const pisoB = piso / PX;
      const P = Sprites.PALETA;
      for (let x = 0; x <= borde; x++) {
        const alto = alturaAvalancha(x, borde);
        b.fillStyle = P.k;
        b.fillRect(x, pisoB - alto - 1, 1, alto + 1);
        b.fillStyle = P.y;
        b.fillRect(x, pisoB - alto, 1, alto);
        b.fillStyle = '#fff3a0';
        b.fillRect(x, pisoB - alto, 1, 1);
        b.fillStyle = P.Y;
        if ((x * 7 + Math.floor(reloj * 20)) % 5 === 0) b.fillRect(x, pisoB - alto + 4 + (x % 9), 1, 2);
        if ((x * 3 + Math.floor(reloj * 14)) % 7 === 0) b.fillRect(x, pisoB - alto + 14 + (x % 13), 1, 2);
      }
      b.fillStyle = P.k;
      b.fillRect(borde + 1, pisoB - alturaAvalancha(borde, borde), 1, alturaAvalancha(borde, borde));
      // bananas revolcándose por toda la cima de la ola
      for (let i = 0, bx = borde - 3; bx > -6; i++, bx = borde - 3 - i * 11 - ((i * 7) % 5)) {
        const salto = Math.abs(Math.sin(reloj * 7 + i * 1.7)) * 9;
        Sprites.dibujar(b, 'banana', bx - 6, pisoB - alturaAvalancha(bx, borde) - 8 - salto, { voltear: i % 2 === 0 });
      }
    };

    const dibujarKong = b => {
      const k = j.kong;
      const kx = kongX() / PX;
      const ky = (piso - k.h) / PX;
      if (j.fase === 'choque' && j.atrapado) return;
      const corriendo = (j.fase === 'carrera' || (j.fase === 'llegada' && j.vel > 0)) && k.vy === 0;
      const trote = corriendo ? Math.floor(j.recorrido / 30) % 2 : 0;
      Sprites.dibujar(b, 'gorila', kx - 8, ky - 16 - trote);
      // estrellitas de mareo después del choque
      if (j.fase === 'choque') {
        for (let i = 0; i < 3; i++) {
          const a = reloj * 6 + (i * Math.PI * 2) / 3;
          Sprites.dibujar(b, 'chispa', kx + Math.cos(a) * 9 - 2, ky - 20 + Math.sin(a) * 3 - 2);
        }
      }
    };

    const dibujar = () => {
      const { b, w, h } = L;
      const pisoB = piso / PX;
      const rb = j.recorrido / PX;
      bandas(b, CIELO, pisoB - 20, w);
      b.fillStyle = CIELO[CIELO.length - 1];
      b.fillRect(0, pisoB - 30, w, 30);

      // sol y nubes
      circuloPixel(b, w - 28, 22, 10, '#fff6e0');
      circuloPixel(b, w - 28, 22, 10, '#ffe27a', 2);
      for (let i = 0; i < 4; i++) {
        const nx = ((i * 80 - rb * 0.1) % (w + 40) + w + 40) % (w + 40) - 20;
        Sprites.dibujar(b, 'nube', nx, 14 + (i % 3) * 12);
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
        if (mundo % 13 === 0) b.fillRect(x, pisoB + 8, 2, 1);
        if (mundo % 17 === 5) b.fillRect(x, pisoB + 12, 1, 1);
      }

      for (const p of j.plataformas) dibujarPlataforma(b, p);

      const balanceo = Math.floor(reloj * 4) % 2;
      for (const o of j.objetos) {
        if (o.t === 'banana') Sprites.dibujar(b, 'banana', o.x / PX - 6, (piso - o.h) / PX - 6 + balanceo);
        else if (o.t === 'recuerdo') dibujarRecuerdo(b, o);
        else if (o.t === 'meta') dibujarMeta(b, o);
        else Sprites.dibujar(b, 'roca', o.x / PX - 8, pisoB - 9);
      }

      dibujarKong(b);
      dibujarAvalancha(b);

      // la pantalla tiembla cuando llega la avalancha y en el choque
      const temblor = (j.fase === 'intro' && j.tFase > INTRO.calma) || (j.fase === 'choque' && j.tFase < 0.3);
      L.presentar(temblor ? Math.round(Math.sin(reloj * 60)) : 0, temblor ? Math.round(Math.cos(reloj * 47)) : 0);

      if (j.fase === 'intro' && j.alerta) {
        textoPixel(L.ctx, '!', kongX(), piso - j.kong.h - 75, { tam: 32, color: '#ef4060' });
      }
      for (const tx of j.textos) {
        L.ctx.globalAlpha = Math.min(1, tx.t * 2);
        textoPixel(L.ctx, tx.texto, tx.x, tx.y, { tam: tx.grande ? 36 : 18, color: tx.grande ? '#ffd23f' : '#fff' });
      }
      L.ctx.globalAlpha = 1;
    };

    let ultimo = performance.now();
    const cuadro = t => {
      if (id !== sesion) return;
      const dt = Math.min(0.033, (t - ultimo) / 1000);
      ultimo = t;
      reloj += dt;
      girando = tactil() && innerHeight > innerWidth;
      aviso.classList.toggle('oculto', !girando);
      if (!pausa && !girando) actualizar(dt);
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

  return { iniciar, detener, opciones };
})();

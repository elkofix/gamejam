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
  const VIAJE = 2.4; // caída tranquila para acompañar la balada
  const CALIFICACIONES = [
    { max: 0.09, texto: 'PERFECT', puntos: 300 },
    { max: 0.16, texto: 'SUPER', puntos: 200 },
    { max: 0.24, texto: 'GOOD', puntos: 100 },
  ];
  let sesion = 0;
  let raf = 0;
  let limpiar = [];

  function calcularMeta(notas) {
    const maximo = notas.reduce((total, n) => total + 300 + (n.duracion ? 150 : 0), 0) + notas.length * (notas.length + 1) * 2.5;
    // Un mapa corto creado en el sandbox también debe permitir superar el nivel.
    return Math.min(CONFIG.cancion.puntosMinimos ?? 15000, Math.ceil(maximo * 0.6));
  }

  function puntosMinimos() {
    return calcularMeta(Ritmo.leer(CONFIG.cancion) ?? Ritmo.original(CONFIG.cancion));
  }

  function generarNotas(beat, duracion, desfase, marcasVoz) {
    if (Array.isArray(marcasVoz) && marcasVoz.length) {
      const pasosVoz = [0, 1, 2, 3, 2, 1];
      return marcasVoz
        .filter(t => Number.isFinite(t) && t >= VIAJE && t < duracion - 1)
        .sort((a, b) => a - b)
        .map((t, i) => ({ t, carril: pasosVoz[i % pasosVoz.length], estado: 0 }));
    }
    // Pasos de ida y vuelta, uno por pulso, con una pausa cada ocho tiempos.
    const pasos = [0, 1, 2, 3, 2, 1, 0];
    const notas = [];
    for (let n = 0; ; n++) {
      const t = desfase + beat * (n + 4);
      if (t >= duracion - 1) break;
      if (n % 8 === 7) continue;
      notas.push({ t, carril: pasos[n % 8], estado: 0 });
    }
    return notas;
  }

  function iniciar(el, terminar, opciones = {}) {
    const id = ++sesion;
    const { archivo, inicio = 0, bpm = 59.34, duracion = 66, desfase = 0, marcasVoz } = CONFIG.cancion || {};
    const beat = 60 / bpm;
    const mapa = Array.isArray(opciones.notas) ? opciones.notas : (Ritmo.leer(CONFIG.cancion) ?? Ritmo.original(CONFIG.cancion));
    let notas = (mapa.length || Array.isArray(opciones.notas) || marcasVoz?.length ? mapa : generarNotas(beat, duracion, desfase))
      .map(n => ({ ...n, duracion: n.duracion || 0, estado: 0 }));
    let grabando = !!opciones.grabando;
    let meta = calcularMeta(notas);

    el.innerHTML = `
      <div class="baile">
        <div class="baile-hud"><span class="baile-puntos">0</span><small class="baile-meta ${opciones.sandbox ? 'oculto' : ''}"></small><span class="baile-combo"></span></div>
        <div class="baile-cancion"><strong></strong><small></small></div>
        <canvas class="lienzo" aria-label="Toca los cuatro carriles o usa D, F, J y K. Mantén pulsadas las notas con cola hasta que termine la barra."></canvas>
        <div class="baile-carga" role="status"><p>Preparando nuestra canción…</p><button class="boton oculto">Tocar para escuchar</button></div>
      </div>`;
    const canvas = $('.lienzo', el);
    const L = crearPixelLienzo(canvas, { escala: PX });
    const hudPuntos = $('.baile-puntos', el);
    const hudCombo = $('.baile-combo', el);
    const hudMeta = $('.baile-meta', el);
    const mostrarMeta = () => { hudMeta.textContent = `Meta: ${meta.toLocaleString('es-CO')}`; };
    mostrarMeta();
    $('.baile-cancion strong', el).textContent = CONFIG.cancion?.titulo || 'Nuestra canción';
    $('.baile-cancion small', el).textContent = CONFIG.cancion?.artista || '';
    const carga = $('.baile-carga', el);
    const botonAudio = $('.boton', carga);
    const ajustar = () => L.ajustar();

    // Reloj: la canción si existe, si no un ritmo generado
    let modo = null;
    let audio = null;
    let ritmo = null;
    let t0 = 0;
    let listo = false;
    let fin = false;
    let posicionPendiente = inicio;
    let reproducirAudio = () => {};
    const usarRitmo = () => {
      if (modo === 'ritmo' || id !== sesion || fin) return;
      if (opciones.sandbox) {
        listo = false;
        $('p', carga).textContent = 'No se pudo cargar la canción. Toca para reintentar.';
        botonAudio.classList.remove('oculto');
        carga.classList.remove('oculto');
        return;
      }
      audio?.pause();
      modo = 'ritmo';
      // El respaldo instrumental necesita su propio patrón regular.
      notas = generarNotas(beat, duracion, desfase);
      meta = calcularMeta(notas);
      mostrarMeta();
      ritmo = Sonido.ritmo(bpm);
      t0 = ritmo.inicio;
      listo = true;
      carga.classList.add('oculto');
    };
    if (archivo) {
      modo = 'audio';
      audio = new Audio(archivo);
      audio.preload = 'auto';
      audio.addEventListener('loadedmetadata', () => {
        if (id === sesion) audio.currentTime = posicionPendiente;
      });
      audio.addEventListener('error', usarRitmo);
      audio.addEventListener('playing', () => {
        if (id !== sesion || fin || modo !== 'audio') return;
        listo = true;
        carga.classList.add('oculto');
      });
      reproducirAudio = () => audio.play().catch(error => {
        if (id !== sesion || fin) return;
        if (error.name === 'NotAllowedError') {
          $('p', carga).textContent = 'Toca para empezar nuestra canción';
          botonAudio.classList.remove('oculto');
        } else {
          usarRitmo();
        }
      });
      botonAudio.addEventListener('click', reproducirAudio);
      if (opciones.autoReproducir !== false) reproducirAudio();
      else carga.classList.add('oculto');
    } else {
      usarRitmo();
    }
    const ahora = () => modo === 'audio'
      ? Math.max(0, (audio.readyState ? audio.currentTime : posicionPendiente) - inicio)
      : !listo ? 0 : Sonido.contexto().currentTime - t0 + desfase;

    const presion = [0, 0, 0, 0];
    const entradas = new Map();
    let juicios = [];
    let puntos = 0;
    let combo = 0;
    let aciertos = 0;
    let ultimo = performance.now();

    // Coordenadas en pixeles de arte
    const escenarioAlto = () => Math.min(84, Math.round(L.h * 0.34));
    const lineaY = () => L.h - 24;
    const carrilX = i => Math.round((i + 0.5) * (L.w / 4));

    const juzgar = (carril, texto) => {
      juicios.push({ carril, texto, t: 0.5 });
      hudPuntos.textContent = puntos;
      hudCombo.textContent = combo > 2 ? `COMBO x${combo}` : '';
    };

    const acertar = (n, cal) => {
      n.estado = 1;
      combo++;
      aciertos++;
      puntos += cal.puntos + combo * 5 + (n.duracion ? 150 : 0);
      if (modo === 'ritmo') Sonido.tono(523 * Math.pow(2, n.carril / 4), 0.08, { tipo: 'sine', vol: 0.05 });
      juzgar(n.carril, n.duracion ? '¡SOSTENIDO!' : cal.texto);
    };

    const tocar = carril => {
      if (fin || !listo) return;
      const t = ahora();
      presion[carril] = 0.15;
      opciones.alPresionar?.(carril, t);
      if (grabando) return;
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
      if (mejor.duracion) {
        mejor.estado = 3;
        mejor.calificacion = cal;
        juzgar(carril, 'MANTÉN');
      } else acertar(mejor, cal);
    };

    const liberar = (carril, cancelado = false) => {
      opciones.alSoltar?.(carril, ahora(), cancelado);
      if (grabando) return;
      for (const n of notas) {
        if (n.estado !== 3 || n.carril !== carril) continue;
        if (!cancelado && ahora() >= n.t + n.duracion - 0.12) acertar(n, n.calificacion);
        else {
          n.estado = 2;
          combo = 0;
          juzgar(carril, 'MUY PRONTO');
        }
      }
    };
    const presionar = (token, carril) => {
      if (entradas.has(token)) return;
      const yaPulsado = [...entradas.values()].includes(carril);
      entradas.set(token, carril);
      if (!yaPulsado) tocar(carril);
    };
    const soltar = (token, cancelado = false) => {
      if (!entradas.has(token)) return;
      const carril = entradas.get(token);
      entradas.delete(token);
      if (![...entradas.values()].includes(carril)) liberar(carril, cancelado);
    };
    const soltarTodo = (cancelado = false) => {
      for (const token of [...entradas.keys()]) soltar(token, cancelado);
    };
    const alTocar = e => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      canvas.setPointerCapture(e.pointerId);
      presionar(`p${e.pointerId}`, clamp(Math.floor(((e.clientX - r.left) / r.width) * 4), 0, 3));
    };
    const alSoltarPuntero = e => soltar(`p${e.pointerId}`, e.type !== 'pointerup');
    const TECLAS = { KeyD: 0, KeyF: 1, KeyJ: 2, KeyK: 3, ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3 };
    const alTeclear = e => {
      if (e.repeat || !(e.code in TECLAS)) return;
      if (e.target.closest('input, select, textarea')) return;
      e.preventDefault();
      presionar(e.code, TECLAS[e.code]);
    };
    const alSoltarTecla = e => soltar(e.code);
    const alPerderFoco = () => soltarTodo(true);
    canvas.addEventListener('pointerdown', alTocar);
    canvas.addEventListener('pointerup', alSoltarPuntero);
    canvas.addEventListener('pointercancel', alSoltarPuntero);
    canvas.addEventListener('lostpointercapture', alSoltarPuntero);
    window.addEventListener('keydown', alTeclear);
    window.addEventListener('keyup', alSoltarTecla);
    window.addEventListener('blur', alPerderFoco);
    window.addEventListener('resize', ajustar);
    limpiar.push(() => {
      window.removeEventListener('keydown', alTeclear);
      window.removeEventListener('keyup', alSoltarTecla);
      window.removeEventListener('blur', alPerderFoco);
      window.removeEventListener('resize', ajustar);
      audio?.pause();
      ritmo?.detener();
    });

    const terminarBaile = () => {
      fin = true;
      if (opciones.sandbox) {
        soltarTodo();
        audio?.pause();
        opciones.alFinal?.();
        return;
      }
      ritmo?.detener();
      if (audio) {
        const bajar = setInterval(() => {
          audio.volume = Math.max(0, audio.volume - 0.1);
          if (audio.volume <= 0) {
            clearInterval(bajar);
            audio.pause();
          }
        }, 100);
        limpiar.push(() => clearInterval(bajar));
      }
      if (puntos < meta) {
        const derrota = document.createElement('div');
        derrota.className = 'modal derrota baile-derrota';
        derrota.setAttribute('role', 'dialog');
        derrota.setAttribute('aria-modal', 'true');
        derrota.setAttribute('aria-labelledby', 'baile-derrota-titulo');
        derrota.innerHTML = `<div class="tarjeta"><h2 id="baile-derrota-titulo">¡Vamos otra vez!</h2><p>Hiciste ${puntos.toLocaleString('es-CO')} puntos.<br>Necesitas ${meta.toLocaleString('es-CO')} para superar el nivel.</p><p class="suave">Sigue los círculos y mantén las notas con cola.</p><button class="boton">Intentar otra vez</button></div>`;
        $('.baile', el).append(derrota);
        const reintentar = $('.boton', derrota);
        reintentar.addEventListener('click', () => {
          detener();
          iniciar(el, terminar, opciones);
        });
        reintentar.focus({ preventScroll: true });
        Sonido.mal();
        return;
      }
      const final = document.createElement('div');
      final.className = 'baile-final';
      final.innerHTML = `<div>${Sprites.img('estrella', 5).repeat(5)}</div><strong>¡LO LOGRASTE!</strong><p>${puntos.toLocaleString('es-CO')} puntos · Meta: ${meta.toLocaleString('es-CO')}</p>`;
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
        if (n.estado === 3 && t >= n.t + n.duracion) acertar(n, n.calificacion);
        if (n.estado === 0 && t - n.t > CALIFICACIONES[CALIFICACIONES.length - 1].max) {
          n.estado = 2;
          combo = 0;
          juzgar(n.carril, 'X');
        }
      }
      juicios.forEach(j => (j.t -= dt));
      juicios = juicios.filter(j => j.t > 0);
      if (t >= duracion + (opciones.sandbox ? 0 : 1)) terminarBaile();
    };

    const dibujar = t => {
      const { b, w, h } = L;
      const tiempo = Math.max(0, t - desfase);
      const pulso = Math.floor(tiempo / beat);
      // Los destellos siguen los mismos acentos vocales que los pasos.
      const acentoVoz = notas.some(n => Math.abs(n.t - t) < 0.12);
      bandas(b, FONDO, h, w);

      // luces del escenario que cambian con cada tiempo
      for (let i = 0; i < 4; i++) {
        if ((pulso + i) % 2) continue;
        b.fillStyle = acentoVoz ? 'rgba(255,200,221,0.13)' : 'rgba(255,255,255,0.04)';
        const x0 = carrilX(i);
        for (let y = 0; y < h; y += 2) b.fillRect(x0 - 2 - Math.floor(y / 8), y, 4 + Math.floor(y / 4), 2);
      }

      // Se balancean abrazados: un ciclo suave cada cuatro pulsos de la canción.
      const escalaPareja = escenarioAlto() >= 70 ? 2 : 1;
      const balanceo = Math.sin(tiempo / (beat * 4) * Math.PI * 2);
      const bx = Math.round(w / 2 - 14 * escalaPareja + balanceo * 2);
      const by = Math.max(10, escenarioAlto() - 30 * escalaPareja);
      b.fillStyle = 'rgba(0,0,0,0.25)';
      b.fillRect(bx - 2, by + 28 * escalaPareja, 32 * escalaPareja, 2);
      b.save();
      b.translate(bx + 14 * escalaPareja, by + 28 * escalaPareja);
      b.rotate(balanceo * 0.035);
      b.translate(-14 * escalaPareja, -28 * escalaPareja);
      b.drawImage(Sprites.lienzo('alejoBaile'), 0, 0, 16 * escalaPareja, 28 * escalaPareja);
      b.drawImage(Sprites.lienzo('isabellaBaile'), 12 * escalaPareja, 0, 16 * escalaPareja, 28 * escalaPareja);
      // Brazos entrelazados sobre los hombros y la cintura.
      b.fillStyle = '#c98a62';
      b.fillRect(10 * escalaPareja, 12 * escalaPareja, 8 * escalaPareja, 2 * escalaPareja);
      b.fillStyle = '#d7a17d';
      b.fillRect(8 * escalaPareja, 16 * escalaPareja, 9 * escalaPareja, 2 * escalaPareja);
      b.restore();
      Sprites.dibujar(b, 'corazon', Math.round(w / 2 + 18 * escalaPareja), by + 3 * escalaPareja + Math.round(balanceo));

      // carriles y aros
      const y0 = lineaY();
      for (let i = 0; i < 4; i++) {
        const x = carrilX(i);
        b.fillStyle = 'rgba(255,255,255,0.12)';
        for (let y = escenarioAlto() + 6; y < y0 - 10; y += 4) b.fillRect(x, y, 1, 2);
        const sostenido = [...entradas.values()].includes(i);
        circuloPixel(b, x, y0, 9, CARRILES[i].x, presion[i] > 0 || sostenido ? 10 : 2);
        circuloPixel(b, x, y0, 10, '#1d0b3a', 1);
        if (notas.some(n => n.carril === i && Math.abs(n.t - t) < 0.12)) {
          circuloPixel(b, x, y0, 12, '#ffc8dd', 1);
        }
      }

      for (const n of notas) {
        if (n.estado === 1 || n.estado === 2) continue;
        const falta = n.t - t;
        if (falta > VIAJE || (falta < -0.24 && n.estado !== 3)) continue;
        const velocidad = (y0 - escenarioAlto() - 8) / VIAJE;
        const y = n.estado === 3 ? y0 : Math.round(y0 - falta * velocidad);
        if (n.duracion) {
          const colaY = Math.max(escenarioAlto() + 7, Math.round(y0 - (n.t + n.duracion - t) * velocidad));
          b.fillStyle = CARRILES[n.carril].X;
          b.fillRect(carrilX(n.carril) - 4, colaY, 8, Math.max(1, y - colaY));
          b.fillStyle = n.estado === 3 ? '#fff6e0' : CARRILES[n.carril].x;
          b.fillRect(carrilX(n.carril) - 2, colaY, 4, Math.max(1, y - colaY));
          b.fillRect(carrilX(n.carril) - 4, colaY, 8, 2);
        }
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
      if (!fin && listo) {
        if (grabando) {
          for (let i = 0; i < 4; i++) presion[i] = Math.max(0, presion[i] - dt);
          if (t >= duracion) terminarBaile();
        } else actualizar(dt, t);
      }
      dibujar(t);
      raf = requestAnimationFrame(cuadro);
    };
    raf = requestAnimationFrame(cuadro);
    return {
      tiempo: ahora,
      reproduciendo: () => !!audio && !audio.paused && !audio.ended,
      reproducir() {
        if (!audio || id !== sesion) return;
        if (ahora() >= duracion) this.buscar(0);
        fin = false;
        reproducirAudio();
      },
      pausar() { audio?.pause(); soltarTodo(); },
      buscar(t) {
        soltarTodo();
        const destino = clamp(t, 0, duracion);
        posicionPendiente = inicio + destino;
        if (audio?.readyState) audio.currentTime = inicio + destino;
        fin = false;
        puntos = combo = aciertos = 0;
        hudPuntos.textContent = '0';
        hudCombo.textContent = '';
        juicios = [];
        notas.forEach(n => { n.estado = n.t < destino - 0.24 ? 2 : 0; });
      },
      establecerNotas(mapa) {
        notas = Ritmo.validar(mapa, CONFIG.cancion).map(n => ({ ...n, estado: n.t < ahora() - 0.24 ? 2 : 0 }));
        meta = calcularMeta(notas);
        mostrarMeta();
        puntos = combo = aciertos = 0;
        hudPuntos.textContent = '0';
        hudCombo.textContent = '';
      },
      grabar(valor) { soltarTodo(); grabando = valor; },
      velocidad(valor) { if (audio) audio.playbackRate = valor; },
    };
  }

  function detener() {
    sesion++;
    cancelAnimationFrame(raf);
    limpiar.forEach(f => f());
    limpiar = [];
  }

  return { iniciar, detener, puntosMinimos };
})();

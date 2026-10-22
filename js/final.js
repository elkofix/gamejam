// Sorpresa final: soplar las velas del pastel que ella decoró y leer la carta
const Final = (() => {
  let stream = null;
  let sesion = 0;

  function mostrar(decoraciones, alReiniciar) {
    const id = ++sesion;
    const el = $('#pantalla-final');
    el.innerHTML = `
      <div class="final-velas">
        <h2>Pide un deseo...</h2>
        <p class="suave">y sopla las velas</p>
      </div>
      ${pastelHTML(decoraciones, true)}
      <div class="final-velas">
        <button class="boton boton-mic">Soplar con el micrófono</button>
        <div class="medidor oculto"><div></div></div>
        <small class="suave">o toca las velas para apagarlas</small>
      </div>
      <div class="final-carta oculto">
        <h1></h1>
        <div class="final-foto"></div>
        <p class="carta panel"></p>
        <p class="firma"></p>
        <div class="pista panel oculto"></div>
        <button class="boton secundario reiniciar">Jugar otra vez</button>
      </div>`;
    mostrarPantalla('pantalla-final');

    const llama = Sprites.hoja([['llama'], ['llama', { voltear: true }]], PASTEL.escala);
    el.querySelectorAll('.llama').forEach(l => (l.style.backgroundImage = `url(${llama})`));
    const velas = [...el.querySelectorAll('.vela')];
    const medidor = $('.medidor', el);
    let celebrado = false;

    const apagar = vela => {
      if (!vela || vela.classList.contains('apagada')) return;
      vela.classList.add('apagada');
      Sonido.tono(900, 0.12, { tipo: 'square', vol: 0.04 });
      if (velas.every(v => v.classList.contains('apagada'))) celebrar();
    };
    velas.forEach(v => v.addEventListener('pointerdown', () => apagar(v)));

    $('.boton-mic', el).addEventListener('click', async e => {
      const boton = e.currentTarget;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        boton.textContent = 'Sin micrófono: toca las velas';
        boton.disabled = true;
        return;
      }
      boton.classList.add('oculto');
      medidor.classList.remove('oculto');
      const c = Sonido.contexto();
      const analizador = c.createAnalyser();
      analizador.fftSize = 512;
      c.createMediaStreamSource(stream).connect(analizador);
      const datos = new Uint8Array(analizador.fftSize);
      let soplando = 0;
      let ultimo = performance.now();
      const escuchar = t => {
        if (celebrado || id !== sesion) return;
        const dt = t - ultimo;
        ultimo = t;
        analizador.getByteTimeDomainData(datos);
        let suma = 0;
        for (const v of datos) suma += ((v - 128) / 128) ** 2;
        const volumen = Math.sqrt(suma / datos.length);
        // el medidor avanza en bloques de 10%
        medidor.firstElementChild.style.width = `${Math.min(10, Math.floor(volumen * 40)) * 10}%`;
        el.classList.toggle('viento', volumen > 0.08);
        if (volumen > 0.12) {
          soplando += dt;
          if (soplando > 180) {
            soplando = 0;
            apagar(velas.find(v => !v.classList.contains('apagada')));
          }
        }
        requestAnimationFrame(escuchar);
      };
      requestAnimationFrame(escuchar);
    });

    function celebrar() {
      if (celebrado) return;
      celebrado = true;
      soltarMicrofono();
      el.classList.remove('viento');
      el.querySelectorAll('.final-velas').forEach(x => x.classList.add('oculto'));
      Confeti.lanzar(200);
      setTimeout(() => Confeti.lanzar(150), 1200);
      Sonido.cumpleanos();

      const carta = $('.final-carta', el);
      $('h1', carta).textContent = `¡Feliz cumpleaños, ${CONFIG.nombre}!`;
      $('.final-foto', carta).append(crearFoto(CONFIG.fotoFinal));
      $('.firma', carta).textContent = CONFIG.firma;
      if (CONFIG.pistaRegalo) {
        const pista = $('.pista', carta);
        pista.innerHTML = `<strong>${Sprites.img('regalo', 2)} Una última pista...</strong><p></p>`;
        $('p', pista).textContent = CONFIG.pistaRegalo;
        pista.classList.remove('oculto');
      }
      $('.reiniciar', carta).addEventListener('click', alReiniciar);
      setTimeout(() => {
        carta.classList.remove('oculto');
        escribir($('.carta', carta), CONFIG.carta, id);
      }, 900);
    }
  }

  // Efecto máquina de escribir; tocar el texto lo completa
  function escribir(nodo, texto, id) {
    let i = 0;
    nodo.addEventListener('click', () => (i = texto.length));
    const paso = () => {
      if (id !== sesion) return;
      i = Math.min(texto.length, i + 1);
      nodo.textContent = texto.slice(0, i);
      if (i < texto.length) setTimeout(paso, texto[i - 1] === '\n' ? 250 : 35);
    };
    paso();
  }

  function soltarMicrofono() {
    stream?.getTracks().forEach(t => t.stop());
    stream = null;
  }

  function detener() {
    sesion++;
    soltarMicrofono();
  }

  return { mostrar, detener };
})();

const SandboxRitmo = (() => {
  let limpiar = () => {};

  function iniciar(el) {
    const cancion = CONFIG.cancion;
    let borrador = Ritmo.leer(cancion, true) ?? [];
    const historial = [];
    const pulsadas = new Map();
    let motor;
    let raf;
    el.innerHTML = `
      <div class="sandbox">
        <div class="sandbox-panel">
          <h2>Sandbox de ritmo</h2>
          <p class="sandbox-ayuda">Toca los carriles o usa D F J K. Mantén para crear una nota larga.</p>
          <div class="sandbox-fila">
            <select aria-label="Modo" class="sandbox-modo"><option value="grabar">Marcar ritmo</option><option value="probar">Probar ritmo</option></select>
            <button class="sandbox-play" type="button">Escuchar y marcar</button>
          </div>
          <div class="sandbox-fila sandbox-transporte">
            <button class="sandbox-atras" type="button" aria-label="Retroceder cinco segundos">−5 s</button>
            <input class="sandbox-posicion" type="range" min="0" max="${cancion.duracion}" step="0.01" value="0" aria-label="Posición en la canción">
            <select aria-label="Velocidad de reproducción" class="sandbox-velocidad"><option value="1">1×</option><option value="0.75">0,75×</option><option value="0.5">0,5×</option></select>
            <output class="sandbox-reloj">0:00</output>
          </div>
          <div class="sandbox-fila sandbox-acciones">
            <button data-accion="deshacer" type="button">Deshacer</button>
            <button data-accion="vaciar" type="button">Vaciar pasos</button>
            <button data-accion="actual" type="button">Cargar ritmo actual</button>
            <button data-accion="original" type="button">Ritmo original</button>
            <button data-accion="guardar" type="button">Guardar y usar</button>
            <button data-accion="exportar" type="button">Exportar JSON</button>
            <button data-accion="importar" type="button">Importar JSON</button>
            <input class="sandbox-archivo oculto" type="file" accept="application/json,.json" aria-label="Importar ritmo">
          </div>
          <p class="sandbox-estado" role="status" aria-live="polite">Tu borrador se conserva en este navegador. Pulsa Escuchar y marcar para empezar.</p>
          <details class="sandbox-editor"><summary>Editar pasos (<span class="sandbox-cantidad">0</span>)</summary><div class="sandbox-lista"></div></details>
        </div>
        <div class="sandbox-juego"></div>
      </div>`;

    const raiz = $('.sandbox', el);
    const modo = $('.sandbox-modo', el);
    const play = $('.sandbox-play', el);
    const posicion = $('.sandbox-posicion', el);
    const estado = $('.sandbox-estado', el);
    const editor = $('.sandbox-editor', el);
    const lista = $('.sandbox-lista', el);
    const archivo = $('.sandbox-archivo', el);
    const mensaje = texto => { estado.textContent = texto; };
    const formato = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
    const clonar = notas => notas.map(n => ({ ...n }));

    function dibujarLista() {
      $('.sandbox-cantidad', el).textContent = borrador.length;
      $('[data-accion="deshacer"]', el).disabled = !historial.length;
      if (!editor.open) return;
      lista.innerHTML = '';
      borrador.forEach((nota, i) => {
        const fila = document.createElement('div');
        fila.className = 'sandbox-nota';
        fila.dataset.indice = i;
        fila.innerHTML = `<label>Segundo<input data-campo="t" type="number" min="0" max="${cancion.duracion}" step="0.01" value="${nota.t}"></label>
          <label>Carril<select data-campo="carril">${['D · Rosa', 'F · Azul', 'J · Amarillo', 'K · Verde'].map((nombre, c) => `<option value="${c}" ${nota.carril === c ? 'selected' : ''}>${nombre}</option>`).join('')}</select></label>
          <label>Mantener (s)<input data-campo="duracion" type="number" min="0" max="${cancion.duracion - nota.t}" step="0.01" value="${nota.duracion}"></label>
          <button type="button" data-borrar="${i}" aria-label="Eliminar paso ${i + 1}">×</button>`;
        lista.append(fila);
      });
    }

    function cambiar(notas, recordar = true) {
      const validas = Ritmo.validar(notas, cancion);
      if (recordar) {
        historial.push(clonar(borrador));
        if (historial.length > 100) historial.shift();
      }
      borrador = validas;
      motor?.establecerNotas(borrador);
      try { Ritmo.guardar(borrador, cancion, true); }
      catch { mensaje('No se pudo guardar el borrador. Exporta JSON para conservarlo.'); }
      dibujarLista();
    }

    function terminarMarca(carril, t, cancelado) {
      const inicio = pulsadas.get(carril);
      pulsadas.delete(carril);
      if (inicio === undefined || cancelado) return;
      const fin = Math.min(t, cancion.duracion);
      const duracion = fin - inicio >= 0.35 ? fin - inicio : 0;
      try {
        cambiar([...borrador, { t: inicio, carril, duracion }]);
        mensaje(`${borrador.length} pasos · ${duracion ? `Nota mantenida de ${duracion.toFixed(2)} s` : 'Toque registrado'}`);
      } catch (e) { mensaje(e.message); }
    }

    motor = NivelBaile.iniciar($('.sandbox-juego', el), () => {}, {
      sandbox: true, autoReproducir: false, grabando: true, notas: borrador,
      alPresionar(carril, t) {
        if (modo.value === 'grabar' && motor.reproduciendo() && t < cancion.duracion) pulsadas.set(carril, t);
      },
      alSoltar: terminarMarca,
      alFinal() { mensaje('Terminó el fragmento. Puedes probarlo, volver atrás o guardar tu ritmo.'); },
    });

    const pausar = () => motor.pausar();
    const buscar = t => { pausar(); motor.buscar(t); };
    play.addEventListener('click', () => {
      if (motor.reproduciendo()) pausar();
      else { Sonido.contexto(); motor.reproducir(); }
    });
    modo.addEventListener('change', () => {
      pausar();
      motor.grabar(modo.value === 'grabar');
      motor.establecerNotas(borrador);
      mensaje(modo.value === 'grabar' ? 'Los nuevos toques se añadirán a tu borrador.' : 'Prueba los pasos y mantén pulsadas las notas con cola.');
    });
    $('.sandbox-velocidad', el).addEventListener('change', e => { pausar(); motor.velocidad(Number(e.target.value)); });
    $('.sandbox-atras', el).addEventListener('click', () => buscar(motor.tiempo() - 5));
    posicion.addEventListener('input', () => buscar(Number(posicion.value)));
    editor.addEventListener('toggle', dibujarLista);
    lista.addEventListener('change', e => {
      const campo = e.target.dataset.campo;
      if (!campo) return;
      pausar();
      const nuevas = clonar(borrador);
      nuevas[Number(e.target.closest('.sandbox-nota').dataset.indice)][campo] = Number(e.target.value);
      try { cambiar(nuevas); mensaje('Paso actualizado.'); }
      catch (error) { mensaje(error.message); dibujarLista(); }
    });
    lista.addEventListener('click', e => {
      const borrar = e.target.closest('[data-borrar]');
      if (!borrar) return;
      pausar();
      cambiar(borrador.filter((_, i) => i !== Number(borrar.dataset.borrar)));
      mensaje('Paso eliminado. Puedes recuperarlo con Deshacer.');
    });
    raiz.addEventListener('click', e => {
      const accion = e.target.closest('[data-accion]')?.dataset.accion;
      if (!accion) return;
      pausar();
      try {
        if (accion === 'deshacer' && historial.length) { cambiar(historial.pop(), false); mensaje('Último cambio deshecho.'); }
        if (accion === 'vaciar') { cambiar([]); mensaje('Listo para grabar desde cero. Deshacer recupera los pasos anteriores.'); }
        if (accion === 'actual') { cambiar(Ritmo.leer(cancion) ?? Ritmo.original(cancion)); mensaje('Ritmo actual cargado en el editor.'); }
        if (accion === 'original') { cambiar(Ritmo.original(cancion)); mensaje('Ritmo original cargado. Guardar y usar lo aplica al juego.'); }
        if (accion === 'guardar') {
          Ritmo.guardar(borrador, cancion);
          mensaje('Guardado. El nivel de baile usará este ritmo en este navegador. Exporta JSON para llevarlo a otro dispositivo.');
        }
        if (accion === 'exportar') {
          const blob = new Blob([JSON.stringify(Ritmo.documento(borrador, cancion), null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const enlace = document.createElement('a');
          enlace.href = url;
          enlace.download = 'ritmo-la-medalla.json';
          document.body.append(enlace);
          enlace.click();
          enlace.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          mensaje('Ritmo exportado. Puedes importarlo en otro navegador o pasármelo para incluirlo en el juego.');
        }
        if (accion === 'importar') archivo.click();
      } catch (error) { mensaje(error.message); }
    });
    archivo.addEventListener('change', async () => {
      const fichero = archivo.files[0];
      if (!fichero) return;
      try {
        if (fichero.size > 500000) throw new Error('El archivo de ritmo es demasiado grande.');
        const notas = Ritmo.importar(await fichero.text(), cancion);
        if (!raiz.isConnected) return;
        cambiar(notas);
        mensaje('Ritmo importado. Pruébalo y pulsa Guardar y usar cuando esté listo.');
      } catch (error) { mensaje(error.message); }
      archivo.value = '';
    });

    let antes = 0;
    function cuadro(ms) {
      if (ms - antes > 100) {
        antes = ms;
        const t = Math.min(motor.tiempo(), cancion.duracion);
        posicion.value = t;
        $('.sandbox-reloj', el).textContent = `${formato(t)} / ${formato(cancion.duracion)}`;
        play.textContent = motor.reproduciendo() ? 'Pausar' : modo.value === 'grabar' ? 'Escuchar y marcar' : 'Probar ritmo';
      }
      raf = requestAnimationFrame(cuadro);
    }
    raf = requestAnimationFrame(cuadro);
    dibujarLista();
    limpiar = () => {
      pausar();
      cancelAnimationFrame(raf);
      NivelBaile.detener();
    };
  }

  return { iniciar, detener() { limpiar(); limpiar = () => {}; } };
})();

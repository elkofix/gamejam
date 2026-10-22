const NIVELES = [
  {
    modulo: () => NivelCocina,
    icono: 'pastelito',
    titulo: 'Cocina con Mamá',
    inspirado: 'Cooking Mama',
    instrucciones: [
      'Toca los huevos para romperlos',
      'Haz círculos con el dedo para batir',
      'Saca el pastel del horno en el momento justo',
      'Decóralo como tú quieras',
    ],
  },
  {
    modulo: () => NivelBananas,
    icono: 'banana',
    titulo: 'La carrera de las bananas',
    inspirado: 'Banana Kong',
    instrucciones: () => [
      `Junta ${CONFIG.edad} bananas, una por cada año`,
      'Toca la pantalla para saltar (dos toques = doble salto)',
      'Esquiva las rocas',
      'En el camino se desbloquean recuerdos',
    ],
  },
  {
    modulo: () => NivelBaile,
    icono: 'bailarina',
    titulo: 'Baila conmigo',
    inspirado: 'Just Dance',
    instrucciones: [
      'Sube el volumen',
      'Toca cada círculo justo cuando llegue a su aro',
      'Sigue el ritmo y encadena combos',
    ],
  },
  {
    modulo: () => NivelPinguinos,
    icono: 'pinguino',
    titulo: 'La montaña de los pingüinos',
    inspirado: 'Bread & Fred',
    instrucciones: [
      'Usa las flechas para moverte y saltar',
      'Estamos atados con una cuerda: si te caes, yo te sostengo',
      'Si quedas colgando, salta para volver a subir',
      'Ojo con el hielo: ¡resbala!',
      'Lleguemos juntos a la cima',
    ],
  },
];

const CLAVE = 'cumple-progreso';
let estado = { nivel: 0, decoraciones: [] };
let nivelActivo = null;
let nivelElegido = 0;

function cargar() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE));
    if (guardado) estado = { ...estado, ...guardado };
  } catch {}
}

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
  } catch {}
}

const dos = n => String(n).padStart(2, '0');

function esperar(fecha) {
  mostrarPantalla('pantalla-espera');
  const FRASES = [
    'Esta sorpresa se abre a la medianoche',
    'Paciencia... vale la pena',
    'No hagas trampa',
    'Ve preparando una sonrisa',
  ];
  let n = 0;
  const tick = () => {
    const falta = fecha - Date.now();
    if (falta <= 0) {
      clearInterval(reloj);
      Confeti.lanzar(120);
      inicio();
      return;
    }
    const seg = Math.floor(falta / 1000);
    const dias = Math.floor(seg / 86400);
    const hms = `${dos(Math.floor((seg % 86400) / 3600))}:${dos(Math.floor((seg % 3600) / 60))}:${dos(seg % 60)}`;
    $('#cuenta').textContent = dias ? `${dias}d ${hms}` : hms;
    if (seg % 6 === 0) $('#espera-frase').textContent = FRASES[n++ % FRASES.length];
  };
  const reloj = setInterval(tick, 1000);
  tick();
}

function inicio() {
  mostrarPantalla('pantalla-inicio');
  $('#boton-empezar').textContent = estado.nivel === 0 ? 'Empezar' : 'Continuar';
}

function mapa() {
  mostrarPantalla('pantalla-mapa');
  const lista = $('#mapa-niveles');
  lista.innerHTML = '';
  const tarjeta = (icono, titulo, detalle, clase, accion) => {
    const b = document.createElement('button');
    b.className = `mapa-nivel ${clase}`;
    b.innerHTML = `<span class="mapa-icono">${icono}</span><span class="mapa-texto"><strong>${titulo}</strong><small>${detalle}</small></span>`;
    b.disabled = clase === 'bloqueado';
    b.addEventListener('click', accion);
    lista.append(b);
  };
  NIVELES.forEach((n, i) => {
    const hecho = i < estado.nivel;
    const actual = i === estado.nivel;
    tarjeta(
      Sprites.img(hecho || actual ? n.icono : 'candado', 3),
      `Nivel ${i + 1}: ${n.titulo}`,
      hecho ? '¡Completado!' : actual ? `Inspirado en ${n.inspirado}` : 'Bloqueado',
      hecho ? 'hecho' : actual ? 'actual' : 'bloqueado',
      () => instrucciones(i),
    );
  });
  const listo = estado.nivel >= NIVELES.length;
  tarjeta(Sprites.img(listo ? 'regalo' : 'candado', 3), 'Sorpresa final', listo ? '¡Ábrela!' : 'Supera los 4 retos', listo ? 'actual' : 'bloqueado', final);
}

function instrucciones(i) {
  nivelElegido = i;
  const n = NIVELES[i];
  $('#inst-icono').innerHTML = Sprites.img(n.icono, 6);
  $('#inst-inspirado').textContent = `Inspirado en ${n.inspirado}`;
  $('#inst-titulo').textContent = n.titulo;
  const pasos = typeof n.instrucciones === 'function' ? n.instrucciones() : n.instrucciones;
  $('#inst-lista').innerHTML = '';
  pasos.forEach(p => {
    const li = document.createElement('li');
    li.textContent = p;
    $('#inst-lista').append(li);
  });
  mostrarPantalla('pantalla-instrucciones');
}

function jugar() {
  const i = nivelElegido;
  Sonido.contexto(); // desbloquea el audio con este toque
  mostrarPantalla('pantalla-nivel');
  nivelActivo = NIVELES[i].modulo();
  const contenedor = $('#nivel-contenedor');
  nivelActivo.iniciar(contenedor, resultado => completado(i, resultado));
}

function salirNivel() {
  nivelActivo?.detener();
  nivelActivo = null;
  $('#nivel-contenedor').innerHTML = '';
}

function completado(i, resultado = {}) {
  salirNivel();
  if (i === estado.nivel) estado.nivel++;
  if (resultado.decoraciones) estado.decoraciones = resultado.decoraciones;
  guardar();
  $('#comp-mensaje').textContent = resultado.mensaje || '';
  $('#comp-nota').textContent = CONFIG.notasNiveles?.[i] || '';
  $('#comp-nota').classList.toggle('oculto', !CONFIG.notasNiveles?.[i]);
  const ultimo = i === NIVELES.length - 1;
  const boton = $('#boton-continuar');
  boton.textContent = ultimo ? 'Abrir mi sorpresa' : 'Siguiente reto';
  boton.onclick = ultimo ? final : mapa;
  mostrarPantalla('pantalla-completado');
  Confeti.lanzar(60);
}

function final() {
  Final.mostrar(estado.decoraciones, () => {
    Final.detener();
    estado = { nivel: 0, decoraciones: [] };
    guardar();
    inicio();
  });
}

function arrancar() {
  cargar();
  document.querySelectorAll('.nombre').forEach(n => (n.textContent = CONFIG.nombre));
  document.querySelectorAll('[data-sprite]').forEach(n => {
    const [nombre, escala, color] = n.dataset.sprite.split(' ');
    n.innerHTML = Sprites.img(nombre, Number(escala), '', color ? { paleta: { r: Sprites.PALETA[color], R: Sprites.PALETA[color.toUpperCase()] } } : undefined);
  });
  $('#boton-empezar').addEventListener('click', mapa);
  $('#boton-jugar').addEventListener('click', jugar);
  $('#boton-volver').addEventListener('click', mapa);
  $('#boton-salir').addEventListener('click', () => {
    salirNivel();
    mapa();
  });

  const ensayo = new URLSearchParams(location.search).has('ensayo');
  const fecha = new Date(CONFIG.fechaCumple).getTime();
  if (!ensayo && Date.now() < fecha) esperar(fecha);
  else inicio();
}

arrancar();

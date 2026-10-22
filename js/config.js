// ============================================================
//  PERSONALIZA AQUÍ  — todo el contenido del juego
// ============================================================

const CONFIG = {
  // Evita emojis en los textos: no combinan con el estilo pixel art.

  // Su nombre o apodo (aparece en saludos y en el pingüino de ella)
  nombre: 'Amor',

  // Tu nombre (el pingüino que la sostiene con la cuerda)
  tuNombre: 'Yo',

  // Años que cumple: es la meta de bananas en el nivel 2
  edad: 25,

  // Momento en que se desbloquea el juego (hora local del celular).
  // Formato: 'AAAA-MM-DDTHH:MM:SS'. Antes de esa hora verá una cuenta regresiva.
  // Para probar antes de tiempo abre la página con ?ensayo al final de la URL.
  fechaCumple: '2026-01-01T00:00:00',

  // Recuerdos que se desbloquean en el nivel de las bananas.
  // Pon las fotos en assets/fotos/ con estos nombres (o cambia los nombres).
  recuerdos: [
    { foto: 'assets/fotos/foto1.jpg', texto: 'Recuerdo 1: cambia este texto en js/config.js' },
    { foto: 'assets/fotos/foto2.jpg', texto: 'Recuerdo 2: por ejemplo, el día que nos conocimos' },
    { foto: 'assets/fotos/foto3.jpg', texto: 'Recuerdo 3: nuestra primera cita' },
    { foto: 'assets/fotos/foto4.jpg', texto: 'Recuerdo 4: ese viaje que nunca vamos a olvidar' },
    { foto: 'assets/fotos/foto5.jpg', texto: 'Recuerdo 5: todas las noches jugando juntos' },
  ],

  // Canción del nivel de baile (mp3 en assets/). Si no existe, suena un ritmo generado.
  //   inicio:   segundo de la canción donde empieza el nivel (ej. el coro)
  //   bpm:      tempo de la canción (búscalo en Google: "nombre canción bpm")
  //   duracion: segundos que dura el nivel
  cancion: { archivo: 'assets/cancion.mp3', inicio: 0, bpm: 110, duracion: 45 },

  // Una nota tuya que aparece al terminar cada nivel
  notasNiveles: [
    'Nota del nivel 1: algo sobre cocinar juntos',
    'Nota del nivel 2: algo sobre sus recuerdos favoritos',
    'Nota del nivel 3: algo sobre bailar juntos',
    'Nota del nivel 4: algo sobre ser equipo',
  ],

  // Foto que aparece junto a la carta final
  fotoFinal: 'assets/fotos/final.jpg',

  // Tu carta de cumpleaños (puedes usar saltos de línea)
  carta: `Escribe aquí tu carta de cumpleaños.

Puede ser tan larga como quieras: se va escribiendo letra por letra.`,

  firma: 'Con todo mi amor, Yo',

  // Pista para encontrar el regalo físico (déjalo vacío '' si no hay)
  pistaRegalo: '',
};

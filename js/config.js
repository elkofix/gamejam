// ============================================================
//  PERSONALIZA AQUÍ  — todo el contenido del juego
// ============================================================

const CONFIG = {
  // Evita emojis en los textos: no combinan con el estilo pixel art.

  // Su nombre o apodo (aparece en saludos y en el pingüino de ella)
  nombre: 'Amor',

  // Tu nombre (el pingüino que la sostiene con la cuerda)
  tuNombre: 'Yo',

  // Años que cumple (aparece en el mensaje final del nivel de las bananas)
  edad: 22,

  // Momento en que se desbloquea el juego (hora local del celular).
  // Formato: 'AAAA-MM-DDTHH:MM:SS'. Antes de esa hora verá una cuenta regresiva.
  // Para probar antes de tiempo abre la página con ?ensayo al final de la URL.
  fechaCumple: '2026-01-01T00:00:00',

  // Recuerdos que se desbloquean en el nivel de las bananas.
  // Pon las fotos en assets/fotos/ con estos nombres (o cambia los nombres).
  recuerdos: [
    { foto: 'assets/fotos/foto1.jpg', texto: 'Ese día en el parque todavía no sabía cuánto ibas a cambiar mi vida.' },
    { foto: 'assets/fotos/foto2.jpg', texto: 'Nuestra primera vez en el sushi fue especial por algo muy simple: estaba contigo.' },
    { foto: 'assets/fotos/foto3.jpg', texto: 'Todavía me río cuando recuerdo que te hackearon el correo. Contigo hasta los imprevistos se vuelven buenos recuerdos.' },
    { foto: 'assets/fotos/foto4.jpg', texto: 'Esta foto parece de un día cualquiera, pero esos ratitos contigo son de mis favoritos.' },
    { foto: 'assets/fotos/foto5.jpg', texto: 'Este es uno de muchos recuerdos que quiero seguir construyendo contigo. Feliz cumpleaños amor' },
  ],

  // Canción del nivel de baile. Los pasos siguen las entradas de la voz de este MP3.
  //   inicio:   segundo de la canción donde empieza el nivel
  //   desfase:  primer pulso respecto al inicio del fragmento, en segundos
  //   duracion: segundos que dura el nivel
  //   notas: tiempos, carriles y duración de los pasos exportados desde el sandbox
  cancion: {
    archivo: 'assets/audio/Camilo & Evaluna Montaner - La Medalla.mp3',
    titulo: 'La Medalla',
    artista: 'Camilo y Evaluna',
    inicio: 0,
    bpm: 59.34,
    desfase: 0.91,
    duracion: 66,
    puntosMinimos: 15000,
    // Mapa importado de ritmo-la-medalla.json. Conserva tiempos, carriles y sostenidos.
    revisionRitmo: 'medalla-5f0964d8b083',
    notas: [
      { t: 2.101, carril: 2, duracion: 0 },
      { t: 3.082, carril: 1, duracion: 0 },
      { t: 4.042, carril: 0, duracion: 0 },
      { t: 5.092, carril: 1, duracion: 0 },
      { t: 6.13, carril: 2, duracion: 0 },
      { t: 7.103, carril: 3, duracion: 0 },
      { t: 8.102, carril: 2, duracion: 0 },
      { t: 9.07, carril: 1, duracion: 0 },
      { t: 10.1, carril: 0, duracion: 0 },
      { t: 11.044, carril: 1, duracion: 0 },
      { t: 12.062, carril: 2, duracion: 0 },
      { t: 13.048, carril: 3, duracion: 0 },
      { t: 14.12, carril: 2, duracion: 0 },
      { t: 15.164, carril: 1, duracion: 0 },
      { t: 16.191, carril: 2, duracion: 0 },
      { t: 17.17, carril: 0, duracion: 0 },
      { t: 18.223, carril: 3, duracion: 0 },
      { t: 19.215, carril: 2, duracion: 0 },
      { t: 20.186, carril: 1, duracion: 0 },
      { t: 21.211, carril: 2, duracion: 0 },
      { t: 22.283, carril: 3, duracion: 0 },
      { t: 23.218, carril: 2, duracion: 0 },
      { t: 24.279, carril: 1, duracion: 0 },
      { t: 26.228, carril: 2, duracion: 0 },
      { t: 27.115, carril: 1, duracion: 0 },
      { t: 28.295, carril: 2, duracion: 0 },
      { t: 29.105, carril: 0, duracion: 0 },
      { t: 30.266, carril: 1, duracion: 0 },
      { t: 31.194, carril: 2, duracion: 0 },
      { t: 32.207, carril: 1, duracion: 1.556 },
      { t: 34.124, carril: 3, duracion: 0 },
      { t: 34.362, carril: 2, duracion: 0 },
      { t: 34.639, carril: 1, duracion: 0 },
      { t: 34.892, carril: 2, duracion: 0 },
      { t: 35.336, carril: 1, duracion: 1.606 },
      { t: 37.731, carril: 2, duracion: 0 },
      { t: 38.3, carril: 1, duracion: 0 },
      { t: 38.66, carril: 2, duracion: 0 },
      { t: 39.012, carril: 1, duracion: 0 },
      { t: 39.238, carril: 2, duracion: 0 },
      { t: 39.732, carril: 3, duracion: 0.367 },
      { t: 40.397, carril: 0, duracion: 0 },
      { t: 40.805, carril: 1, duracion: 0 },
      { t: 41.081, carril: 2, duracion: 0 },
      { t: 41.313, carril: 1, duracion: 0 },
      { t: 41.736, carril: 2, duracion: 0 },
      { t: 42.346, carril: 3, duracion: 0 },
      { t: 42.665, carril: 2, duracion: 0 },
      { t: 43.025, carril: 1, duracion: 0 },
      { t: 43.293, carril: 0, duracion: 0.379 },
      { t: 43.842, carril: 1, duracion: 0 },
      { t: 44.148, carril: 2, duracion: 0 },
      { t: 44.427, carril: 3, duracion: 0 },
      { t: 45.242, carril: 2, duracion: 0 },
      { t: 45.529, carril: 1, duracion: 0 },
      { t: 45.86, carril: 0, duracion: 0 },
      { t: 46.215, carril: 1, duracion: 0 },
      { t: 46.537, carril: 2, duracion: 0 },
      { t: 46.894, carril: 3, duracion: 0 },
      { t: 47.186, carril: 2, duracion: 0 },
      { t: 47.407, carril: 1, duracion: 1.441 },
      { t: 49.46, carril: 2, duracion: 0 },
      { t: 49.778, carril: 1, duracion: 0 },
      { t: 50.09, carril: 3, duracion: 0 },
      { t: 50.497, carril: 0, duracion: 0 },
      { t: 50.829, carril: 1, duracion: 0 },
      { t: 51.128, carril: 2, duracion: 0 },
      { t: 51.444, carril: 1, duracion: 0 },
      { t: 51.611, carril: 3, duracion: 1.285 },
      { t: 53.511, carril: 2, duracion: 0 },
      { t: 53.926, carril: 1, duracion: 0 },
      { t: 54.32, carril: 0, duracion: 0 },
      { t: 54.599, carril: 1, duracion: 0 },
      { t: 54.877, carril: 2, duracion: 0 },
      { t: 55.18, carril: 1, duracion: 0 },
      { t: 55.408, carril: 3, duracion: 1.74 },
      { t: 57.568, carril: 2, duracion: 0 },
      { t: 57.88, carril: 1, duracion: 0 },
      { t: 58.296, carril: 0, duracion: 0 },
      { t: 58.67, carril: 1, duracion: 0 },
      { t: 59.169, carril: 2, duracion: 0.387 },
      { t: 59.48, carril: 1, duracion: 0.522 },
      { t: 60.13, carril: 2, duracion: 0.522 },
      { t: 60.53, carril: 1, duracion: 0.522 },
      { t: 61.31, carril: 2, duracion: 0.522 },
      { t: 62.138, carril: 3, duracion: 0 },
      { t: 62.633, carril: 0, duracion: 0 },
      { t: 62.912, carril: 1, duracion: 0 },
      { t: 63.194, carril: 2, duracion: 0 },
      { t: 63.407, carril: 1, duracion: 0 },
      { t: 63.605, carril: 2, duracion: 1.69 },
      { t: 65.721, carril: 3, duracion: 0 },
    ],
  },

  // Una nota tuya que aparece al terminar cada nivel
  notasNiveles: [
    'Tenía que haber pastel en tu cumpleaños, aunque te tocara prepararlo a ti',
    'Entre el parque, el sushi y tu correo hackeado, ya tenemos unas cuantas historias. Mis favoritas siempre son contigo',
    'Esta canción me recuerda a ti. Por eso tenía que estar en tu regalo',
    'A veces tú me sostienes y a veces yo a ti. Qué bonito hacer equipo contigo, incluso cuando nos toca volver a empezar',
  ],

  // Foto que aparece junto a la carta final
  fotoFinal: 'assets/fotos/final.jpg',

  // Tu carta de cumpleaños (puedes usar saltos de línea)
  carta: `Feliz cumpleaños, amor.

Quería regalarte algo que tuviera un poquito de nosotros. Por eso terminé haciendo este juego: con nuestras fotos, una canción que me recuerda a ti y dos pingüinos intentando llegar juntos sin caerse. Hasta te puse a preparar tu propio pastel.

Mientras lo hacía, me acordé del parque, de nuestra primera vez comiendo sushi y, sí, de cuando te hackearon el correo. Me gusta que tengamos historias que nos dan risa con solo mencionarlas. Y también me gustan esos días en los que no pasa nada especial, pero estamos juntos y eso ya hace que valgan la pena.

Gracias por hacerme un espacio en tu vida, por escucharme y por dejarme compartir tantas cosas contigo. Hay momentos en los que quizá no sé decirte bien lo que siento; espero que todo el cariño que le puse a esto te lo diga un poquito mejor.

Para tus 22 deseo que encuentres cosas que te emocionen, que tengas tiempo para lo que disfrutas y que te sientas muy querida. Yo quiero seguir acompañándote, celebrando lo que te salga bien y haciendo equipo contigo cuando las cosas cuesten.

Te amo, Isabella. Me hace feliz poder celebrar tu vida contigo.`,

  firma: 'Con amor, Alejo',

  // Cambia solo esta URL cuando la API tenga su dirección pública definitiva.
  regalos: {
    api: 'https://pocketful-of-words.lovable.app/api/public/texts',
    pregunta: '¿Cuál es mi juego favorito de Nintendo?',
    respuesta: 'The Legend of Zelda: Breath of the Wild',
    siluetas: [
      { id: 1, imagen: 'assets/regalos/silueta1.png' },
      { id: 2, imagen: 'assets/regalos/silueta2.png' },
      { id: 3, imagen: 'assets/regalos/silueta3.png', oculta: true },
    ],
  },

  // Pista para encontrar el regalo físico (déjalo vacío '' si no hay)
  pistaRegalo: '',
};

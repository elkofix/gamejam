// Pixel art del juego. Cada letra es un color de la PALETA y '.' es transparente.
// Los sprites con `mitad` son simétricos: se dibuja la mitad izquierda y se refleja.
const Sprites = (() => {
  const PALETA = {
    k: '#2a1a2e', w: '#ffffff', W: '#d9d4e6', g: '#a59bb5', G: '#6d6380',
    r: '#ef4060', R: '#a8243f', p: '#ff7eb6', P: '#d9487f', l: '#ffc8dd',
    y: '#ffd23f', Y: '#e8901a', o: '#ff8a3d', b: '#4c8bf5', B: '#2a4fa8',
    c: '#a8e4ff', n: '#9b6238', N: '#6a3d22', v: '#6fcf5a', V: '#2f8f46',
    s: '#ffd3b0', S: '#c98a62', h: '#3a2430', u: '#2f3150', f: '#fff6e0',
    F: '#e6d3a3', m: '#a06cff', M: '#6b3fc4',
  };

  const BAILARINA = [
    '...kk.kk',
    '..khhkhh',
    '..khhhhh',
    '...khhhh',
    '...khsss',
    '...kskss',
    '...kssss',
    '....kkss',
    '....kppp',
    '...kpppp',
    '...kplpp',
    '....kppp',
    '...kpppp',
    '..kppppp',
    '.kpPpPpP',
    '.kkkkkkk',
    '.....ks.',
    '.....ks.',
    '.....ks.',
    '.....ks.',
    '....kmm.',
    '....kkk.',
  ];
  const conBrazos = cambios => BAILARINA.map((f, i) => cambios[i] ?? f);

  const DEF = {
    gorila: {
      mitad: [
        '....kkkk',
        '...knnnn',
        '..knnnnn',
        '..knnnnn',
        '..knSSSS',
        '.knnSkwS',
        '.knnSSSS',
        '.knnSSkk',
        'knnnnSSS',
        'knnnnnSS',
        'knNnnnnn',
        'knNknnnn',
        '.kkknnnn',
        '...knnNk',
        '...knnk.',
        '...kkk..',
      ],
    },
    banana: {
      filas: [
        '........kk..',
        '.......kNk..',
        '......kyYk..',
        '......kyyk..',
        '.....kyyYk..',
        '....kyyyYk..',
        '..kkyyyYk...',
        '.kyyyyYk....',
        'kyyyYYk.....',
        'kYYYkk......',
        '.kkk........',
      ],
    },
    roca: {
      filas: [
        '....kkkkkk......',
        '..kkggggggkk....',
        '.kgggwggggggk...',
        '.kggwggggggGgk..',
        'kgggggggggGGgk..',
        'kggggggggGGGGgk.',
        'kGgggggGGGGGGGk.',
        'kGGGGGGGGGGGGGk.',
        '.kkkkkkkkkkkkkk.',
      ],
    },
    nube: {
      filas: [
        '......wwww......',
        '....wwwwwwww....',
        '..wwwwwwwwwwww..',
        'wwwwwwwwwwwwwwww',
        '.WWWWWWWWWWWWWW.',
      ],
    },
    palmera: {
      mitad: [
        '...vvv....',
        '.vvVVvvv..',
        'vV....vvvv',
        'v...vvvvvv',
        '..vV..vVkn',
        '.vV..vV.kn',
        '.v...v..kn',
        '........kn',
        '........kN',
        '........kn',
        '........kn',
        '........kN',
        '........kn',
        '........kn',
        '........kN',
        '........kn',
        '........kn',
        '........kN',
        '........kn',
        '........kn',
        '........kN',
        '......kknn',
      ],
    },
    pinguino: {
      paleta: { x: '#ff7eb6' },
      mitad: [
        '....kkkk',
        '...kuuuu',
        '..kuuuuu',
        '..kuuwww',
        '..kuwkww',
        '..kuwwwo',
        '.kxxxxxx',
        '.kuxwwww',
        'kuuwwwww',
        'kuuwwwww',
        'kuuwwwww',
        '.kuwwwww',
        '.kuuwwww',
        '..kuuuuu',
        '..kooook',
        '..kkkkk.',
      ],
    },
    bandera: {
      filas: [
        '.kk.........',
        '.kGkkkkkkk..',
        '.kGkrrrrrrk.',
        '.kGkrwrrrrrk',
        '.kGkrrrrrrk.',
        '.kGkRrrrrRk.',
        '.kGkkkkkkk..',
        '.kGk........',
        '.kGk........',
        '.kGk........',
        '.kGk........',
        '.kGk........',
        '.kGk........',
        '.kGk........',
        'kkkkk.......',
        'kGGGk.......',
      ],
    },
    pastelito: {
      mitad: [
        '.......y',
        '.......o',
        '......kr',
        '......kr',
        '..kkkkkk',
        '.kwwwwww',
        '.kwlwwlw',
        '.kplpplp',
        '.kpppppp',
        '.kpprppp',
        '.kpppppp',
        '.kPPPPPP',
        'kWWWWWWW',
        '.kkkkkkk',
      ],
    },
    huevo: {
      mitad: [
        '...kkk',
        '..kfff',
        '.kffff',
        '.kffff',
        'kfffff',
        'kfffff',
        'kfffff',
        'kFffff',
        'kFFfff',
        '.kFFff',
        '..kFFF',
        '...kkk',
      ],
    },
    huevoRoto: {
      mitad: [
        '..kkkk',
        '.kwwww',
        'kwwwkk',
        'kwwkyy',
        'kwwkyy',
        'kwwkYY',
        'kwwwkk',
        '.kwwww',
        '..kkkk',
      ],
    },
    bol: {
      mitad: [
        'kkkkkkkkkkkk',
        'kccccccccccc',
        '.kbbbbbbbbbb',
        '.kbcbbbbbbbb',
        '..kbbbbbbbbb',
        '..kbbbbbbbbb',
        '...kbbbbbbbb',
        '....kBbbbbbb',
        '.....kBBBBBB',
        '......kkkkkk',
      ],
    },
    cuchara: {
      filas: [
        '.kkkk.',
        'kgWWgk',
        'kWwWWk',
        'kWWWgk',
        '.kggk.',
        '..kk..',
        '..nN..',
        '..nN..',
        '..nN..',
        '..nN..',
        '..nN..',
        '..NN..',
      ],
    },
    chef: {
      mitad: [
        '......kkkkkk',
        '....kkwwwwww',
        '...kwwwwwwww',
        '...kwwwwwwww',
        '....kwwwwwww',
        '....kWWWWWWW',
        '....kkkkkkkk',
        '...khhhhhhhh',
        '..khhhhsssss',
        '..khhsssssss',
        '..khssskssss',
        '..khssksksss',
        '..khsppsssss',
        '..khssssskss',
        '..khsssssskk',
        '...kssssssss',
        '....kkssssss',
        '....kkkkssss',
        '..kkrrrrkwww',
        '.krrrrrrrkww',
        '.krrrrrrrrkw',
        'krrrrrrrrrrr',
        'krrrrrrrrrrr',
        'kkkkkkkkkkkk',
      ],
    },
    alejoBaile: {
      paleta: { s: '#c98a62', S: '#a76a49', y: '#cf9b46', Y: '#a67330' },
      filas: [
        '.....kkkkkk.....',
        '....khhhhhhk....',
        '...khhhhhhhhk...',
        '...khhhhhhhhk...',
        '...khsssssssk...',
        '...kssssssssk...',
        '...kssksksssk...',
        '....kssssssk....',
        '....ksswssk.....',
        '.....kSSSk......',
        '....kysssyk.....',
        '...kyyyyyyyk....',
        '..kyyyyyyyyyk...',
        '..kysyyyyysyk...',
        '..kssyyyyyssk...',
        '..kssyyyyyssk...',
        '...kkyyyyykk....',
        '....kyyyyyk.....',
        '....kYYYYYk.....',
        '....kBBBBBk.....',
        '....kBBkBBk.....',
        '....kBBkBBk.....',
        '....kBBkBBk.....',
        '....kBBkBBk.....',
        '....kBBkBBk.....',
        '....kkk.kkk.....',
        '...kwwwkwwwk....',
        '...kkkkkkkkk....',
      ],
    },
    isabellaBaile: {
      paleta: { s: '#d7a17d', S: '#b77f5d', u: '#244853', U: '#17343e' },
      filas: [
        '.....kkkkkk.....',
        '....khhhhhhk....',
        '...khhhhhhhhk...',
        '..khhhhhhhhhhk..',
        '..khhsssssshhk..',
        '..khssssssshhk..',
        '..khkwwkkwwkhk..',
        '..khkkkkkkkhhk..',
        '..khssssssshhk..',
        '..khhkswskhhhk..',
        '..khhksSskhhhk..',
        '...kkuwwwukk....',
        '..kuuuwwwuuuk...',
        '..kusuwwwusuk...',
        '..kssuwwwussk...',
        '..kssuwwwussk...',
        '...kkuwwwukk....',
        '....kuwwwuk.....',
        '....kUUUUUk.....',
        '....kBBBBBk.....',
        '....kBBkBBk.....',
        '....ksskssk.....',
        '....ksskssk.....',
        '....ksskssk.....',
        '....ksskssk.....',
        '....kkk.kkk.....',
        '...kwwwkwwwk....',
        '...kkkkkkkkk....',
      ],
    },
    bailarina: { mitad: conBrazos({ 4: 'ss.khsss', 5: '..skskss', 6: '..skssss', 7: '...skkss' }) },
    bailarina2: { mitad: conBrazos({ 9: '..skpppp', 10: '.s.kplpp', 11: 'ss..kppp' }) },
    orbe: {
      paleta: { x: '#ff7eb6', X: '#d9487f' },
      filas: [
        '....wwww....',
        '..wwxxxxww..',
        '.wxxxxxxxxw.',
        '.wxwwxxxxxw.',
        'wxxwxxxxxxxw',
        'wxxxxxxxxxxw',
        'wxxxxxxxxxXw',
        'wxxxxxxxxxXw',
        '.wxxxxxxxXw.',
        '.wxxxxxXXXw.',
        '..wwXXXXww..',
        '....wwww....',
      ],
    },
    fresa: {
      filas: [
        '...vv...',
        '..vVVv..',
        '.krrrrk.',
        'krryrrrk',
        'krrrryrk',
        '.kryrrk.',
        '..krrk..',
        '...kk...',
      ],
    },
    cereza: {
      filas: [
        '.....V..',
        '....V...',
        '..kkVk..',
        '.krrrrk.',
        'krwrrrrk',
        'krrrrrrk',
        '.kRrrRk.',
        '..kkkk..',
      ],
    },
    flor: {
      filas: [
        '...ll...',
        '..lppl..',
        '.llppll.',
        'lppyyppl',
        'lppyyppl',
        '.llppll.',
        '..lppl..',
        '...ll...',
      ],
    },
    estrella: {
      filas: [
        '...y....',
        '...y....',
        '..ywy...',
        'yywwwyy.',
        '..ywy...',
        '...y....',
        '...y....',
        '........',
      ],
    },
    corazon: {
      filas: [
        '.rr..rr.',
        'rwrrrrrr',
        'rrrrrrrr',
        'rrrrrrRr',
        '.rrrrRr.',
        '..rRRr..',
        '...rr...',
        '........',
      ],
    },
    arandano: {
      filas: [
        '..kkkk..',
        '.kbbbbk.',
        'kbwbbbbk',
        'kbbBBbbk',
        'kbbBBbbk',
        'kbbbbbbk',
        '.kbbbbk.',
        '..kkkk..',
      ],
    },
    candado: {
      mitad: [
        '...kkk',
        '..kggg',
        '.kgk..',
        '.kgk..',
        '.kgk..',
        'kkkkkk',
        'kyyyyy',
        'kyyyyk',
        'kyyyyk',
        'kyyyyy',
        'kYYYYY',
        'kkkkkk',
      ],
    },
    regalo: {
      mitad: [
        '..kkk...',
        '.kyyyk..',
        '.kyk.yk.',
        '..kyyyky',
        'kkkkkkky',
        'kppppppy',
        'kPPPPPPy',
        'kkkkkkky',
        '.kpppppy',
        '.kpppppy',
        '.kpppppy',
        '.kpppppy',
        '.kPppppy',
        '.kPPPPPy',
        '.kkkkkkk',
      ],
    },
    trofeo: {
      mitad: [
        '..kkkkkk',
        'kkkyyyyy',
        'ky.kywyy',
        'ky.kywyy',
        '.kykyyyy',
        '..kkyyyy',
        '...kYyyy',
        '....kYyy',
        '.....kYy',
        '......ky',
        '......kY',
        '.....kYy',
        '...kkkkk',
        '...knnnn',
        '...kkkkk',
      ],
    },
    globo: {
      mitad: [
        '...kkk',
        '..krrr',
        '.krwrr',
        'krrwrr',
        'krrrrr',
        'krrrrr',
        'kRrrrr',
        '.kRrrr',
        '..kRrr',
        '...kkR',
        '....kk',
        '.....g',
        '.....g',
        '.....g',
        '.....g',
      ],
    },
    camara: {
      filas: [
        '....kkkkk.......',
        '...kgggggk......',
        'kkkkkkkkkkkkkkkk',
        'kgggkkkkkkgggyyk',
        'kggkkbbbbkkggggk',
        'kggkbbwbbbkggggk',
        'kggkbbbbbbkggggk',
        'kggkbbbbBbkggggk',
        'kggkkbbBBkkggggk',
        'kgggkkkkkkgggggk',
        'kkkkkkkkkkkkkkkk',
      ],
    },
    vela: {
      filas: [
        'kkkkkk',
        'kwwbbk',
        'kwbbwk',
        'kbbwwk',
        'kbwwbk',
        'kwwbbk',
        'kwbbwk',
        'kbbwwk',
        'kbwwbk',
        'kwwbbk',
        'kwbbwk',
        'kbbwwk',
        'kbwwbk',
        'kkkkkk',
      ],
    },
    llama: {
      filas: [
        '..y...',
        '..yy..',
        '.yyy..',
        '.yooy.',
        'yowwoy',
        '.ywwy.',
        '..kk..',
      ],
    },
    flecha: {
      filas: [
        '...k...',
        '...kk..',
        'kkkkwk.',
        'kwwwwwk',
        'kkkkwk.',
        '...kk..',
        '...k...',
      ],
    },
    flechaArriba: {
      filas: [
        '...k...',
        '..kwk..',
        '.kwwwk.',
        'kkkwkkk',
        '..kwk..',
        '..kwk..',
        '..kkk..',
      ],
    },
    chispa: {
      filas: [
        '..w..',
        '.wyw.',
        'wyyyw',
        '.wyw.',
        '..w..',
      ],
    },
    celular: {
      filas: [
        'kkkkkkkkkk',
        'kGGGkkGGGk',
        'kGccccccGk',
        'kGcwccccGk',
        'kGcwccccGk',
        'kGccccccGk',
        'kGccccccGk',
        'kGccccccGk',
        'kGccccccGk',
        'kGccccccGk',
        'kGccccccGk',
        'kGccccccGk',
        'kGccccccGk',
        'kGGGGGGGGk',
        'kGGGkkGGGk',
        'kkkkkkkkkk',
      ],
    },
    cerrar: {
      filas: [
        'kk...kk',
        'kkk.kkk',
        '.kkkkk.',
        '..kkk..',
        '.kkkkk.',
        'kkk.kkk',
        'kk...kk',
      ],
    },
  };

  const cache = new Map();

  const filas = def => (def.mitad ? def.mitad.map(f => f + [...f].reverse().join('')) : def.filas);

  // Sprite a escala 1 como canvas (para dibujar en los lienzos de los niveles)
  function lienzo(nombre, { paleta, voltear = false } = {}) {
    const clave = `${nombre}|${JSON.stringify(paleta || {})}|${voltear}`;
    if (cache.has(clave)) return cache.get(clave);
    const def = DEF[nombre];
    const f = filas(def);
    const colores = { ...PALETA, ...def.paleta, ...paleta };
    const c = document.createElement('canvas');
    c.width = f[0].length;
    c.height = f.length;
    const ctx = c.getContext('2d');
    f.forEach((fila, y) => [...fila].forEach((ch, x) => {
      if (ch === '.') return;
      ctx.fillStyle = colores[ch];
      ctx.fillRect(voltear ? c.width - 1 - x : x, y, 1, 1);
    }));
    cache.set(clave, c);
    return c;
  }

  function escalar(base, escala) {
    const c = document.createElement('canvas');
    c.width = base.width * escala;
    c.height = base.height * escala;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(base, 0, 0, c.width, c.height);
    return c;
  }

  // Sprite ya escalado como data URL (los navegadores no lo difuminan)
  function url(nombre, escala = 4, opciones) {
    const clave = `url|${nombre}|${escala}|${JSON.stringify(opciones || {})}`;
    if (!cache.has(clave)) cache.set(clave, escalar(lienzo(nombre, opciones), escala).toDataURL());
    return cache.get(clave);
  }

  function img(nombre, escala = 4, clase = '', opciones) {
    const base = lienzo(nombre, opciones);
    return `<img class="px ${clase}" src="${url(nombre, escala, opciones)}" width="${base.width * escala}" height="${base.height * escala}" alt="" draggable="false">`;
  }

  // Varios cuadros lado a lado, para animar con background-position
  function hoja(cuadros, escala) {
    const bases = cuadros.map(([nombre, opciones]) => lienzo(nombre, opciones));
    const c = document.createElement('canvas');
    c.width = bases.reduce((a, b) => a + b.width, 0) * escala;
    c.height = bases[0].height * escala;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    let x = 0;
    for (const b of bases) {
      ctx.drawImage(b, x, 0, b.width * escala, b.height * escala);
      x += b.width * escala;
    }
    return c.toDataURL();
  }

  function dibujar(ctx, nombre, x, y, opciones) {
    ctx.drawImage(lienzo(nombre, opciones), Math.round(x), Math.round(y));
  }

  return { PALETA, DEF, lienzo, url, img, hoja, dibujar, filas, escalar };
})();

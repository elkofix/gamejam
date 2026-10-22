// Efectos y música generados con Web Audio (no necesitan archivos)
const Sonido = (() => {
  let ctx = null;
  let ruido = null;

  function contexto() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tono(freq, dur = 0.15, { tipo = 'sine', vol = 0.2, cuando = 0, en } = {}) {
    const c = contexto();
    const t = en ?? c.currentTime + cuando;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function golpeRuido(t, { filtro = 'highpass', freq = 7000, vol = 0.12, dur = 0.05 }) {
    const c = contexto();
    if (!ruido) {
      ruido = c.createBuffer(1, c.sampleRate * 0.3, c.sampleRate);
      const datos = ruido.getChannelData(0);
      for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1;
    }
    const src = c.createBufferSource();
    const f = c.createBiquadFilter();
    const g = c.createGain();
    src.buffer = ruido;
    f.type = filtro;
    f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(c.destination);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  function bombo(t) {
    const c = contexto();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(0.6, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  // Ritmo bailable de respaldo para el nivel de baile. Devuelve { inicio, detener }
  function ritmo(bpm) {
    const c = contexto();
    const beat = 60 / bpm;
    const inicio = c.currentTime + 0.15;
    const BAJOS = [130.81, 98.0, 110.0, 87.31];
    const ACORDES = [[261.63, 329.63, 392], [246.94, 293.66, 392], [261.63, 329.63, 440], [261.63, 349.23, 440]];
    let n = 0; // medios tiempos programados

    const programar = () => {
      while (inicio + (n * beat) / 2 < c.currentTime + 0.25) {
        const t = inicio + (n * beat) / 2;
        const compas = Math.floor(n / 8) % 4;
        if (n % 2 === 0) {
          bombo(t);
          tono(BAJOS[compas], beat * 0.8, { tipo: 'triangle', vol: 0.25, en: t });
          if ((n / 2) % 2 === 1) golpeRuido(t, { filtro: 'bandpass', freq: 1800, vol: 0.3, dur: 0.12 });
          if (n % 8 === 0) ACORDES[compas].forEach(f => tono(f, beat * 3.5, { tipo: 'sine', vol: 0.05, en: t }));
        } else {
          golpeRuido(t, {});
        }
        n++;
      }
    };
    programar();
    const id = setInterval(programar, 50);
    return { inicio, detener: () => clearInterval(id) };
  }

  // "Cumpleaños feliz" en cajita musical
  function cumpleanos() {
    const G4 = 392, A4 = 440, B4 = 493.88, C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99;
    const notas = [
      [G4, 0.75], [G4, 0.25], [A4, 1], [G4, 1], [C5, 1], [B4, 2],
      [G4, 0.75], [G4, 0.25], [A4, 1], [G4, 1], [D5, 1], [C5, 2],
      [G4, 0.75], [G4, 0.25], [G5, 1], [E5, 1], [C5, 1], [B4, 1], [A4, 2],
      [F5, 0.75], [F5, 0.25], [E5, 1], [C5, 1], [D5, 1], [C5, 3],
    ];
    const pulso = 0.42;
    let t = 0.2;
    for (const [f, d] of notas) {
      tono(f, d * pulso * 1.6, { tipo: 'triangle', vol: 0.18, cuando: t });
      tono(f * 2, d * pulso, { tipo: 'sine', vol: 0.04, cuando: t });
      t += d * pulso;
    }
    return t;
  }

  return {
    contexto,
    tono,
    ritmo,
    cumpleanos,
    pop: () => tono(660 + Math.random() * 120, 0.08, { tipo: 'triangle', vol: 0.15 }),
    bien: () => {
      tono(784, 0.1, { tipo: 'triangle' });
      tono(1047, 0.18, { tipo: 'triangle', cuando: 0.08 });
    },
    mal: () => tono(180, 0.25, { tipo: 'sawtooth', vol: 0.08 }),
    victoria: () => [523, 659, 784, 1047].forEach((f, i) => tono(f, 0.25, { tipo: 'triangle', cuando: i * 0.12 })),
  };
})();

// Mapas de ritmo compartidos por el juego y el sandbox. Tiempos en segundos de canción.
const Ritmo = (() => {
  // Un mapa publicado nuevo sustituye los ritmos activos de la versión anterior.
  // El borrador del editor conserva su propia clave para poder seguir trabajando.
  const clave = (cancion, borrador = false) => `cumple-ritmo-v1:${cancion.archivo}:${cancion.inicio || 0}:${cancion.duracion}` +
    (borrador ? ':borrador' : cancion.revisionRitmo ? `:${cancion.revisionRitmo}` : '');
  const redondear = n => Math.round(n * 1000) / 1000;

  function validar(notas, cancion) {
    if (!Array.isArray(notas) || notas.length > 2000) throw new Error('El ritmo debe tener como máximo 2000 pasos.');
    const lista = notas.map(n => {
      if (!n || !Number.isFinite(n.t) || !Number.isInteger(n.carril) || n.carril < 0 || n.carril > 3 ||
          !Number.isFinite(n.duracion ?? 0) || n.t < 0 || n.t >= cancion.duracion ||
          (n.duracion ?? 0) < 0 || n.t + (n.duracion || 0) > cancion.duracion) {
        throw new Error('Hay un paso con tiempo, carril o duración inválidos.');
      }
      return { t: redondear(n.t), carril: n.carril, duracion: redondear(n.duracion || 0) };
    }).sort((a, b) => a.t - b.t || a.carril - b.carril);
    const finCarril = [-1, -1, -1, -1];
    for (const n of lista) {
      if (n.t < finCarril[n.carril] - 0.001) throw new Error('Dos pasos se superponen en el mismo carril.');
      finCarril[n.carril] = n.t + Math.max(0.05, n.duracion);
    }
    return lista;
  }

  function original(cancion) {
    if (Array.isArray(cancion.notas)) return validar(cancion.notas, cancion);
    const pasos = [0, 1, 2, 3, 2, 1];
    const largas = new Map((cancion.sostenidas || []).map(n => [n.t, n.duracion]));
    return validar((cancion.marcasVoz || []).map((t, i) => ({
      t, carril: pasos[i % pasos.length], duracion: largas.get(t) || 0,
    })), cancion);
  }

  function documento(notas, cancion) {
    return { version: 1, cancion: { archivo: cancion.archivo, inicio: cancion.inicio || 0, duracion: cancion.duracion }, notas: validar(notas, cancion) };
  }

  function importar(texto, cancion) {
    let datos;
    try { datos = JSON.parse(texto); } catch { throw new Error('El archivo no contiene un ritmo JSON válido.'); }
    if (datos?.version !== 1 || datos.cancion?.archivo !== cancion.archivo ||
        datos.cancion?.inicio !== (cancion.inicio || 0) || datos.cancion?.duracion !== cancion.duracion) {
      throw new Error('Este ritmo pertenece a otra canción o a otro fragmento.');
    }
    return validar(datos.notas, cancion);
  }

  function leer(cancion, borrador = false) {
    try {
      const texto = localStorage.getItem(clave(cancion, borrador));
      return texto === null ? null : importar(texto, cancion);
    } catch { return null; }
  }

  function guardar(notas, cancion, borrador = false) {
    localStorage.setItem(clave(cancion, borrador), JSON.stringify(documento(notas, cancion)));
  }

  return { validar, original, documento, importar, leer, guardar };
})();

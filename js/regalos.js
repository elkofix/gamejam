// Adivinanzas de regalos: se envían solo cuando ella pulsa Guardar mi idea.
const Regalos = (() => {
  function montar(raiz) {
    const API = CONFIG.regalos.api;
    const peticiones = new Set();
    let activo = true;

    async function consultar(regaloId, texto) {
      const controller = new AbortController();
      peticiones.add(controller);
      const limite = setTimeout(() => controller.abort(), 15000);
      const url = new URL(API);
      const opciones = { signal: controller.signal };
      if (texto === undefined) url.searchParams.set('regaloId', regaloId);
      else Object.assign(opciones, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regaloId, text: texto }),
      });
      try {
        const res = await fetch(url, opciones);
        let datos;
        try { datos = await res.json(); }
        catch { throw new Error('El servidor no devolvió una respuesta válida. Intenta de nuevo.'); }
        if (!res.ok) throw new Error(typeof datos?.error === 'string' ? datos.error : 'No se pudo completar la solicitud. Intenta de nuevo.');
        if (texto === undefined && !Array.isArray(datos)) throw new Error('No se pudieron leer las ideas guardadas.');
        if (texto !== undefined && (typeof datos?.id !== 'string' || !datos.id)) throw new Error('El servidor no confirmó que la idea se haya guardado.');
        return datos;
      } catch (error) {
        if (error.name === 'AbortError') throw new Error('La conexión tardó demasiado. Tu idea sigue escrita; puedes intentar de nuevo.');
        if (error instanceof TypeError) throw new Error('No hay conexión con el servidor. Tu idea sigue escrita; intenta de nuevo.');
        throw error;
      } finally {
        clearTimeout(limite);
        peticiones.delete(controller);
      }
    }

    function tarjeta(regalo) {
      const claveBorrador = `cumple-adivinanza:${regalo.id}`;
      const tarjeta = document.createElement('article');
      tarjeta.className = 'regalo-tarjeta panel';
      tarjeta.dataset.regalo = regalo.id;
      tarjeta.innerHTML = `
        <h3 tabindex="-1">Silueta ${regalo.id}</h3>
        <figure class="regalo-silueta"><img alt="Silueta ${regalo.id}" loading="lazy" decoding="async"></figure>
        <form class="regalo-formulario">
          <label for="adivinanza-${regalo.id}">¿Qué crees que es?</label>
          <textarea id="adivinanza-${regalo.id}" name="text" rows="3" required maxlength="10000" placeholder="Creo que es…"></textarea>
          <button class="boton" type="submit">Guardar mi idea</button>
          <p class="regalo-estado" role="status" aria-live="polite"></p>
        </form>
        <details class="regalo-historial">
          <summary>Ideas guardadas</summary>
          <p class="regalo-historial-estado" role="status"></p>
          <ol class="regalo-ideas"></ol>
          <button class="enlace regalo-mas oculto" type="button">Ver más ideas</button>
          <button class="enlace regalo-actualizar" type="button">Actualizar</button>
        </details>`;
      const imagen = $('.regalo-silueta img', tarjeta);
      imagen.src = regalo.imagen;
      const form = $('form', tarjeta);
      const campo = $('textarea', form);
      const boton = $('button', form);
      const estado = $('.regalo-estado', form);
      const historial = $('details', tarjeta);
      const estadoHistorial = $('.regalo-historial-estado', tarjeta);
      const lista = $('.regalo-ideas', tarjeta);
      const mas = $('.regalo-mas', tarjeta);
      const actualizar = $('.regalo-actualizar', tarjeta);
      let cargando = false;
      let enviando = false;
      let ideas = null;
      let visibles = 10;
      const confirmadas = new Map();

      try { campo.value = localStorage.getItem(claveBorrador) || ''; } catch {}
      campo.addEventListener('input', () => {
        campo.setCustomValidity('');
        try { localStorage.setItem(claveBorrador, campo.value); } catch {}
      });

      function dibujarIdeas() {
        lista.innerHTML = '';
        const datos = [...new Map([...(ideas || []).map(i => [i.id, i]), ...confirmadas]).values()]
          .filter(i => typeof i.text === 'string')
          .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
        datos.slice(0, visibles).forEach(idea => {
          const item = document.createElement('li');
          const texto = document.createElement('p');
          texto.textContent = idea.text;
          item.append(texto);
          const fecha = new Date(idea.createdAt);
          if (Number.isFinite(fecha.getTime())) {
            const cuando = document.createElement('small');
            cuando.textContent = fecha.toLocaleString('es-CO');
            item.append(cuando);
          }
          lista.append(item);
        });
        estadoHistorial.textContent = datos.length ? `${datos.length} ${datos.length === 1 ? 'idea guardada' : 'ideas guardadas'}` : 'Todavía no hay ideas. Puedes enviar la primera.';
        mas.classList.toggle('oculto', datos.length <= visibles);
      }

      async function cargarIdeas() {
        if (!activo || cargando) return;
        cargando = true;
        actualizar.disabled = true;
        estadoHistorial.textContent = 'Buscando las ideas…';
        try {
          const datos = await consultar(regalo.id);
          if (!activo) return;
          ideas = datos.filter(i => i && typeof i.id === 'string' && typeof i.text === 'string');
          dibujarIdeas();
        } catch (error) {
          if (activo) estadoHistorial.textContent = error.message;
        } finally {
          cargando = false;
          if (activo) actualizar.disabled = false;
        }
      }
      historial.addEventListener('toggle', () => { if (historial.open && ideas === null) cargarIdeas(); });
      actualizar.addEventListener('click', cargarIdeas);
      mas.addEventListener('click', () => { visibles += 10; dibujarIdeas(); });

      form.addEventListener('submit', async e => {
        e.preventDefault();
        if (enviando || !activo) return;
        const texto = campo.value.trim();
        if (!texto || texto.length > 10000) {
          campo.setCustomValidity('Escribe una idea de entre 1 y 10.000 caracteres.');
          campo.reportValidity();
          return;
        }
        campo.setCustomValidity('');
        enviando = true;
        campo.disabled = true;
        boton.disabled = true;
        boton.textContent = 'Guardando…';
        estado.classList.remove('regalo-error');
        estado.textContent = 'Guardando tu idea…';
        try {
          const guardada = await consultar(regalo.id, texto);
          if (!activo) return;
          confirmadas.set(guardada.id, { ...guardada, text: texto });
          campo.value = '';
          try { localStorage.removeItem(claveBorrador); } catch {}
          estado.textContent = '¡Idea guardada! Puedes enviar otra si cambias de opinión.';
          if (historial.open) {
            if (ideas === null) cargarIdeas();
            else dibujarIdeas();
          }
        } catch (error) {
          if (activo) {
            estado.classList.add('regalo-error');
            estado.textContent = error.message;
          }
        } finally {
          enviando = false;
          if (activo) {
            campo.disabled = false;
            boton.disabled = false;
            boton.textContent = 'Guardar mi idea';
          }
        }
      });
      return tarjeta;
    }

    raiz.innerHTML = `<h2>Unas pistas para ti</h2><p class="regalos-intro">Por completar todos los retos, ahora te daré las siluetas de tus regalos para que vayas pensando qué pueden ser.</p><p class="suave">Escribe tus ideas. Puedes intentar varias veces con cada silueta.</p><div class="regalos-lista"></div>`;
    const lista = $('.regalos-lista', raiz);
    CONFIG.regalos.siluetas.filter(r => !r.oculta).forEach(regalo => lista.append(tarjeta(regalo)));
    CONFIG.regalos.siluetas.filter(r => r.oculta).forEach(regalo => {
      const pregunta = document.createElement('button');
      pregunta.type = 'button';
      pregunta.className = 'regalo-pregunta panel';
      pregunta.setAttribute('aria-expanded', 'false');
      pregunta.setAttribute('aria-label', '¿Una pista más?');
      pregunta.innerHTML = '<span aria-hidden="true">?</span><small>¿Una pista más?</small>';
      pregunta.addEventListener('click', () => {
        if (!activo) return;
        const reto = document.createElement('form');
        reto.className = 'regalo-reto panel';
        reto.innerHTML = `<h3>Antes, una pregunta…</h3>
          <label for="respuesta-pista-${regalo.id}"></label>
          <p class="suave" id="ayuda-pista-${regalo.id}">Escribe el nombre completo del juego, sin abreviarlo.</p>
          <input id="respuesta-pista-${regalo.id}" type="text" required maxlength="180" autocomplete="off" autocapitalize="words" spellcheck="false" aria-describedby="ayuda-pista-${regalo.id} estado-pista-${regalo.id}">
          <button class="boton" type="submit">Comprobar</button>
          <p class="regalo-estado" id="estado-pista-${regalo.id}" role="status" aria-live="polite"></p>`;
        $('label', reto).textContent = CONFIG.regalos.pregunta;
        const campo = $('input', reto);
        const estado = $('.regalo-estado', reto);
        const normalizar = texto => texto.normalize('NFKC').toLowerCase().trim().replace(/\s+/g, ' ').replace(/\s*:\s*/g, ':');
        campo.addEventListener('input', () => {
          campo.removeAttribute('aria-invalid');
          estado.textContent = '';
        });
        reto.addEventListener('submit', e => {
          e.preventDefault();
          if (!activo) return;
          if (normalizar(campo.value) !== normalizar(CONFIG.regalos.respuesta)) {
            campo.setAttribute('aria-invalid', 'true');
            estado.classList.add('regalo-error');
            estado.textContent = 'Todavía no… Intenta otra vez con el título completo.';
            return;
          }
          const nueva = tarjeta(regalo);
          reto.replaceWith(nueva);
          $('h3', nueva).focus({ preventScroll: true });
          nueva.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
        });
        pregunta.setAttribute('aria-expanded', 'true');
        pregunta.replaceWith(reto);
        campo.focus();
      }, { once: true });
      lista.append(pregunta);
    });
    return () => {
      activo = false;
      peticiones.forEach(controller => controller.abort());
      peticiones.clear();
    };
  }

  return { montar };
})();

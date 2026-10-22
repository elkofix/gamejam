# Lista para personalizar el juego

Todo el texto se cambia en [`js/config.js`](js/config.js) y los archivos van en [`assets/`](assets/).
La edad ya está puesta en 22.

## Textos en `js/config.js`

- [ ] **`nombre`**: su nombre o apodo. Aparece en el saludo inicial, en la etiqueta de su pingüino y en el título de la carta final.

Apodo: Amor, nombre, isabella
- [ ] **`tuNombre`**: tu nombre o el apodo con que te dice. Es la etiqueta de tu pingüino en el nivel 4.

Alejo
- [ ] **`fechaCumple`**: el día del cumpleaños a medianoche, por ejemplo `'2026-11-15T00:00:00'`. Antes de esa hora ella ve una cuenta regresiva.

- [ ] **`recuerdos`**: 5 textos cortos, uno por foto. Salen en la tarjeta que aparece al atrapar cada banana dorada.
1. Cuando empezó todo: «Ese día en el parque todavía no sabía cuánto ibas a cambiar mi vida».

2. ![alt text](image.png)Una primera vez: «Nuestra primera vez en el sushi fue especial por algo muy simple: estaba contigo».

3. Un momento gracioso: «Todavía me río cuando recuerdo que te hackearon el correo![alt text](image.png). Contigo hasta los imprevistos se vuelven buenos recuerdos».

4. Un día cotidiano: «Esta foto parece de un día cualquiera, pero esos ratitos contigo son de mis favoritos».![alt text](image-1.png)

5. ![alt text](image.png)Este es uno de muchos recuerdos que quiero seguir construyendo contigo. Feliz cumpleaños, Isabella

- [ ] **`notasNiveles`**: 4 notas cortas tuyas, una por nivel. Salen en la pantalla de "¡Nivel superado!". Ideas:
  - Cocina: Como el dia que hicimos pipsa.
  - Bananas: algo sobre sus recuerdos juntos.
  - Baile: su canción, o una vez que bailaron.
  - Pingüinos: algo sobre ser equipo (el nivel ya termina con "te voy a seguir sosteniendo siempre").
- [ ] **`carta`**: tu carta de cumpleaños, tan larga como quieras. Al final se escribe letra por letra.
- [ ] **`firma`**: cómo firmas, por ejemplo "Con todo mi amor, ...".
- [ ] **`pistaRegalo`**: una pista para encontrar el regalo físico. Déjalo en `''` si no hay.
- [ ] **`cancion.inicio`** y **`cancion.bpm`**: el segundo donde empieza el coro y el tempo de la canción (búscalo en Google como "nombre canción bpm").

## Archivos en `assets/`

- [ ] `assets/fotos/foto1.jpg` … `foto5.jpg`: las 5 fotos de los recuerdos, en el mismo orden que los textos. Mejor horizontales.
- [ ] `assets/fotos/final.jpg`: la foto que acompaña la carta final.
- [ ] `assets/cancion.mp3`: una canción especial de ustedes para el nivel de baile.

## Antes de mandarle el link

- [ ] Sin emojis en los textos: rompen el estilo pixel art.
- [ ] Fotos de menos de 500 KB cada una, para que carguen rápido en el celular.
- [ ] Nombres de archivo en minúsculas y exactamente como arriba: GitHub Pages distingue entre `Foto1.JPG` y `foto1.jpg`.
- [ ] Abrir el juego con `?ensayo` al final de la URL y jugarlo completo para revisar todo.
- [ ] Si lo probaste en su celular, presionar "Jugar otra vez" al final para borrar el progreso guardado.
- [ ] El repositorio es público: la carta y las fotos se pueden ver en GitHub. Si te incomoda, súbelas a último momento.

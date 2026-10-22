# 🎂 Juego de cumpleaños

Cuatro niveles inspirados en sus juegos favoritos y una sorpresa final:

1. 🍰 **Cocina con Mamá** (Cooking Mama): romper huevos, batir, hornear y decorar el pastel
2. 🍌 **La carrera de las bananas** (Banana Kong): en horizontal, escapar de una avalancha de bananas hasta la meta, cada vez más rápido. Chocar con una roca es perder. Las bananas doradas guardan recuerdos con fotos; son opcionales y se puede volver a jugar para encontrar las que faltan
3. 💃 **Baila conmigo** (Just Dance): juego de ritmo con su canción
4. 🐧 **La montaña de los pingüinos** (Bread & Fred): dos pingüinos atados con una cuerda suben juntos a la cima
5. 🎁 **Final**: sopla las velas del pastel que ella decoró (con el micrófono o tocándolas) y lee tu carta

## Personalizar

Todo está en [`js/config.js`](js/config.js): su nombre, tu nombre, la edad, la fecha de desbloqueo, los textos de los recuerdos, las notas de cada nivel, la carta y la pista del regalo.

- **Fotos**: guárdalas en `assets/fotos/` como `foto1.jpg` … `foto5.jpg` y `final.jpg`. Es mejor que sean horizontales y de menos de 500 KB cada una.
- **Canción**: guárdala como `assets/cancion.mp3` y ajusta `inicio`, `bpm` y `duracion` en la configuración. Si no hay canción, suena un ritmo generado.

## Probar

Abre `index.html` en el navegador. Si la fecha todavía no llegó, verás la cuenta regresiva. Para saltártela agrega `?ensayo` al final de la URL, por ejemplo: `https://usuario.github.io/repo/?ensayo`.

El progreso se guarda en el navegador. Al terminar, el botón "Jugar otra vez" lo borra (hazlo antes de mandarle el link si lo probaste en su celular).

## Crear tu propio ritmo

Abre `index.html?sandbox` (o agrega `?sandbox` al enlace del juego). También hay un botón **Sandbox de ritmo** en la portada con `?ensayo`.

- Elige **Marcar ritmo**, pulsa **Escuchar y marcar** y toca los carriles o las teclas **D F J K** siguiendo la voz. Un toque crea un punto; mantener más de 0,35 segundos crea una nota larga.
- Puedes pausar, retroceder, cambiar la velocidad y corregir el segundo, carril o duración en **Editar pasos**. **Deshacer** recupera el último cambio.
- **Probar ritmo** permite jugar tu borrador. **Guardar y usar** lo aplica al nivel de baile en ese navegador, sin cambiar el progreso de los niveles.
- **Exportar JSON** descarga el ritmo para conservarlo, importarlo en otro dispositivo o incluirlo después en `CONFIG.cancion.notas`. **Importar JSON** abre ese archivo; pulsa **Guardar y usar** para aplicarlo.
- El borrador se conserva automáticamente en el navegador. **Ritmo original** recupera el mapa incluido con el juego; para aplicarlo pulsa **Guardar y usar**.

## Publicar en GitHub Pages

El workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) publica el juego automáticamente en cada push a `master` (o `main`). También se puede lanzar a mano desde la pestaña **Actions → Publicar en GitHub Pages → Run workflow**.

1. En el repositorio, ve a **Settings → Pages → Source** y elige **GitHub Actions** (solo la primera vez).
2. Haz push. Después de 1 o 2 minutos el juego estará en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.

> Ojo: en una cuenta gratuita, el repositorio de Pages debe ser público, así que cualquiera que lo encuentre podría leer la carta en `config.js`. Ponle un nombre que no dé pistas.

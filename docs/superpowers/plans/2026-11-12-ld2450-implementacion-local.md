# Plan de implementación · Landing local del LD2450

> Para implementar este plan, usar `superpowers:executing-plans` o `superpowers:subagent-driven-development`. Las casillas registran las comprobaciones de cada tarea.

**Objetivo.** Presentar el módulo LD2450 en pantalla completa desde el computador de la exposición, con el despiece y los rótulos sincronizados con el desplazamiento.

**Arquitectura.** Una página estática sirve el video y sus imágenes fijas desde el mismo equipo. El navegador vincula la posición del scroll a la escena y un servidor local entrega el MP4 con soporte de solicitudes por rango.

**Tecnologías.** HTML, CSS, JavaScript, Node.js 24 y FFmpeg para preparar los recursos. Node.js y FFmpeg ya están disponibles en el equipo.

**Spec.** [Spec 02 · Landing de presentación del LD2450](../specs/2026-11-12-ld2450-landing.md).

La revisión visual posterior está reflejada en la Spec 02. Sus indicaciones sobre el encabezado, los rótulos y la eliminación de los indicadores sustituyen el diseño de la primera versión descrito en este plan.

## Restricciones

- `http://localhost:8080` será la dirección de presentación. Servir únicamente en la interfaz local y permitir un puerto alternativo si el 8080 está ocupado.
- Todos los recursos salen del proyecto. Usar tipografía sans serif instalada en el sistema, con Roboto como primera opción si está disponible. El inicio no requiere instalar paquetes.
- Conservar `assets/animacion_scrolleo.mp4` como máster. La proyección prioriza 1920 × 1080, scroll libre y video en silencio.
- Mantener los rótulos «LD2450», «Módulo sensor», «Desplázate para explorar», «Conector de pines» y «Chip».

## Archivos previstos

| Ruta | Responsabilidad |
| --- | --- |
| `index.html` | Escena, video, rótulos y recorrido con imágenes fijas. |
| `styles.css` | Composición de proyección, variantes por tamaño y animaciones. |
| `landing.js` | Posición de scroll, sincronización y recuperación ante fallos de video. |
| `server.mjs` | Servidor local de los archivos de presentación. |
| `assets/ld2450-inicio.webp`, `assets/ld2450-despiece.webp` | Fotogramas de apertura y cierre extraídos del máster. |
| `assets/ld2450-scroll.mp4` | Copia de reproducción sin audio, si el máster presenta saltos en la prueba de scroll. |
| `README.md` | Inicio en Windows y prueba antes de exponer. |

## Puntos de revisión

- Al mover la rueda rápido y cambiar de dirección, el video debe terminar en la posición actual del scroll. Se comprueba en la tarea 3.
- Al refrescar a mitad del recorrido o redimensionar la ventana, la escena debe recuperar la posición correspondiente. Se comprueba en la tarea 3.
- Con movimiento reducido o un error del archivo de video, las imágenes y los rótulos siguen visibles. Se comprueba en la tarea 2.
- Con la red desconectada o el puerto habitual ocupado, se puede iniciar desde el equipo y abrir los recursos locales. Se comprueba en la tarea 1.
- En una ventana más angosta, la placa sigue completa y los rótulos conservan espacio propio. Se comprueba en la tarea 2.

## Tarea 1 · Servir la presentación localmente

- [ ] Crear `server.mjs` con módulos estándar de Node y un `index.html` mínimo que muestre «LD2450». `node server.mjs` usa el puerto `8080` por defecto. `node server.mjs 8081` permite elegir otro. Exponer solo la página y sus recursos, con tipos MIME correctos y soporte `GET` y `HEAD`. Atender rangos de bytes del MP4 para que el navegador pueda buscar fotogramas.
- [ ] Comprobar con `curl.exe -I http://localhost:8080/` que la página devuelve `200`, y con `curl.exe -sS -D - -o NUL -H "Range: bytes=0-1023" http://localhost:8080/assets/animacion_scrolleo.mp4` que el servidor devuelve `206`, `Content-Range` y 1024 bytes. Repetir con la copia para scroll si se genera.
- [ ] Documentar en `README.md` cómo iniciar desde PowerShell, usar el puerto alternativo, entrar a pantalla completa con `F11` y detener el servidor con `Ctrl+C`. Con una instancia en 8080, comprobar que una segunda instancia responde en 8081.

## Tarea 2 · Componer la escena y animar los textos

- [ ] Extraer el fotograma inicial y uno cercano al final con el chip y el conector visibles. Usarlos como imagen de carga y como estados estáticos para movimiento reducido o error de video.
- [ ] Completar `index.html` y crear `styles.css`. El fondo se ajusta con `object-fit: contain` y se integra con el negro de la escena. A 16:9, el título y los rótulos ocupan la izquierda y el despiece queda visible en el centro-derecha. En una ventana angosta, pasar el texto a una zona propia debajo del medio.
- [ ] Crear una apertura breve con el título revelado por una franja azul. En cada rótulo, animar una máscara horizontal, un trazo azul que crece y un deslizamiento leve. Los efectos de los rótulos responden al progreso del video y se invierten con el scroll. El trazo permanece en el área de texto. Con movimiento reducido, presentar el título y los dos estados como imágenes y texto fijos.
- [ ] Revisar la página a 1920 × 1080, 1280 × 720 y en una ventana angosta. Comprobar que la página muestra ambos estados al activar movimiento reducido y al simular un error del MP4. Revisar el contraste y el tamaño del texto desde una distancia comparable a la del salón.

## Tarea 3 · Sincronizar la escena con el scroll

- [ ] En `landing.js`, calcular el progreso de `0` a `1` a partir de la posición de la escena respecto del área visible y la distancia desplazable. La escena queda fija durante un tramo de aproximadamente dos alturas de pantalla. Multiplicar el progreso por la duración utilizable del clip y asignar el tiempo al video pausado y silenciado. Dejar que el navegador gestione la rueda, el panel táctil y el teclado.
- [ ] Agrupar los eventos de desplazamiento y cambio de tamaño en `requestAnimationFrame`. Aplicar también la posición actual cuando el medio esté listo y al restaurar la página. Si hay una búsqueda en curso, conservar el objetivo más reciente y aplicarlo al completarse. Usar el fotograma efectivamente alcanzado para activar los rótulos a los `3,0 s` y `4,5 s`. Ajustar su revelado con el progreso dentro de una ventana corta a partir de cada marca.
- [ ] Probar en el navegador que se puede parar a mitad del giro, continuar, invertir de golpe, llegar al último fotograma y volver al inicio. Confirmar que aparecen primero «Conector de pines» y después «Chip». Repetir con teclado, tras redimensionar y al refrescar a mitad del recorrido.
- [ ] Si el máster se queda atrás durante el desplazamiento, generar `assets/ld2450-scroll.mp4` en H.264, 1920 × 1080, 24 fps, sin pista de audio y con un fotograma clave cada seis cuadros. Verificar sus propiedades y repetir la prueba en ambos sentidos con la copia. Elegir la fuente que responda mejor en el equipo de exposición.
- [ ] Abrir la versión completa en localhost con la conexión a internet desactivada. Recorrer la animación y verificar que todas las solicitudes de la página salen del mismo origen local.

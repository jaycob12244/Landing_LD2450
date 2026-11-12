# Spec 01 · Fotogramas y video del LD2450

## Objetivo

Producir el video de fondo de una landing que acompañará una exposición ante estudiantes y un profesor. Al bajar, el módulo ensamblado gira de vertical a horizontal y se desplaza hacia la derecha. Después, un despiece conceptual destaca el chip y los pines. Al subir, el recorrido se invierte. La pantalla principal será un televisor o proyector y los rótulos breves se añadirán en la página.

Esta spec cubre la preparación de las imágenes, la generación del clip y su revisión. La integración en la landing tendrá su propia spec. La página prevista es estática y el desplazamiento se controla en el navegador, por lo que este flujo prescinde de backend y base de datos.

## Referencia y composición

- El punto de partida es `frame inicial.jpg`, una imagen vertical de 1792 × 2400 generada en Gemini. La placa azul está centrada, de frente y sobre un fondo casi negro. Los detalles de la imagen sirven como referencia visual. Cualquier identificación técnica o asignación de pines para los rótulos se verificará por separado contra documentación del módulo.
- Los dos fotogramas se preparan en horizontal 16:9 para proyección. Para el inicial se amplía el lienzo lateralmente alrededor del original, con la placa vertical y centrada. Usar las mismas dimensiones en ambos archivos. 1920 × 1080 es el objetivo de entrega para proyección si las herramientas permiten exportarlo.
- Con cámara frontal fija, la placa ensamblada gira 90° en sentido horario dentro del plano de la imagen y se desplaza del centro hacia el centro-derecha. Su extremo superior original queda a la derecha. El tercio izquierdo queda libre para rótulos. La escala y la iluminación se mantienen durante el giro y el despiece.
- Para la primera prueba, el chip cuadrado oscuro del tercio inferior original se separa hacia arriba y el conector blanco inferior, con sus pines, hacia abajo. Cada pieza conserva la posición horizontal de su huella de montaje tras el giro. La hilera negra, ahora a la derecha, queda montada. El conector blanco se eligió por su contraste sobre el fondo oscuro. Si la exposición se refiere a la hilera negra, se ajustan su identificación y su trayectoria en ambos prompts.

## Prompt para preparar el fotograma inicial horizontal en Gemini

Adjunta `frame inicial.jpg`. Guarda el resultado como `ld2450-inicial-16x9.png`.

> Edita la imagen adjunta y entrégala en formato horizontal 16:9. Amplía el lienzo a izquierda y derecha prolongando el mismo fondo casi negro y su degradado suave. Conserva íntegra y centrada la placa azul, vertical, ensamblada y vista de frente. Mantén su tamaño relativo a la altura del cuadro, su proporción, posición, iluminación, color, textura y componentes. Conserva el margen visible arriba y abajo. Los bordes laterales deben quedar limpios, con espacio libre para futuros rótulos. Sin texto añadido, efectos, marcas de agua generadas ni cambios en la placa.

Si Gemini altera la placa o exporta otra relación de aspecto, prepara el lienzo 16:9 en un editor de imágenes, centrando y ajustando proporcionalmente el original a la altura del lienzo y extendiendo solo el fondo hacia los lados.

## Prompt para el fotograma final en Gemini

Adjunta `ld2450-inicial-16x9.png` como imagen a editar. Guarda el resultado como `ld2450-final-16x9.png`.

> Edita la imagen adjunta para crear el fotograma final de un despiece conceptual del LD2450. Conserva el formato horizontal 16:9, el fondo casi negro y la vista frontal. Gira la placa 90° en sentido horario dentro del plano de la imagen y desplázala hacia el centro-derecha. La placa debe quedar horizontal, con la hilera negra original en el extremo derecho. Mantén el tamaño y las proporciones de la placa y deja libre el tercio izquierdo para rótulos.
>
> Con la placa ya horizontal, coloca el chip cuadrado negro por encima de su huella de montaje y el conector blanco por debajo de la suya, como una sola pieza con sus cuatro pines visibles. Ambas piezas conservan la orientación que tenían al terminar el giro de la placa. Deja un espacio oscuro visible entre cada pieza y la placa. Mantén la hilera negra montada y conserva los demás componentes, las pistas, los orificios y el contorno. Muestra todo el conjunto con margen alrededor. Sin texto añadido, flechas, piezas duplicadas ni efectos de energía.

## Prompt para el video en Google Flow

En Flow web, selecciona un modelo que permita asignar ambos fotogramas y carga el PNG ensamblado como inicial y el PNG desarmado como final. Para la primera prueba, usa 16:9 y aproximadamente 6 segundos si el modelo ofrece esa duración. El navegador usará el tiempo del clip como recorrido de la animación. Los segundos del archivo no fijan la duración de la exposición.

> Anima la transición entre los fotogramas en una sola toma con cámara frontal fija. Empieza con la placa vertical, centrada y totalmente ensamblada. Primero, gira el módulo completo 90° en sentido horario dentro del plano de la imagen mientras lo desplazas suavemente hacia el centro-derecha. La hilera negra debe terminar a la derecha. Todas las piezas permanecen montadas hasta que la placa alcanza su posición horizontal. Después, la placa se detiene, el chip cuadrado se desliza hacia arriba y el conector blanco se desliza hacia abajo como un solo bloque con sus pines. Cada pieza conserva su orientación y su tamaño durante la separación. Termina en la composición del fotograma final. Mantén constantes el fondo, la iluminación y la escala de la placa. Usa trayectorias continuas, sin rebotes, cortes, zoom, texto ni efectos de energía.

El video se usará en silencio. Si la exportación incluye audio, se puede silenciar al integrarlo. La ayuda de Flow explica cómo asignar los fotogramas de inicio y fin. [Ayuda oficial de Google Flow](https://support.google.com/flow/answer/16353334)

## Criterios de aceptación

1. Ambos fotogramas son 16:9, tienen las mismas dimensiones y muestran la placa completa. El inicial muestra la placa vertical y centrada. El final la muestra horizontal y en el centro-derecha, con sus proporciones y escala visual conservadas.
2. En el fotograma final el chip queda arriba y el conector abajo, con una franja de fondo entre cada pieza y la placa. El chip y los pines se distinguen desde el fondo del salón o a una distancia comparable. El tercio izquierdo queda libre para texto.
3. En el clip, la placa termina de girar y desplazarse antes del despiece. Durante la separación, la placa queda quieta y las piezas conservan su forma sin duplicarse, saltar ni taparse.
4. Al revisar el clip en reversa, primero se ensamblan las piezas y después el módulo gira hasta su posición vertical. Si la transición deforma la placa o desprende las piezas durante el giro, se puede dividir en dos clips. Usa una imagen intermedia con la placa horizontal, desplazada y todavía ensamblada. El mismo fotograma debe cerrar el clip del giro y abrir el del despiece.
5. La entrega para integrar en la landing incluye los dos PNG de referencia, el video final en MP4 y los tiempos del clip en los que se distinguen las dos piezas. Esos tiempos servirán para colocar los rótulos durante el recorrido.

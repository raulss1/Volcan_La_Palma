Vídeo demostrativo: https://www.youtube.com/watch?v=mwtayRmbOXQ

Visualización 3D de la evolución de los ríos de lava del volcán de La Palma

Este proyecto implementa una visualización tridimensional, utilizando Three.js, de la evolución de los ríos de lava generados durante el proceso eruptivo del volcán de Cumbre Vieja (La Palma). El sistema reproduce el desarrollo temporal de los flujos de lava a lo largo de diez días, empleando datos geoespaciales y un mapa de elevación para ajustar de forma realista la geometría sobre el terreno.

Descripción general

El código genera un entorno 3D interactivo compuesto por:

  - Un plano topográfico basado en una imagen de textura y un mapa de elevación (displacement map), que representa la superficie real del terreno.
  - Un conjunto creciente de tubos que representan los ríos de lava, actualizados día a día según un archivo CSV.
  - Una interfaz temporal, que muestra la fecha correspondiente al estado acumulado de los flujos.
  - El usuario puede interactuar con la escena mediante controles orbitales que permiten rotación, zoom y desplazamiento de la cámara.

Componentes principales del sistema
1. Escena y renderizado

La escena se monta con Three.js, incluyendo iluminación ambiental y direccional, además de una cámara con perspectiva y controles OrbitControls. El renderizado se actualiza de forma continua mediante un bucle de animación.

2. Mapa topográfico con desplazamiento

El terreno se genera a partir de:

  - Una textura base (mapa.png).
  - Un mapa de elevación (mapa_elevacion.png) del cual se extraen valores RGB para estimar la altura del terreno.

El plano utiliza un material con displacementMap para deformar la malla según la elevación.

3. Carga y procesamiento del archivo CSV

El archivo volcan.csv contiene, para cada fecha, un conjunto de puntos pertenecientes a distintos ríos de lava. Cada fila incluye:

  - Fecha
  - ID del río
  - ID del punto
  - Coordenadas (x, y, z)
  - Ancho del río

El sistema:

  - Agrupa los datos por fecha.
  - Ordena los puntos de cada río.
  - Construye una representación acumulativa día a día.

Así se consigue que los ríos se vayan extendiendo progresivamente siguiendo la cronología real.

4. Generación y visualización de los ríos de lava

Cada río se genera mediante:

  - Una curva Catmull–Rom construida a partir de los puntos acumulados.
  - Una geometría tubular (TubeGeometry) cuyo radio se ajusta según el ancho proporcionado en el CSV.
  - Un material con color, transparencia y un efecto de pulsación que simula actividad térmica.

Los tubos se añaden a la escena de manera progresiva a lo largo de la animación.

5. Línea temporal y animación

El sistema avanza de forma automática por cada uno de los días disponibles:

  - Cada intervalo de fotogramas equivale a un día.
  - Se añaden los nuevos segmentos correspondientes a esa fecha.
  - Se actualiza en pantalla la fecha correspondiente.

Este mecanismo permite observar la expansión de los ríos de lava a lo largo de los diez días analizado

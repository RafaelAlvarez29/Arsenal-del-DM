# Arsenal del DM

**Un mapa táctico interactivo y una herramienta de gestión para Dungeon Masters de juegos de rol de mesa (TTRPG).**

Este proyecto es una aplicación web diseñada desde cero para proporcionar a los Directores de Juego una solución ligera, rápida y altamente visual para gestionar combates, exploración y el estado de los personajes en sus campañas de Dungeons & Dragons, Pathfinder u otros TTRPG.

![addm 1](https://github.com/user-attachments/assets/0a0e5fb4-2713-4629-ae30-e1a5beada031)


---

## ✨ Características Principales

*   **Mapa Táctico Interactivo:** Carga cualquier imagen como mapa de fondo y mueve las fichas de personajes y enemigos con total libertad.
*   **Niebla de Guerra Dinámica (Fog of War):**
    *   **Visión Automática:** Las fichas de los jugadores revelan automáticamente el mapa según su radio de visión definido.
    *   **Pincel de Niebla Manual:** El DM puede "pintar" o "borrar" manualmente la niebla para revelar áreas secretas o corregir la visibilidad.
    *   **Descubrimiento de Enemigos:** Los enemigos permanecen ocultos hasta que entran en la línea de visión de un jugador.
*   **Gestión Avanzada de Fichas:**
    *   Crea fichas personalizadas con nombre, letra identificadora, color, borde, visión, turno, vida y notas de campaña.
    *   Edita cualquier ficha directamente desde el panel de control haciendo clic sobre ella en el mapa.
    *   **Controles de Vida Interactivos:** Modifica la vida de los personajes con botones de acceso rápido y animaciones visuales de daño/curación.
*   **Lista de Turnos Ordenada:** El panel lateral muestra todas las fichas ordenadas por su iniciativa, proporcionando un claro orden de combate.
*   **Herramientas para el DM:**
    *   **Rejilla Personalizable:** Superpón una rejilla en el mapa y ajusta su tamaño, color y opacidad.
    *   **Reseteo de Niebla:** Reinicia completamente la niebla de guerra con un solo clic.
*   **Persistencia de Sesión:** Guarda y carga el estado completo de tu escena (mapa, fichas, niebla revelada) directamente en el navegador usando LocalStorage. ¡No pierdas nunca tu preparación!
*   **Interfaz Temática y Responsiva:** Diseño de fantasía oscuro y elegante, con todos los controles agrupados en secciones desplegables para una interfaz limpia.

## 🛠️ Tecnologías Utilizadas

*   **HTML5:** Para la estructura semántica de la aplicación.
*   **CSS3:** Para el diseño, las animaciones y la estética personalizada, utilizando Flexbox, Grid y pseudo-elementos.
*   **JavaScript (Vanilla JS):** Para toda la lógica de la aplicación, incluyendo la manipulación del DOM, la gestión del estado, la interacción con el Canvas y los eventos de usuario.
   
![image](https://github.com/user-attachments/assets/2ede5ed1-1431-4849-8c17-15f569a05b74)


## 🚀 Cómo Usar

1.  **Descarga los archivos:** Clona este repositorio o descarga los archivos `index.html`, `style.css` y `script.js`.
2.  **Abre `index.html`:** Simplemente abre el archivo `index.html` en tu navegador web preferido (Chrome, Firefox, etc.). ¡No se necesita servidor!
3.  **¡Empieza a dirigir!**
    *   Usa el panel de la izquierda para cargar una imagen de mapa.
    *   Añade las fichas de tus jugadores y enemigos.
    *   Activa la "Visión Dinámica" para sumergir a tus jugadores en la exploración.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Si tienes ideas para nuevas características, mejoras en la interfaz o correcciones de bugs, por favor:
1.  Haz un "Fork" del repositorio.
2.  Crea una nueva rama para tu característica (`git checkout -b feature/nombre-caracteristica`).
3.  Haz "Commit" de tus cambios (`git commit -am 'Añade nueva característica'`).
4.  Haz "Push" a la rama (`git push origin feature/nombre-caracteristica`).
5.  Abre un "Pull Request".


## 🖼️ Galería de Características

A continuación, un vistazo a las herramientas que te esperan en el Grimorio del Guardián.

### El Mapa Táctico Interactivo
![addm 2](https://github.com/user-attachments/assets/40a0e284-2a92-42aa-b628-a2adad4f3a19)

El corazón de la aplicación es su **mapa táctico totalmente interactivo**. Carga cualquier imagen, desde un dungeon detallado hasta un mapa del mundo, y da vida a tus escenas. Las fichas se pueden arrastrar y soltar con fluidez, permitiendo una representación visual y dinámica del combate y la exploración en tiempo real.

---

### Niebla de Guerra Dinámica y Envolvente
![niebla de guerra dinamica y envolvente](https://github.com/user-attachments/assets/7b47ce42-7452-4f43-9b4f-03f212636922)

Aumenta la inmersión y el misterio con un sistema de **Niebla de Guerra dual**. La visión de los jugadores revela el mapa automáticamente a medida que exploran, mientras que los enemigos permanecen ocultos en la oscuridad hasta ser descubiertos. Además, como DM, tienes control total con un **pincel manual** para revelar áreas secretas, pasadizos ocultos o corregir la visibilidad a tu antojo.

---

### Gestión Detallada de Personajes
![gestion de personajes detallada](https://github.com/user-attachments/assets/8bb29b41-07a9-4c7b-91dd-f03a3fc9e55a)

Cada ficha es una **hoja de personaje simplificada**. Al seleccionar una unidad, accedes a un panel de edición completo donde puedes gestionar su nombre, iniciativa, vida máxima y actual, visión y notas de campaña. Los **controles de vida interactivos**, con animaciones y efectos de sonido, hacen que la gestión del combate sea rápida, visual y satisfactoria.

---

### Lista de Combate y Orden de Turno
![image](https://github.com/user-attachments/assets/2124d677-c352-4047-9f40-b535c12c6cfa)

Mantén el ritmo del combate sin esfuerzo. El panel lateral muestra una **lista de todas las unidades en el tablero, ordenada automáticamente por su valor de iniciativa**. De un solo vistazo, sabrás a quién le toca actuar, su estado general (vida actual/máxima) y podrás seleccionar rápidamente cualquier personaje para ver sus detalles.

---

### Herramientas y Personalización
![herramienta y perzonalizacion](https://github.com/user-attachments/assets/34c1ee4b-8c88-4151-a7a1-8acf9df3adb0)

Adapta la herramienta a tu estilo de juego. Activa una **rejilla superpuesta** y personaliza su tamaño de celda, color y opacidad para facilitar el movimiento táctico. Todas las herramientas y paneles están organizados en **secciones desplegables** para mantener una interfaz limpia y enfocada en lo que más importa: la historia.

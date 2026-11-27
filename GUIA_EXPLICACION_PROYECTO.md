# Guía Maestra para el Equipo: Cómo Entender, Ejecutar y Sustentar el Simulador UPC

> **Universidad Popular del Cesar (UPC)** • Facultad de Ingenierías y Tecnologías  
> **Propósito de este documento:** Que cualquier compañero del grupo pueda instalar, entender cada carpeta/archivo, practicar con el simulador y defender cualquier pregunta del profesor o jurado con total seguridad.

---

## 1. Resumen Ejecutivo: ¿Qué Hicimos y Por Qué Destaca?

Construimos un **Laboratorio Virtual Interactivo de Electromagnetismo (2D y 3D)** que cubre todo el contenido de Física Electromagnética de la UPC en **6 salas especializadas**.

**¿Por qué no es una simple animación?**
Porque debajo de los gráficos hay un **motor numérico real en el Sistema Internacional (SI)** separado en `src/fisica/`, respaldado por **120 pruebas automatizadas** (`npm test`):
- Traza líneas de campo con **Runge-Kutta de 4.º orden (RK4)** y mapas de potencial con interpolación bilineal suave.
- Integra flujo eléctrico en 2D y cuerpos 3D cerrados verificando el **Teorema de la Divergencia**.
- Modela condensadores con **corrección de borde de Kirchhoff** y redes en **Serie y Paralelo**.
- Comprueba numéricamente la **Ley de Ampère** ($\oint_C \mathbf{B}\cdot d\mathbf{l} = \mu_0 I_{\text{enc}}$) sobre una curva cerrada arrastrable.
- Integra partículas 3D con el **Algoritmo Simpléctico de Boris** (estándar en física de plasmas porque conserva la energía cinética).
- Integra flujo magnético 3D en bobinas mediante **Cuadratura de Gauss-Legendre de 32 nodos** (error $< 0.06\%$).

---

## 2. Cómo Abrir el Proyecto (En Internet o en tu Computador)

### Opción A — Sin instalar nada (desde celular, tablet o PC)
Abre directamente el enlace oficial desplegado en producción:
- **https://simulador-electromagnetismo-upc.vercel.app**
- También puedes compartir un enlace directo a una sala específica usando el botón de **Compartir** en la barra superior (ejemplo: `?sala=faraday&vista=lab`).

### Opción B — Correr el código fuente localmente en tu PC
1. Instala **Node.js** (versión 20 o superior) desde https://nodejs.org.
2. Abre la carpeta del proyecto en **VS Code** (ya sea descomprimiendo `Simulador_Electromagnetismo_UPC_CodigoFuente.zip` o clonando el repositorio de GitHub).
3. Abre la terminal en VS Code (`Ctrl + Ñ`) y ejecuta:
   ```bash
   npm install
   npm run dev
   ```
4. Haz clic en `http://localhost:5173`.
5. Si quieres correr las **120 pruebas automatizadas** frente al profesor en vivo:
   ```bash
   npm test
   ```

---

## 3. Mapa Completo de Carpetas y Archivos (100 % en Español)

Todo el código fuente dentro de `src/` tiene nombres en español para que cualquiera identifique de inmediato qué hace cada archivo:

```
src/
├── principal.tsx                       # Punto de entrada: monta React dentro de ControladorErrores
├── Aplicacion.tsx                      # Estado global, persistencia URL/localStorage y atajos
├── estilos.css                         # Estilos globales y paleta pastel Marfil-Arena-Salvia
│
├── salas/                              # 🏛️ LAS 6 SALAS DE LABORATORIO (Interfaz + Lienzo)
│   ├── sala1_electrostatica/
│   │   ├── LienzoElectrostatica.tsx    # Interacción táctil/ratón/teclado y partículas de prueba
│   │   └── renderizadorElectrostatica.ts # Dibujo Canvas 2D, mapa suave, escala 1m y multímetro SI
│   ├── sala2_gauss/
│   │   ├── LienzoGauss2D.tsx           # Controles, telemetría y eventos de Gauss 2D
│   │   ├── renderizadorGauss2D.ts      # Dibujo Canvas 2D de superficies, dA y vectores normales
│   │   └── VisorGauss3D.tsx            # Escena Three.js 3D (cubo, cilindro, tetraedro y esfera)
│   ├── sala3_capacitancia/
│   │   ├── LienzoCapacitor.tsx         # Estado del capacitor, sondas y red Serie/Paralelo
│   │   ├── ControlesCapacitor.tsx      # Interruptor de batería y deslizadores geométricos
│   │   ├── TelemetriaCapacitor.tsx     # Lecturas de C ideal, C Kirchhoff, Q, V, U y E
│   │   ├── disenoCapacitor.ts          # Geometría en píxeles y lectura de sondas
│   │   └── renderizadorCapacitor.ts    # Dibujo de placas, dieléctrico y líneas de borde curvas
│   ├── sala4_magnetostatica/
│   │   ├── LienzoMagnetostatica.tsx    # Conductores, brújula y HUD de la Ley de Ampère
│   │   └── renderizadorMagnetostatica.ts # Dibujo de campo B, hilos ⊙/⊗ y Curva Amperiana C
│   ├── sala5_lorentz3d/
│   │   ├── VisorLorentz3D.tsx          # Escena 3D WebGL (60×44×60 m), Boris de paso fijo y atajos
│   │   ├── InspectorParticula.tsx      # Inspector individual por clic (|v|, ángulos θ/φ, q, m y Aplicar)
│   │   ├── GizmoOrientacion3D.tsx      # Cruz 3D de orientación (X, Y, Z / î, ĵ, k̂)
│   │   └── TelemetriaLorentz.tsx       # HUD con rapidez, fuerza, radio de Larmor y ciclotrón
│   └── sala6_faraday/
│       ├── LienzoFaraday.tsx           # Interacción con el imán de barra y bobina
│       ├── ControlesFaraday.tsx        # Invertir polos, oscilación armónica y N espiras
│       ├── TelemetriaFaraday.tsx       # Lecturas tabulares estables (Φ_B, dΦ/dt, FEM ε, I)
│       ├── renderizadorFaraday.ts      # Bobina, galvanómetro, bombilla y osciloscopio
│       └── useSimulacionFaraday.ts     # Bucle continuo rAF estabilizado sin reinicios
│
├── interfaz/                           # 🖥️ NAVEGACIÓN Y MODALES TRANSVERSALES
│   ├── BarraSuperior.tsx               # Selector de salas, Modo Exploración/SI, Ficha y Compartir
│   ├── BarraEstado.tsx                 # Barra inferior con estado del motor (60 FPS)
│   ├── PanelGuia.tsx                   # Panel izquierdo con guía de 3 pasos y presets 1-clic
│   ├── PanelControles.tsx              # Panel derecho (solo visible en Sala 1 y Sala 5)
│   ├── VisorSalas.tsx                  # Carga diferida (React.lazy) de la sala activa
│   ├── PantallaBienvenida.tsx          # Portada institucional UPC con las 8 unidades del curso
│   ├── ModalTeoria.tsx                 # Explicación sencilla + fórmulas clave (tecla F1)
│   ├── ModalBuscador.tsx               # Buscador rápido por tema o ecuación (Ctrl+K)
│   ├── InsigniaUPC.tsx                 # Escudo vectorial de la Universidad Popular del Cesar
│   ├── SeccionPlegable.tsx             # Acordeón colapsable
│   ├── AvisoNotificacion.tsx           # Avisos flotantes (Toast)
│   ├── ControladorErrores.tsx          # Evita que un error aislado cierre toda la app
│   └── __tests__/interfaz.test.tsx     # Pruebas automatizadas de renderizado UI
│
├── fisica/                             # ⚛️ MOTOR MATEMÁTICO PURO (Sin React — 100 % testeado)
│   ├── electrostatica.ts               # Coulomb visual y SI exacto (100 px = 1.00 m) + RK4
│   ├── gauss.ts                        # Integración numérica 2D, esférica y prismática
│   ├── gauss3d.ts                      # Campos no uniformes 3D y Teorema de la Divergencia
│   ├── capacitancia.ts                 # Placas paralelas, dieléctricos, Kirchhoff y Serie/Paralelo
│   ├── biotsavart.ts                   # Biot-Savart SI exacto y Ley de Ampère numérica
│   ├── lorentz.ts                      # Algoritmo simpléctico de Boris en 3D
│   ├── faraday.ts                      # Campo dipolar 3D, Gauss-Legendre (32 nodos) y Lenz
│   └── __tests__/                      # 8 archivos con 113 pruebas matemáticas unitarias
│
├── ganchos/                            # 🪝 HOOKS REUTILIZABLES
│   ├── useEstadoPersistente.ts         # Guarda sesión en localStorage y sincroniza URL (?sala=...)
│   ├── useDimensionElemento.ts         # Ajusta el lienzo automáticamente al redimensionar
│   ├── useAccionesExportar.ts          # Descarga Ficha de Evidencia PNG + TXT con membrete UPC
│   ├── useAtajosTeclado.ts             # Atajos globales: Espacio, R, M, F1, Ctrl+K, Ctrl+Z, Ctrl+Y
│   ├── useHistorialGlobal.ts           # Historial global de Deshacer y Rehacer en todas las salas
│   ├── usePeticionPreset.ts            # Conecta los botones de experimentos con cada sala
│   └── usePresetsSalas.ts              # Cola de experimentos preconfigurados
│
├── configuracion/valoresPorDefecto.ts  # Valores iniciales por defecto
├── datos/temas.ts                      # Catálogo curricular de temas y fórmulas
├── tipos/index.ts                      # Definición de tipos TypeScript de todo el proyecto
└── utilidades/generadorReportes.ts     # Composición gráfica de la Ficha de Evidencia UPC
```

> **Nota por si pregunta el profesor:** Los archivos de la raíz (`package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`) mantienen sus nombres estándar porque Node.js, Vite y TypeScript los buscan obligatoriamente con ese nombre exacto para compilar.

---

## 4. Flujo de Ejecución Paso a Paso (Cómo Conecta Todo)

1. **`index.html` $\to$ `src/principal.tsx`:** Monta la aplicación dentro de `<ControladorErrores>`.
2. **`src/Aplicacion.tsx`:** Recupera la última sesión guardada o los parámetros del enlace (`?sala=...&vista=...`), coordina qué sala está activa (`mode`) y si estamos en **Modo Exploración** (`explore`) o **Modo Medición SI** (`lab`).
3. **`src/interfaz/VisorSalas.tsx`:** Usa `React.lazy()` para descargar únicamente el código de la sala elegida (haciendo que la app cargue un **70 % más rápido**, pesando apenas `92.9 kB` en su carga inicial).
4. **Separación Vista vs. Física:** Cada sala en `src/salas/` captura gestos táctiles/ratón (`PointerEvents`) y llama a las funciones puras de `src/fisica/` para obtener los vectores, flujos y voltajes exactos antes de pintarlos en el Canvas 2D o escena WebGL 3D.

---

## 5. Explicación Detallada Sala por Sala (Para Repartirse la Exposición)

Si van a exponer en grupo, pueden dividirse fácilmente las salas así:

### 🔹 Sala 1: Electrostática y Potencial Eléctrico
- **Dónde está:** `src/salas/sala1_electrostatica/` y `src/fisica/electrostatica.ts`.
- **Ecuaciones que resuelve:**
  $$\mathbf{E}(\mathbf{r}) = \frac{1}{4\pi\varepsilon_0}\sum_i \frac{q_i}{|\mathbf{r}-\mathbf{r}_i|^2}\hat{\mathbf{r}}_i, \qquad V(\mathbf{r}) = \frac{1}{4\pi\varepsilon_0}\sum_i \frac{q_i}{|\mathbf{r}-\mathbf{r}_i|}$$
- **Puntos clave para explicar:**
  - Escala física real `1.00 m = 100 px`: a `100 px` de una carga de `+2 µC`, el multímetro en Modo Medición marca exactamente `17.98 kN/C` y `17.98 kV`.
  - Las líneas de campo se integran con **Runge-Kutta 4 (RK4)** y las equipotenciales se trazan ortogonalmente ($\mathbf{E} \perp \text{equipotenciales}$, pues $\mathbf{E} = -\nabla V$).
  - El mapa de calor del potencial usa interpolación bilineal fuera de pantalla para verse suave y continuo.

### 🔹 Sala 2: Ley de Gauss (2D y 3D Volumétrico)
- **Dónde está:** `src/salas/sala2_gauss/` y `src/fisica/gauss.ts` + `gauss3d.ts`.
- **Ecuación que resuelve:**
  $$\Phi_E = \oint_S \mathbf{E}\cdot d\mathbf{A} = \frac{Q_{\text{enc}}}{\varepsilon_0}, \qquad \oint_S \mathbf{E}\cdot d\mathbf{A} = \iiint_V (\nabla\cdot\mathbf{E})\,dV$$
- **Puntos clave para explicar:**
  - En 2D puedes meter o sacar cargas de una superficie esférica o rectangular y comprobar que **las cargas externas aportan flujo neto cero** (todo flujo que entra vuelve a salir).
  - En 3D (Three.js) integra numéricamente cara por cara un **Cubo, Cilindro, Tetraedro o Esfera** inmersos en campos no uniformes y comprueba el **Teorema de la Divergencia** con error $< 1\%$.

### 🔹 Sala 3: Capacitancia, Dieléctricos y Redes Serie/Paralelo
- **Dónde está:** `src/salas/sala3_capacitancia/` y `src/fisica/capacitancia.ts`.
- **Ecuaciones que resuelve:**
  $$C = \frac{\kappa\varepsilon_0 A}{d}, \qquad Q = CV, \qquad U = \frac{1}{2}CV^2, \qquad f_{\text{Kirchhoff}} = 1 + \frac{d}{\pi R}\left[\ln\left(\frac{16\pi R}{d}\right)-1\right]$$
- **Puntos clave para explicar:**
  - Contrasta **Batería Conectada** ($V=\text{cte} \Rightarrow$ al meter el dieléctrico sube $C$ y entra más carga $Q$) contra **Batería Desconectada** ($Q=\text{cte}$ atrapada $\Rightarrow$ al meter el dieléctrico cae el voltaje $V = Q/C$ y baja el campo $E$).
  - Incluye visualización de **líneas curvas de efecto de borde**, capacitancia corregida de **Kirchhoff** y un analizador interactivo de **Capacitores en Serie y en Paralelo** ($C_{\text{eq}}, V_1, V_2, Q_1, Q_2$).

### 🔹 Sala 4: Magnetostática — Biot-Savart y Ley de Ampère
- **Dónde está:** `src/salas/sala4_magnetostatica/` y `src/fisica/biotsavart.ts`.
- **Ecuaciones que resuelve:**
  $$B = \frac{\mu_0 I}{2\pi r}, \qquad \oint_C \mathbf{B}\cdot d\mathbf{l} = \mu_0 I_{\text{enc}}$$
- **Puntos clave para explicar:**
  - Verifica la **Regla de la Mano Derecha** para corrientes salientes ($\odot$) y entrantes ($\otimes$), atracción entre corrientes paralelas, repulsión entre antiparalelas y campo interior de un solenoide.
  - Incluye una **Curva Amperiana circular $C$ arrastrable** que suma numéricamente $\oint_C \mathbf{B}\cdot d\mathbf{l}$ en 256 segmentos y demuestra en vivo que solo importa la corriente encerrada $I_{\text{enc}}$.

### 🔹 Sala 5: Dinámica 3D y Fuerza de Lorentz
- **Dónde está:** `src/salas/sala5_lorentz3d/` y `src/fisica/lorentz.ts`.
- **Ecuación que resuelve:**
  $$\mathbf{F} = q(\mathbf{E} + \mathbf{v}\times\mathbf{B}), \qquad r_L = \frac{m v_\perp}{|q|B}, \qquad f_c = \frac{|q|B}{2\pi m}$$
- **Puntos clave para explicar:**
  - Si usáramos el método de Euler común, la órbita espiral crecería artificialmente ganando energía falsa. Por eso implementamos el **Integrador Simpléctico de Boris (`borisStep`)** con acumulador de paso fijo real ($\Delta t$ configurable de `0.005 s` a `0.150 s`) dentro de una cámara de vacío ampliada (`60×44×60 m`).
  - Permite hacer **clic individual** sobre cualquier partícula 3D para abrir su **Inspector** y ajustar su rapidez $|\mathbf{v}|$, los ángulos $(\theta, \phi)$ respecto a las líneas de flujo, su carga $q$ y masa $m$ con botón **Aplicar cambios**, además de incluir un **Gizmo 3D (`X, Y, Z / î, ĵ, k̂`)** y **Deshacer/Rehacer (`Ctrl+Z` / `Ctrl+Y`)** en todas las salas.
  - Demuestra Hélice magnética, Filtro de velocidades de Wien ($v = E/B$), Deriva $\mathbf{E}\times\mathbf{B}$ y Botella Magnética (espejo magnético).

### 🔹 Sala 6: Inducción Electromagnética de Faraday y Ley de Lenz
- **Dónde está:** `src/salas/sala6_faraday/` y `src/fisica/faraday.ts`.
- **Ecuaciones que resuelve:**
  $$\Phi_B = \iint_{\text{espira}} \mathbf{B}_{\text{dipolo}}(x,y,z)\cdot d\mathbf{A}, \qquad \mathcal{E} = -N\frac{d\Phi_B}{dt}, \qquad P = I^2 R$$
- **Puntos clave para explicar:**
  - Si el imán está quieto ($d\Phi_B/dt = 0$), **no hay voltaje ni enciende la bombilla** por más potente que sea el imán: solo la **variación temporal del flujo** induce corriente.
  - El signo menos (Ley de Lenz) se visualiza con el vector magnético inducido oponiéndose al acercamiento o alejamiento del imán.
  - El flujo 3D real sobre el disco de la bobina se integra con **Cuadratura de Gauss-Legendre de 32 nodos**.

---

## 6. Sugerencia para Dividir la Exposición (3, 4 o 5 Integrantes)

- **Si son 3 integrantes:**
  - *Integrante 1:* Introducción, arquitectura en español, modos Exploración vs. SI + **Salas 1 y 2** (Campos eléctricos: Coulomb y Gauss 2D/3D).
  - *Integrante 2:* **Salas 3 y 4** (Aplicaciones estáticas: Capacitancia/Kirchhoff/Redes y Magnetostática/Biot-Savart/Ampère).
  - *Integrante 3:* **Salas 5 y 6** (Campos dinámicos: Lorentz 3D con Boris y Faraday-Lenz con Gauss-Legendre) + demostración de `npm test` (120 pruebas) y Ficha de Evidencia UPC.
- **Si son 4 integrantes:** 1 presenta Arquitectura + Sala 1; 2 presenta Salas 2 y 3; 3 presenta Salas 4 y 5; 4 presenta Sala 6 + Pruebas unitarias + Reporte de Evidencia.

---

## 7. Preguntas Típicas de Jurado y Respuestas Ganadoras

1. ***"¿Cómo sé que los números que muestra el simulador son reales y no inventados?"***  
   *Respuesta:* Todo el motor matemático está aislado en `src/fisica/` y validado automáticamente con **113 pruebas unitarias de física** contra soluciones analíticas cerradas (errores menores a $10^{-12}$ en capacitancia, $10^{-13}$ en conservación de energía de Boris y $< 0.06\%$ en cuadratura 3D de Faraday). Además, las salas 2D tienen escala métrica explícita `1.00 m = 100 px`.

2. ***"¿Por qué el campo magnético en la Sala 5 curva a la partícula pero no cambia su rapidez ni su energía cinética?"***  
   *Respuesta:* Porque la fuerza magnética $\mathbf{F}_B = q(\mathbf{v}\times\mathbf{B})$ es siempre perpendicular a la velocidad $\mathbf{v}$, por lo que la potencia entregada es $P = \mathbf{F}_B \cdot \mathbf{v} = 0$ (no realiza trabajo mecánico). Nuestro integrador de Boris preserva esta propiedad geométrica exactamente a nivel numérico.

3. ***"¿Funciona en celulares o computadores sin internet de los laboratorios de la UPC?"***  
   *Respuesta:* Sí en ambos casos: los lienzos usan `PointerEvents` para pantallas táctiles y carga diferida (`92.9 kB` gzip iniciales) para redes móviles, y además cuenta con configuración Electron offline (`npm run electron:exe`) sin depender de ningún CDN externo.

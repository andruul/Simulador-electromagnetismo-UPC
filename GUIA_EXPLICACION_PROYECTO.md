# Guía Maestra de Explicación del Proyecto: Simulador de Electromagnetismo UPC

> **Universidad Popular del Cesar (UPC)**  
> **Facultad de Ingenierías y Tecnologías**  
> **Proyecto:** Simulador Interactivo de Física Electromagnética  
> **Arquitectura:** React 19 + TypeScript + Vite + Tailwind CSS + Three.js (WebGL) + Canvas 2D + Vitest

---

## 1. ¿Qué es este Proyecto y Cuál es su Objetivo?

Este proyecto es un **software educativo e interactivo de simulación computacional de electromagnetismo**, desarrollado con rigor matemático y físico para estudiantes y docentes de la **Universidad Popular del Cesar (UPC)**.

Su objetivo principal es permitir a los estudiantes **experimentar visualmente y en tiempo real** con fenómenos electromagnéticos abstractos que no se pueden ver a simple vista en un laboratorio convencional (como líneas de campo vectorial, superficies equipotenciales, flujo de Gauss cerrado, integración numérica de órbitas de partículas con el algoritmo de Boris, o la inducción de Faraday calculada por cuadratura).

---

## 2. Mapa de Carpetas y Organización del Código

Para que el proyecto sea intuitivo y fácil de entender por cualquier integrante del equipo, el código fuente está dividido en carpetas nombradas en español y organizadas por responsabilidades claras:

```
Proyecto Simulador/
├── src/
│   ├── main.tsx                    # Punto de entrada inicial de React
│   ├── App.tsx                     # Orquestador principal (estado global y salas)
│   ├── App.css / index.css         # Estilos globales y paleta pastel UPC
│   │
│   ├── salas/                      # 🏛️ LAS 6 SALAS DE LABORATORIO VIRTUAL
│   │   ├── sala1_electrostatica/   # Campo eléctrico, potencial y Coulomb
│   │   ├── sala2_gauss/            # Ley de Gauss (flujo 2D y 3D en Three.js)
│   │   ├── sala3_capacitancia/     # Capacitancia, placas y dieléctricos
│   │   ├── sala4_magnetostatica/   # Ley de Biot-Savart y fuerzas de corrientes
│   │   ├── sala5_lorentz3d/        # Dinámica 3D de partículas (Algoritmo de Boris)
│   │   └── sala6_faraday/          # Inducción de Faraday y Ley de Lenz
│   │
│   ├── interfaz/                   # 🖥️ COMPONENTES VISUALES Y NAVEGACIÓN
│   │   ├── BarraSuperior.tsx       # Barra de navegación superior con selector de salas
│   │   ├── BarraEstado.tsx         # Barra inferior con telemetría de rendimiento (FPS)
│   │   ├── PanelGuia.tsx           # Panel izquierdo retráctil con guía y experimentos
│   │   ├── PanelControles.tsx      # Panel derecho retráctil con controles de la sala activa
│   │   ├── VisorSalas.tsx          # Contenedor central que renderiza la sala seleccionada
│   │   ├── PantallaBienvenida.tsx  # Modal institucional de bienvenida de la UPC
│   │   ├── ModalTeoria.tsx         # Modal de fundamentos teóricos y fórmulas
│   │   ├── ModalBuscador.tsx       # Buscador rápido por teclado (Ctrl+K)
│   │   ├── InsigniaUPC.tsx         # Escudo y distintivos institucionales vectoriales
│   │   ├── SeccionPlegable.tsx     # Acordeón colapsable para paneles limpios
│   │   ├── AvisoNotificacion.tsx   # Notificaciones flotantes tipo Toast
│   │   └── ControladorErrores.tsx  # Error Boundary que evita caídas del simulador
│   │
│   ├── physics/                    # ⚛️ MOTOR MATEMÁTICO PURO (SIN REACT)
│   │   ├── electrostatics.ts       # Fórmulas de Coulomb, campo E y potencial V
│   │   ├── gauss.ts                # Cuadratura numérica y cálculo de flujo de Gauss
│   │   ├── capacitance.ts          # Ecuaciones de condensadores y dieléctricos
│   │   ├── biotsavart.ts           # Ley de Biot-Savart para alambres y espiras
│   │   ├── lorentz.ts              # Integrador simpléctico de Boris (Fuerza de Lorentz)
│   │   ├── faraday.ts              # Inducción FEM, cuadratura de Gauss-Legendre y Lenz
│   │   └── __tests__/              # 104 Pruebas unitarias automatizadas de física
│   │
│   ├── hooks/                      # 🪝 HOOKS REUTILIZABLES DE REACT
│   │   ├── useRoomPresets.ts       # Manejo de experimentos preconfigurados por sala
│   │   ├── usePresetRequest.ts     # Comunicación de presets entre interfaz y canvas
│   │   ├── useGlobalShortcuts.ts   # Atajos de teclado (Espacio = Pausa, R = Reset, etc.)
│   │   ├── useElementSize.ts       # Detección responsiva de dimensiones de pantalla
│   │   └── useExportActions.ts     # Generación de reportes de laboratorio e imágenes
│   │
│   ├── types/                      # 📐 DEFINICIONES DE TIPOS DE TYPESCRIPT
│   │   └── index.ts                # Interfaces de cargas, partículas, vectores y modos
│   │
│   └── data/                       # 📚 BASE DE DATOS TEÓRICA
│       └── topics.ts               # Temario académico y preguntas para el buscador
```

---

## 3. ¿Cómo Funciona la Aplicación? (Flujo de Ejecución)

1. **Arranque (`main.tsx`):**
   - El navegador carga `index.html`, monta el elemento `#root` e inicializa `main.tsx`.
   - Envuelve la aplicación en `<ControladorErrores>` para atrapar cualquier excepción imprevista sin congelar la pestaña.

2. **Orquestación Global (`App.tsx`):**
   - Mantiene el estado de:
     - `mode`: ¿En cuál de las 6 salas estamos? (`electrostatics`, `gauss`, `capacitor`, `magnetostatics`, `lorentz3d`, `faraday`).
     - `viewMode`: ¿Modo exploración libre o modo guiado de laboratorio?
     - `isPlaying`: ¿La simulación está corriendo o en pausa?
   - Distribuye las vistas a:
     - `<BarraSuperior>`: Selección de salas y estado general.
     - `<PanelGuia>`: Experimentos recomendados paso a paso.
     - `<VisorSalas>`: El área gráfica principal donde ocurre la física.
     - `<PanelControles>`: Controles específicos (magnitud de cargas, intensidad de campo, etc.).
     - `<BarraEstado>`: Frecuencia de actualización en FPS y estado numérico.

3. **Renderizado en Pantalla (`VisorSalas.tsx`):**
   - Actúa como un conmutador ("router visual"). Según el `mode` actual, activa el lienzo correspondiente (`LienzoElectrostatica`, `LienzoGauss2D`, `LienzoCapacitor`, etc.).

---

## 4. Detalle de las 6 Salas de Laboratorio: Física y Código

Cada sala tiene una **separación estricta**:
- El archivo en `src/salas/...` se encarga de dibujar (Canvas 2D o WebGL Three.js) y capturar eventos de usuario (ratón, arrastrar, clics).
- El archivo en `src/physics/...` se encarga **exclusivamente de las matemáticas y la física**. No tiene ninguna dependencia gráfica ni de React; es código puro que se valida mediante pruebas unitarias (`npm test`).

---

### Sala 1: Electrostática (Campo y Potencial Eléctrico 2D)
- **Archivos Clave:**
  - Vista: `src/salas/sala1_electrostatica/LienzoElectrostatica.tsx`
  - Motor de Física: `src/physics/electrostatics.ts`
  - Pruebas: `src/physics/__tests__/electrostatics.test.ts`
- **Fenómenos que simula:**
  - **Ley de Coulomb:** Fuerza y campo eléctrico entre cargas puntuales:
    $$\mathbf{E}(\mathbf{r}) = \frac{1}{4\pi\varepsilon_0} \sum_i \frac{q_i}{|\mathbf{r} - \mathbf{r}_i|^2} \hat{\mathbf{r}}_i$$
  - **Potencial Eléctrico Escalar ($V$):** Superposición de potenciales:
    $$V(\mathbf{r}) = \frac{1}{4\pi\varepsilon_0} \sum_i \frac{q_i}{|\mathbf{r} - \mathbf{r}_i|}$$
  - **Líneas de Campo y Líneas Equipotenciales:** Se calculan trazando tangentes al vector de campo eléctrico con paso adaptativo Runge-Kutta.
- **Cómo defenderla en una exposición:**
  - *Explicar al profesor:* "En esta sala demostramos el principio de superposición. Al mover dos cargas opuestas (dipolo), el simulador resuelve la suma vectorial del campo en una malla de puntos y traza curvas ortogonales donde el potencial es constante (líneas equipotenciales), demostrando visualmente que $\mathbf{E} = -\nabla V$."

---

### Sala 2: Ley de Gauss (Flujo Eléctrico en 2D y 3D)
- **Archivos Clave:**
  - Vistas: `src/salas/sala2_gauss/LienzoGauss2D.tsx` (2D) y `src/salas/sala2_gauss/VisorGauss3D.tsx` (3D en Three.js)
  - Motor de Física: `src/physics/gauss.ts`
  - Pruebas: `src/physics/__tests__/gauss.test.ts` y `gauss3d.test.ts`
- **Fenómenos que simula:**
  - **1ª Ecuación de Maxwell (Ley de Gauss):**
    $$\Phi_E = \oint_S \mathbf{E} \cdot d\mathbf{A} = \frac{Q_{\text{encerrada}}}{\varepsilon_0}$$
  - En la vista 3D interactiva, se integran numéricamente las caras de cubos, esferas y cilindros gaussianos usando cuadratura de superficie.
  - Permite verificar campos no uniformes y demostrar que las cargas externas a la superficie gaussiana tienen un flujo neto igual a cero.
- **Cómo defenderla en una exposición:**
  - *Pregunta típica del docente:* "¿Por qué una carga por fuera de la superficie da flujo neto cero?"
  - *Respuesta recomendada:* "Porque todas las líneas de campo que entran por un lado de la superficie gaussiana terminan saliendo por el lado opuesto. Por el Teorema de la Divergencia, $\oint_S \mathbf{E}\cdot d\mathbf{A} = \int_V (\nabla \cdot \mathbf{E}) dV$. Como fuera de la carga $\nabla \cdot \mathbf{E} = 0$, la integral cerrada es exactamente cero."

---

### Sala 3: Laboratorio de Capacitancia y Dieléctricos
- **Archivos Clave:**
  - Vistas: `src/salas/sala3_capacitancia/LienzoCapacitor.tsx`
  - Componentes: `ControlesCapacitor.tsx`, `TelemetriaCapacitor.tsx`, `renderizadorCapacitor.ts`, `diseñoCapacitor.ts`
  - Motor de Física: `src/physics/capacitance.ts`
  - Pruebas: `src/physics/__tests__/capacitance.test.ts`
- **Fenómenos que simula:**
  - **Capacitancia de placas plano-paralelas:**
    $$C = \frac{\kappa \varepsilon_0 A}{d}$$
  - **Efecto de Dieléctricos:** Permite deslizar físicamente un bloque dieléctrico (teflón, papel, vidrio, agua, etc.) dentro de las placas.
  - **Dos Regímenes Fundamentales:**
    1. **Batería Conectada ($V = \text{cte}$):** Al introducir el dieléctrico, la capacitancia $C$ aumenta y la batería suministra más carga ($Q = C V$), aumentando la energía almacenada ($U = \frac{1}{2} C V^2$).
    2. **Batería Desconectada ($Q = \text{cte}$):** La carga queda atrapada en las placas. Al introducir el dieléctrico, la capacitancia $C$ aumenta, haciendo que el voltaje caiga ($V = Q/C$) y el campo eléctrico interno se debilite ($E = E_0 / \kappa$).
  - **Sondas de Medición (Voltímetro y Campo-metro):** El estudiante puede arrastrar las agujas del voltímetro a cualquier punto del circuito para medir diferencias de potencial reales.

---

### Sala 4: Magnetostática (Ley de Biot-Savart y Conductores)
- **Archivos Clave:**
  - Vista: `src/salas/sala4_magnetostatica/LienzoMagnetostatica.tsx`
  - Motor de Física: `src/physics/biotsavart.ts`
  - Pruebas: `src/physics/__tests__/biotsavart.test.ts`
- **Fenómenos que simula:**
  - **Ley de Biot-Savart para conductores rectilíneos:**
    $$B = \frac{\mu_0 I}{2\pi r}$$
  - **Regla de la Mano Derecha:** Visualización de líneas de campo magnético cerradas circulando alrededor de las corrientes.
  - **Fuerza Magnética entre Corrientes:**
    - Corrientes en el mismo sentido: se **atraen**.
    - Corrientes en sentidos contrarios: se **repelen**.
  - **Brújula de Prueba Móvil:** El estudiante arrastra una brújula virtual por la pantalla para observar su aguja alineándose en tiempo real con el vector $\mathbf{B}$ resultante.

---

### Sala 5: Dinámica de Lorentz 3D (Partículas en Campos E y B)
- **Archivos Clave:**
  - Vista: `src/salas/sala5_lorentz3d/VisorLorentz3D.tsx` (Renderizado WebGL acelerado por Three.js)
  - Motor de Física: `src/physics/lorentz.ts`
  - Pruebas: `src/physics/__tests__/lorentz.test.ts`
- **Fenómenos que simula:**
  - **Fuerza de Lorentz:**
    $$\mathbf{F} = q(\mathbf{E} + \mathbf{v} \times \mathbf{B})$$
  - **Integrador Numérico de Boris (Boris Algorithm):** En simulaciones de física de plasmas, un integrador estándar tipo Euler o Runge-Kutta falla rápidamente porque no conserva la energía ni el radio de Larmor. El algoritmo de Boris es un método simpléctico que descompone el avance de velocidad en:
    1. Medio paso de aceleración eléctrica: $\mathbf{v}^- = \mathbf{v}^t + \frac{q\mathbf{E}}{m} \frac{\Delta t}{2}$
    2. Rotación magnética pura: preserva exactamente la magnitud de la velocidad.
    3. Segundo medio paso eléctrico: $\mathbf{v}^{t+\Delta t} = \mathbf{v}^+ + \frac{q\mathbf{E}}{m} \frac{\Delta t}{2}$
  - **Experimentos Preconfigurados Disponibles:**
    - Trayectoria helicoidal pura.
    - Selector de velocidades / Deriva $\mathbf{E} \times \mathbf{B}$ (movimiento cicloide).
    - Botella magnética (confinamiento por gradiente de campo magnético).

---

### Sala 6: Inducción de Faraday y Ley de Lenz
- **Archivos Clave:**
  - Vista: `src/salas/sala6_faraday/LienzoFaraday.tsx`
  - Componentes: `ControlesFaraday.tsx`, `TelemetriaFaraday.tsx`, `renderizadorFaraday.ts`, `useSimulacionFaraday.ts`
  - Motor de Física: `src/physics/faraday.ts`
  - Pruebas: `src/physics/__tests__/faraday.test.ts`
- **Fenómenos que simula:**
  - **Ley de Faraday-Lenz:**
    $$\varepsilon = -N \frac{d\Phi_B}{dt}$$
  - **Cálculo Numérico del Flujo Magnético:** Se calcula el campo magnético $\mathbf{B}$ producido por un imán dipolo real de momento $\mathbf{m}$ y se integra sobre la sección transversal de la bobina usando **cuadratura de Gauss-Legendre radial con 32 nodos** (con un error relativo inferior al $0.5\%$).
  - **Ley de Lenz (El Signo Negativo):** Cuando el polo Norte del imán se aproxima a la bobina, la corriente inducida genera un campo magnético opuesto para repeler la entrada del imán.
  - **Cargas y Medidores:**
    - Bombilla incandescente: Brillo proporcional a la potencia disipada $P = I^2 R = \frac{\varepsilon^2}{R}$.
    - Galvanómetro analógico con aguja oscilante.
    - Osciloscopio digital en tiempo real que traza la curva de FEM $\varepsilon(t)$.

---

## 5. Diseño Visual y Estética Pastel

El diseño visual del simulador fue configurado con una paleta cálida, profesional y de contraste suave para evitar el cansancio visual tras largas sesiones de estudio:
- **Fondo Principal:** Blanco hueso cálido (`#FAF7F2` / `#F5F0E8`).
- **Superficies y Tarjetas:** Beige pastel suave con bordes delgados (`#EDE8DF`, `#D5CEC6`).
- **Acentos Institucionales UPC:** Verde esmeralda universitario pastel (`#10B981` y `#059669`) y toques suaves de azul cerúleo.
- **Tipografía y Legibilidad:** Fuentes nítidas con valores numéricos tabulados (`font-mono` y `tabular-nums`) para evitar temblores o saltos en paneles cuando los datos cambian rápidamente.

---

## 6. Comandos para Ejecutar, Probar y Compilar el Proyecto

Para trabajar con el código en cualquier computador con Node.js instalado:

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Ejecutar en modo desarrollo local:**
   ```bash
   npm run dev
   ```
   *(Abre `http://localhost:5173` en el navegador con recarga instantánea).*

3. **Ejecutar las 104 pruebas unitarias de física:**
   ```bash
   npm test
   ```
   *(Comprueba que las fórmulas de Coulomb, Gauss, Capacitancia, Biot-Savart, Lorentz y Faraday sean 100% exactas).*

4. **Compilar para producción:**
   ```bash
   npm run build
   ```
   *(Verifica los tipos de TypeScript con `tsc -b` y compila los archivos optimizados en la carpeta `dist/`).*

---

## 7. Preguntas Frecuentes de Profesores en la Sustentación

1. **¿Por qué separaron las fórmulas matemáticas en `src/physics/` y la interfaz en `src/salas/`?**  
   *Respuesta:* Por el principio de Responsabilidad Única y Arquitectura Limpia. Esto garantiza que la física sea agnóstica a la vista, permitiendo verificar cada ley con 104 pruebas unitarias automatizadas (`vitest`) sin necesidad de levantar el navegador.

2. **¿Cómo garantizan que la simulación de partículas en la Sala 5 sea físicamente válida?**  
   *Respuesta:* Implementamos el algoritmo de Boris (`borisStep`), que es el estándar de oro en física computacional para partículas cargadas porque es simpléctico: conserva el volumen en el espacio de fases y preserva la energía cinética en presencia de campos magnéticos puros.

3. **¿Cómo se calcula el flujo magnético en la Sala de Faraday?**  
   *Respuesta:* Calculamos el campo del dipolo magnético en coordenadas cilíndricas y realizamos una integración numérica por cuadratura de Gauss-Legendre de 32 nodos sobre el radio de la espira, derivando temporalmente respecto a la posición del imán para obtener la FEM ($\varepsilon = -N \frac{d\Phi}{dt}$).

4. **¿Qué ocurre si un estudiante abre el simulador en un computador con pantalla pequeña o tablet?**  
   *Respuesta:* Toda la interfaz está adaptada con diseño responsivo usando Tailwind CSS. Los paneles laterales son retráctiles, y la telemetría cuenta con anchos calculados y colapsables para no entorpecer el área de simulación.

---

*Desarrollado con orgullo para la comunidad académica de la Universidad Popular del Cesar (UPC).*

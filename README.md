# ⚡ Simulador de Electromagnetismo (2D / 3D)

Aplicación de escritorio interactiva de física computacional para simular fenómenos electromagnéticos en tiempo real, construida con **Electron**, **React 19**, **TypeScript**, **Three.js** y **Tailwind CSS**.

---

## 🚀 Inicio Rápido

### 1. Requisitos Previos
* **Node.js** v18 o superior
* **npm**

### 2. Ejecutar como Aplicación de Escritorio (Electron)
Para compilar y abrir la ventana nativa de escritorio:
```bash
npm run electron:start
```
O para desarrollo con recarga en caliente (Hot Reload):
```bash
npm run electron:dev
```

### 3. Ejecutar en el Navegador Web (Vite)
También puedes interactuar directamente desde cualquier navegador web:
```bash
npm run dev
```
Luego abre `http://localhost:5173`.

---

## 🔬 Módulos Físicos Implementados

### 1. ⚡ Electrostática 2D Interactiva
* **Ley de Coulomb y Principio de Superposición**:
  $$ \vec{E}(\vec{r}) = \sum_i \frac{k_e q_i}{|\vec{r} - \vec{r}_i|^3} (\vec{r} - \vec{r}_i) $$
* **Líneas de Campo Eléctrico**: Trazado continuo con integración numérica **Runge-Kutta de 4º orden (RK4)** con flechas direccionales dinámicas.
* **Mapa de Calor de Potencial Escalar $V(\vec{r})$**: Gradiente cromático de potencial eléctrico en tiempo real.
* **Superficies / Isolíneas Equipotenciales**: Curvas donde $V = \text{constante}$ trazadas ortogonalmente al vector $\vec{E}$ ($\vec{E} = -\nabla V$).
* **Multímetro / Sonda de Campo**: Mide magnitud $|\vec{E}|$ en $\text{N/C}$, potencial $V$ en $\text{Volts}$ y ángulo $\theta$.
* **Partículas de Prueba Libres**: Lanzamiento de cargas libres que son aceleradas en tiempo real por el campo con trazado de estela.
* **Presets Didácticos**: Dipolo, cargas de igual signo, cuadrupolo, condensador de placas paralelas con efecto de borde, carga única aislada.

### 2. 🌀 Dinámica 3D de Partículas & Fuerza de Lorentz
* **Ecuación de Lorentz**:
  $$ \vec{F} = q(\vec{E} + \vec{v} \times \vec{B}) $$
* **Integrador Simpléctico Boris Pusher**:
  Implementa el algoritmo estándar de física de plasma que conserva exactamente la energía cinética y el radio orbital (Larmor) en campos magnéticos sin derivas numéricas espurias.
* **Renderizado 3D con Three.js**:
  * Esferas brillantes con estela de trayectoria continua.
  * Vectores tridimensionales dinámicos sobre la partícula: $\vec{v}$ (verde), $\vec{F}$ (amarillo), $\vec{B}$ (cian), $\vec{E}$ (rojo).
  * Control de órbita 3D interactivo con ratón (rotación, zoom y paneo).
* **Presets y Experimentos Clásicos**:
  * *Hélice / Giro en Campo Magnético Puro*: Radio de Larmor $r_L = \frac{mv_\perp}{|q|B}$ y frecuencia ciclotrón $f_c = \frac{|q|B}{2\pi m}$.
  * *Selector de Velocidades (Filtro de Wien)*: $\vec{E} \perp \vec{B}$ donde solo las partículas con $v = E/B$ viajan sin desviarse.
  * *Deriva $\vec{E} \times \vec{B}$ (Drift Velocity)*: Trayectoria cicloidal en campos cruzados.
  * *Botella Magnética (Espejo Magnético)*: Reflexión por gradiente de campo magnético (principio de confinamiento Tokamak y Cinturones de Van Allen).
  * *Ciclotrón*: Aceleración periódica por campo eléctrico alternante resonante.

### 3. 🧲 Magnetostática & Fuentes de Corriente (Biot-Savart)
* **Ley de Biot-Savart & Ampère**:
  $$ B = \frac{\mu_0 I}{2\pi r} $$
* Simulación de conductores rectilíneos con corriente saliente ($\odot$) y entrante ($\otimes$).
* **Líneas de Campo Magnético Cerradas** ($\nabla \cdot \vec{B} = 0$).
* **Sonda / Brújula Magnética**: Aguja magnetizada interactiva que se orienta a lo largo del campo magnético local.
* **Experimentos**: Atracción entre hilos paralelos, repulsión de corrientes opuestas, bobina / solenoide con campo uniforme interior.

### 4. 📖 Guía Teórica y Compendio
Modal integrado con fórmulas matemáticas, explicaciones conceptuales y aplicaciones de ingeniería de cada fenómeno.

---

## 🛠️ Estructura del Código

```
Proyecto Simulador/
├── electron/
│   └── main.cjs             # Ventana y ciclo de vida de Electron
├── src/
│   ├── components/
│   │   ├── ElectrostaticsCanvas.tsx   # Canvas 2D interactivo con RK4
│   │   ├── LorentzViewer3D.tsx        # Viewport 3D Three.js con Boris Pusher
│   │   ├── MagnetostaticsCanvas.tsx   # Simulación 2D de Biot-Savart
│   │   ├── ControlPanel.tsx           # Panel de sliders y controles
│   │   ├── TopNavbar.tsx              # Barra de navegación y herramientas
│   │   └── TheoryModal.tsx            # Compendio didáctico de teoría
│   ├── physics/
│   │   ├── electrostatics.ts          # Cálculo de Coulomb, E, V, RK4
│   │   ├── lorentz.ts                 # Integrador de Boris y campos 3D
│   │   └── biotsavart.ts              # Campo B de hilos y espiras
│   ├── types/
│   │   └── index.ts                   # Tipos TypeScript
│   ├── App.tsx                        # Componente raíz
│   ├── main.tsx                       # Entrada de React
│   └── index.css                      # Estilos y Tailwind
├── package.json
└── vite.config.ts
```

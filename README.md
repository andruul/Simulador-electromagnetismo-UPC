# 🏛️ Simulador de Electromagnetismo — Universidad Popular del Cesar (UPC)
### Estación de Laboratorio Virtual (2D / 3D) • Versión 2.0 Desktop & Web Edition

[![Web en Vivo](https://img.shields.io/badge/Web%20en%20Vivo-Vercel%20Production-emerald?style=for-the-badge&logo=vercel)](https://simulador-electromagnetismo-upc.vercel.app)
[![Plataforma](https://img.shields.io/badge/Plataforma-Windows%20Portable%20%7C%20Web-blue?style=for-the-badge)](https://simulador-electromagnetismo-upc.vercel.app)
[![Pruebas de Física](https://img.shields.io/badge/F%C3%ADsica-104%2F104%20Tests%20Passing-success?style=for-the-badge)](https://github.com/andruul/Simulador-electromagnetismo-UPC)

Aplicación nativa de escritorio y estación web de física computacional desarrollada para la **Universidad Popular del Cesar (UPC)**, Valledupar, Colombia. Diseñada con un estándar riguroso de ingeniería pedagógica para enriquecer los laboratorios de Física II mediante simulación interactiva de alta fidelidad, paleta clara pastel de descanso visual, 100% offline en su ejecutable y optimizada para equipos de salas de informática universitarias.

🌐 **Probar versión Web directamente:** [https://simulador-electromagnetismo-upc.vercel.app](https://simulador-electromagnetismo-upc.vercel.app)

---

## 🚀 Modos de Ejecución y Distribución

### 1. Ejecutable Nativo de Windows (`.exe` Portable — Sin Instalación)
Ideal para los computadores de las salas de sistemas de la UPC donde los estudiantes o docentes no tienen permisos de Administrador:
- **Archivo generado:** `release/Simulador_Electromagnetismo_UPC_Portable.exe` (112.9 MB)
- **Cómo compilarlo:**
```bash
npm run electron:exe
```
> **Ventaja UPC:** Se puede copiar directamente a una memoria USB y ejecutar con doble clic en cualquier computador con Windows 10 u 11 sin requerir conexión a internet ni instalación previa.
> *(Nota: En GitHub, los archivos ejecutables mayores a 100 MB se distribuyen en la sección [Releases](https://github.com/andruul/Simulador-electromagnetismo-UPC/releases) para permitir descargas directas sin saturar el código fuente).*

### 2. Instalador de Windows (NSIS)
Para instalar en computadores de laboratorio con acceso directo en el Escritorio:
```bash
npm run electron:nsis
```

### 3. Ejecución en Modo Desarrollo (Escritorio con Electron)
```bash
npm run electron:start
# o con Hot Module Replacement:
npm run electron:dev
```

### 4. Modo Web (Navegador)
```bash
npm run dev
```
Abre en `http://localhost:5173`.

### 5. Verificación de Calidad
```bash
npm test          # 100 pruebas de física contra soluciones analíticas (Vitest)
npm run lint      # oxlint: 0 errores / 0 advertencias
npx tsc -b        # TypeScript sin errores
npm run build     # Bundle de producción en dist/ (con CSP estricta)
```

---

## 🎓 Enfoque Pedagógico: Divulgación Progresiva

El simulador cuenta con un interruptor maestro accesible en la barra superior o mediante la tecla `[M]`:

### 🔹 Modo Exploración (Básico)
* **Público objetivo:** Estudiantes de semestres iniciales o primer contacto con la física electromagnética.
* **Interfaz amigable:** Sustituye números abstractos por indicadores cualitativos claros (*"Capacitancia Alta"*, *"Imán generando voltaje"*, *"Líneas de campo atrayéndose"*).
* **Guía paso a paso (280px):** Tarjeta con 3 pasos intuitivos:
  1. *Interactúa:* Qué mover o arrastrar en pantalla.
  2. *Observa:* Qué fenómeno visual ocurre.
  3. *Concepto Clave:* El principio físico fundamental en lenguaje sencillo.
* **Experimentos con 1 Clic (Presets):** Permite cargar configuraciones demostrativas instantáneas sin empezar en blanco.

### 🔬 Modo Medición (Avanzado SI)
* **Público objetivo:** Estudiantes avanzados de ingeniería y docentes evaluadores.
* **Instrumentos de laboratorio digital:**
  * Voltímetros interactivos de dos sondas (roja/negra).
  * Sensores de campo eléctrico $|\vec{E}|$ en $\text{N/C}$ y $\text{kV/m}$.
  * Medidores de flujo magnético $\Phi_B$ en $\text{mWb}$ y derivada $d\Phi_B/dt$ en $\text{Wb/s}$.
  * Cálculo numérico exacto de capacitancia en $\text{pF}$, carga en $\text{pC}$ y energía electrostática en $\text{pJ}$.
  * Osciloscopios digitales en tiempo real con trazado simultáneo de flujo y fem inducida $\mathcal{E}(t)$.

---

## ⚡ Herramientas de Laboratorio de Escritorio

1. **Captura de Evidencia y Reporte Institucional:**
   * Con un solo clic en **"Ficha Evidencia"**, el software genera automáticamente una captura de alta resolución con **membrete oficial de la Universidad Popular del Cesar**, fecha, hora, parámetros físicos y código de validación.
   * Descarga simultáneamente un archivo de texto estructurado (`Ficha_Informe_UPC_*.txt`) listo para anexar en informes formales de laboratorio.
2. **Atajos de Teclado de Escritorio:**
   * `[Espacio]`: Pausar / Reanudar la simulación en tiempo real.
   * `[R]`: Reiniciar el experimento actual a sus valores iniciales.
   * `[M]`: Alternar instantáneamente entre *Modo Exploración* y *Modo Medición*.
   * `[F1]`: Abrir modal de **Teoría Explicada Fácil** con ejemplos de la vida diaria y formulación matemática.
   * `[Ctrl + K]`: Abrir **Buscador Rápido** indexado por conceptos curriculares de la UPC.
3. **Barra de Estado Nativa (Status Bar 24px):**
   * Informa en tiempo real el estado del motor físico (60 FPS), la sala actual, el régimen activo y la versión del software.

---

## 🔬 Las 6 Salas de Laboratorio Implementadas

| Sala | Tema Curricular UPC | Motor Físico y Numérico | Instrumentación |
|---|---|---|---|
| **Sala 1** | Electrostática 2D y Ley de Coulomb | RK4 (Runge-Kutta 4) para líneas de campo, gradiente $\vec{E} = -\nabla V$ | Sonda de campo, multímetro de potencial, partículas de prueba |
| **Sala 2** | Ley de Gauss & Flujo Eléctrico | Cuadratura de superficie $\oint \vec{E} \cdot d\vec{A} = Q_{\text{enc}}/\varepsilon_0$ | Indicador de flujo en tiempo real, superficies esféricas y prismáticas |
| **Sala 3** | Capacitancia & Dieléctricos (PhET) | Modelo analítico de placas $C = \kappa \varepsilon_0 A / d$, $U = \frac{1}{2} C V^2$ | Voltímetro flotante 2 sondas, sensor de campo, selector dieléctrico (Teflón, Vidrio, Cerámica) |
| **Sala 4** | Magnetostática & Biot-Savart | Trazador de campo circular $\vec{B} = \frac{\mu_0 I}{2\pi r}\hat{\theta}$ | Brújula magnética interactiva, conductores paralelos y antiparalelos |
| **Sala 5** | Dinámica 3D & Fuerza de Lorentz | Integrador Simpléctico **Boris Pusher** en Three.js | Vectores dinámicos $(\vec{v}, \vec{F}, \vec{B}, \vec{E})$, Selector de Wien, Ciclotrón, Botella magnética |
| **Sala 6** | Inducción de Faraday & Lenz | Integración de flujo variable $\mathcal{E} = -N \frac{d\Phi_B}{dt}$ | Bobina multiespira, galvanómetro analógico, bombilla y osciloscopio digital |

---

## 🛠️ Estructura del Proyecto

```
Proyecto Simulador/
├── electron/
│   └── main.cjs                     # Ventana nativa; sandbox, permisos denegados y guardas de navegación
├── build/                           # icon.ico / icon.png del ejecutable de Windows
├── src/
│   ├── App.tsx                      # Composición de la aplicación (estado de modos y paneles)
│   ├── main.tsx                     # Punto de entrada (ErrorBoundary global)
│   ├── app/
│   │   └── defaults.ts              # Estado inicial y presets de Electrostática / Lorentz
│   ├── hooks/
│   │   ├── useElementSize.ts        # ResizeObserver reutilizable para los lienzos
│   │   ├── useExportActions.ts      # Captura y ficha de evidencia + aviso de error visible
│   │   ├── useGlobalShortcuts.ts    # [Espacio] [R] [M] [F1] [Ctrl+K]
│   │   ├── usePresetRequest.ts      # Aplica presets pedidos por el panel/buscador
│   │   └── useRoomPresets.ts        # Solicitudes de preset por sala
│   ├── components/
│   │   ├── TopNavbar.tsx            # Header nativo de 48px con drag region
│   │   ├── LeftGuidePanel.tsx       # Panel pedagógico de 280px con presets 1-clic
│   │   ├── ControlPanel.tsx         # Panel de sliders con micro-guías intuitivas
│   │   ├── BottomStatusBar.tsx      # Barra de estado nativa de 24px
│   │   ├── WelcomeScreen.tsx        # Launcher de escritorio para las 6 salas
│   │   ├── TheoryModal.tsx          # "En palabras simples / Ejemplos cotidianos"
│   │   ├── SearchModal.tsx          # Buscador universal (Ctrl+K)
│   │   ├── UpcBadge.tsx             # Escudo institucional
│   │   ├── ErrorBoundary.tsx        # Un fallo de una sala no tumba la aplicación
│   │   ├── NoticeToast.tsx          # Aviso visible si falla una exportación
│   │   ├── RoomViewport.tsx         # Muestra la sala seleccionada
│   │   ├── ElectrostaticsCanvas.tsx # Sala 1
│   │   ├── GaussFluxCanvas.tsx      # Sala 2
│   │   ├── CapacitorLabCanvas.tsx   # Sala 3 (composición)
│   │   ├── capacitor/               #   layout puro, renderer Canvas puro, HUD y controles
│   │   ├── MagnetostaticsCanvas.tsx # Sala 4
│   │   ├── LorentzViewer3D.tsx      # Sala 5
│   │   ├── FaradayInductionCanvas.tsx # Sala 6 (composición)
│   │   └── faraday/                 #   renderer Canvas puro, hook de simulación, HUD y controles
│   ├── data/
│   │   └── topics.ts                # Índice curricular del buscador
│   ├── physics/                     # Motores físicos puros (sin React), validados por tests
│   │   ├── electrostatics.ts
│   │   ├── gauss.ts
│   │   ├── capacitance.ts
│   │   ├── biotsavart.ts
│   │   ├── lorentz.ts
│   │   ├── faraday.ts
│   │   └── __tests__/               # 100 pruebas contra soluciones analíticas (Vitest)
│   ├── utils/
│   │   └── reportGenerator.ts       # Generador de ficha y evidencia UPC
│   └── types/
│       └── index.ts
├── index.html
├── package.json                     # Scripts y configuración de electron-builder
└── vite.config.ts                   # Base './' (100 % offline), CSP de producción y Vitest
```

---

## ✅ Verificación y Pruebas Físicas

Los motores de `src/physics/` son funciones puras (sin React ni DOM) y se validan con **Vitest** contra soluciones analíticas exactas:

```bash
npm test          # ejecuta toda la suite una vez (100 pruebas, < 1 s)
npm run test:watch
```

| Ley / Modelo | Qué se comprueba | Resultado medido |
|---|---|---|
| **Capacitor de placas paralelas** (16) | $C=\kappa\varepsilon_0 A/d$, $Q=CV$, $U=\tfrac12 CV^2$, inserción parcial, $Q$ constante (V y U se dividen por $\kappa$), $Q_b=Q(1-1/\kappa)$, $E=V/d$ | error relativo < 10⁻¹² |
| **Biot-Savart / Ampère** (12) | $B=\mu_0 I/(2\pi r)$, regla de la mano derecha, superposición, $\oint \vec B\cdot d\vec l=\mu_0 I_{enc}$ | error = $s/(r^2+s)$ exacto del modelo (≤ 1 % para $r\ge 30$ px) |
| **Fuerza de Lorentz — Boris** (20) | Radio de Larmor $r=mv/(\lvert q\rvert B)$, periodo ciclotrón $T=2\pi m/(\lvert q\rvert B)$, deriva $E\times B$, filtro de Wien, botella magnética | $r$: 2.5×10⁻⁶; $T$: 2.1×10⁻⁵ (2.º orden en dt) |
| **Conservación de energía (Boris)** | $\lVert\vec v\rVert$ constante con $B$ puro: 1 000 pasos y 201 000 pasos, incluso con $\omega\,dt=2$ | deriva 1.4×10⁻¹⁵ (1 000 pasos); 1.1×10⁻¹³ (201 000) |
| **Faraday-Lenz** (29) | $\mathcal E=-N\,d\Phi/dt$ en magnitud y signo, circuito $I=\mathcal E/R$, $\int\mathcal E\,dt=-N\Delta\Phi$, flujo vs. ángulo sólido analítico | flujo en el eje: error < 6×10⁻⁴ con 32 nodos |
| **Ley de Gauss** (16) | $\Phi=Q_{enc}/\varepsilon_0$ para esfera y caja, carga exterior $\Rightarrow\Phi\approx 0$ | esfera centrada: 1.5×10⁻⁵; caja: 1.3×10⁻³ |
| **Electrostática 2D** (7) | $E=kq/r^2$, $\vec E=-\nabla V$, superposición, líneas de campo RK4 | $\vec E=-\nabla V$: < 10⁻⁶ |

### Decisiones numéricas que las pruebas fijaron

* **Flujo magnético (Sala 6).** La cuadratura original evaluaba el campo solo en el plano de la pantalla ($z=0$) y asumía $B$ constante a lo largo del diámetro perpendicular. Aunque convergía al aumentar los segmentos, **convergía a un valor distinto del flujo 3D exacto** (desvíos de 2 % a más de 300 % con el imán cerca de la bobina). Ahora la espira se integra como disco 3D completo (Gauss-Legendre en $r$ × regla del punto medio en $\theta$, con $B$ evaluado en $(x,y,z)$). Con los 32 nodos radiales del laboratorio, el error frente a una referencia independiente es ≤ 0.06 % en las 7 posiciones estándar y 16 nodos ya bastan para < 1 %.
* **Calibración de los instrumentos.** El flujo 3D exacto es ~4.3 veces menor que la antigua aproximación plana cuando el imán pasa cerca de la bobina (FEM pico con N = 3 en oscilación: 0.35 V frente a 1.5 V). Para que la demostración siga siendo clara se dimensionaron los instrumentos, no la física: lámpara miniatura de 0.13 W (antes 2.5 W), galvanómetro de fondo de escala 0.7 V (antes 3 V) y ganancia del osciloscopio ×4.3. Las pruebas de *calibración de la demostración* fijan brillo pico > 0.2 y deflexión de aguja > 1/3.
* **Regularización del polo (softening).** El valor original (10⁻⁵ m², núcleo de 3.2 mm) sesgaba hasta un 5 % el flujo cuando el polo pasa a 1 cm de la bobina. Se redujo a **10⁻⁷ m²** (núcleo de 0.3 mm): sigue evitando `NaN`/`Infinity` en el polo y el sesgo del campo es de 3.8×10⁻⁴ a 2 cm, 6.3×10⁻⁵ a 5 cm y 1.7×10⁻⁵ a 10 cm.
* **Unidades de pantalla.** Electrostática (Sala 1) y Biot-Savart (Sala 4) trabajan en píxeles con constantes visuales (`COULOMB_K = 89900`, `MU0_OVER_2PI = 1000`); sus pruebas validan la **forma funcional** ($1/r$, $1/r^2$, $\vec E=-\nabla V$, Ampère) y documentan el error de la regularización de núcleo, no valores en unidades SI.
* **Hilo de Biot-Savart.** El modelo es un conductor **infinito** perpendicular al plano (problema 2D): no existe error por longitud finita; la única desviación respecto de $\mu_0I/2\pi r$ es la regularización de núcleo $s=9$ px².

---

## 🔒 Seguridad de la Aplicación de Escritorio

* Renderizador aislado: `contextIsolation`, `sandbox`, sin `nodeIntegration`, sin script de *preload* y **sin canales IPC** (mínimo privilegio).
* **CSP estricta** en el bundle de producción (`default-src 'self'`, sin orígenes remotos); verificada en Electron: bloquea scripts *inline* y conexiones externas.
* Navegación bloqueada fuera de `dist/` (incluye redirecciones); solo enlaces `http(s)` se abren en el navegador del sistema.
* Todos los permisos del navegador (cámara, micrófono, geolocalización…) se deniegan; `devTools` solo en desarrollo; `ELECTRON_START_URL` solo se respeta en desarrollo.
* *Fuses* de Electron en el empaquetado: `runAsNode`, `NODE_OPTIONS` e inspector desactivados; solo se carga código desde el `asar`.

---

## ⚖️ Licencia y Créditos Académicos
Desarrollado para la **Universidad Popular del Cesar (UPC)**, Facultad de Ingenierías y Tecnologías, Departamento de Física.  
Valledupar, Cesar, Colombia • Noviembre 2026.

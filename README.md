# 🏛️ Simulador de Electromagnetismo — Universidad Popular del Cesar (UPC)
### Estación de Laboratorio Virtual de Escritorio (2D / 3D) • Versión 2.0 Desktop Edition

Aplicación nativa de escritorio y estación de laboratorio de física computacional desarrollada para la **Universidad Popular del Cesar (UPC)**, Valledupar, Colombia. Diseñada con un estándar riguroso de ingeniería pedagógica para suplir las carencias de laboratorios físicos mediante simulación interactiva de alta fidelidad, 100% offline y optimizada para equipos de salas de informática universitarias.

Construida con la arquitectura: **Electron + Vite + React 19 + TypeScript + Three.js + Tailwind CSS**.

---

## 🚀 Modos de Ejecución y Distribución

### 1. Ejecutable Nativo de Windows (`.exe` Portable — Sin Instalación)
Ideal para los computadores de las salas de sistemas de la UPC donde los estudiantes o docentes no tienen permisos de Administrador:
```bash
npm run electron:exe
```
Genera en la carpeta `release/` el ejecutable autónomo:
`Simulador_Electromagnetismo_UPC_Portable.exe`
> **Ventaja UPC:** Se puede copiar directamente a una memoria USB y ejecutar con doble clic en cualquier computador con Windows 10 u 11 sin requerir conexión a internet ni instalación previa.

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
│   └── main.cjs               # Ventana nativa, aceleración GPU, titleBarOverlay
├── build/
│   ├── icon.ico               # Ícono de Windows para el ejecutable .exe
│   └── icon.png               # Ícono de alta resolución
├── src/
│   ├── components/
│   │   ├── TopNavbar.tsx            # Header nativo de 48px con drag region
│   │   ├── LeftGuidePanel.tsx       # Panel pedagógico de 280px con presets 1-clic
│   │   ├── ControlPanel.tsx         # Panel de sliders con micro-guías intuitivas
│   │   ├── BottomStatusBar.tsx      # Barra de estado nativa de 24px
│   │   ├── WelcomeScreen.tsx        # Launcher de escritorio para las 6 salas
│   │   ├── TheoryModal.tsx          # Guía con "En palabras simples / Ejemplos cotidianos"
│   │   ├── SearchModal.tsx          # Buscador universal (Ctrl+K)
│   │   ├── ElectrostaticsCanvas.tsx # Sala 1
│   │   ├── GaussFluxCanvas.tsx      # Sala 2
│   │   ├── CapacitorLabCanvas.tsx   # Sala 3
│   │   ├── MagnetostaticsCanvas.tsx # Sala 4
│   │   ├── LorentzViewer3D.tsx      # Sala 5
│   │   └── FaradayInductionCanvas.tsx # Sala 6
│   ├── physics/                     # [INTOCABLES] Motores físicos analíticos y numéricos
│   │   ├── electrostatics.ts
│   │   ├── gauss.ts
│   │   ├── capacitance.ts
│   │   ├── biotsavart.ts
│   │   ├── lorentz.ts
│   │   └── faraday.ts
│   ├── utils/
│   │   └── reportGenerator.ts       # Generador de ficha y evidencia UPC
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json                     # Scripts y configuración de electron-builder
└── vite.config.ts                   # Base './' para soporte 100% offline
```

---

## ⚖️ Licencia y Créditos Académicos
Desarrollado para la **Universidad Popular del Cesar (UPC)**, Facultad de Ingenierías y Tecnologías, Departamento de Física.  
Valledupar, Cesar, Colombia • Noviembre 2026.

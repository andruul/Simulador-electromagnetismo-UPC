# 🏛️ Simulador de Electromagnetismo — Universidad Popular del Cesar (UPC)
### Estación de Laboratorio Virtual (2D / 3D) • Edición Web, Móvil & Escritorio

[![Web en Vivo](https://img.shields.io/badge/Web%20en%20Vivo-Vercel%20Production-2D7A64?style=for-the-badge&logo=vercel)](https://simulador-electromagnetismo-upc.vercel.app)
[![Plataforma](https://img.shields.io/badge/Plataforma-Web%20%7C%20M%C3%B3vil%20%7C%20Windows%20Portable-3A7CA5?style=for-the-badge)](https://simulador-electromagnetismo-upc.vercel.app)
[![Pruebas Automatizadas](https://img.shields.io/badge/Tests-120%2F120%20Aprobados-success?style=for-the-badge)](https://github.com/andruul/Simulador-electromagnetismo-UPC)

Estación interactiva de física computacional desarrollada para la **Universidad Popular del Cesar (UPC)**, Valledupar, Colombia (Facultad de Ingenierías y Tecnologías — Departamento de Física). Diseñada con rigor numérico y dimensional en el **Sistema Internacional (SI)**, interfaz clara en paleta **marfil, arena y verde salvia** de alto contraste, soporte táctil universal (`PointerEvents`) y arquitectura modular **100 % estructurada en español**.

- 🌐 **Enlace Web Público:** https://simulador-electromagnetismo-upc.vercel.app
- 💻 **Repositorio Oficial:** https://github.com/andruul/Simulador-electromagnetismo-UPC
- 📖 **Guía para Compañeros y Sustentación:** [GUIA_EXPLICACION_PROYECTO.md](./GUIA_EXPLICACION_PROYECTO.md)
- 📋 **Informe Técnico para Jurado:** [INFORME_JURADO_UPC.md](./INFORME_JURADO_UPC.md)

---

## ⚡ Inicio Rápido (Para Compañeros del Equipo)

### Requisitos previos
- Tener instalado **Node.js 20+** (descargable desde https://nodejs.org).

### Pasos para ejecutar el proyecto en tu computador

1. **Clonar el repositorio (o descomprimir el archivo `.zip`):**
   ```bash
   git clone https://github.com/andruul/Simulador-electromagnetismo-UPC.git
   cd Simulador-electromagnetismo-UPC
   ```
2. **Instalar dependencias (solo la primera vez):**
   ```bash
   npm install
   ```
3. **Abrir el simulador en el navegador (con recarga en vivo):**
   ```bash
   npm run dev
   ```
   Luego abre `http://localhost:5173` en tu navegador.

### Comandos útiles de verificación y empaquetado
```bash
npm test              # Ejecuta las 120 pruebas automatizadas (física SI + interfaz + URL)
npm run lint          # Analizador estático oxlint (0 errores, 0 advertencias)
npm run build         # Compila producción en dist/ con división automática de código (Code Splitting)
npm run electron:dev  # Abre la aplicación como ventana nativa de escritorio (Electron)
npm run electron:exe  # Genera el ejecutable portable de Windows (.exe) en release/
```

---

## 🎓 Enfoque Pedagógico: Dos Modos Complementarios

El simulador cuenta con un interruptor en la barra superior (o tecla `[M]`):

1. **🔹 Modo Exploración (Conceptual):**
   - Pensado para comprender intuitivamente el fenómeno antes de ver ecuaciones complejas (*"Campo Muy Fuerte"*, *"Flujo saliente (+)"*, *"Capacitancia Alta"*).
   - Incluye el panel izquierdo **Guía & Experimentos** con prácticas de **1 clic** listas para demostrar en clase.
2. **🔬 Modo Medición (Rigor SI):**
   - Todas las salas entregan lecturas cuantitativas verificables en el **Sistema Internacional (SI)**:
     - Escala espacial explícita `1.00 m = 100 px` en lienzos 2D.
     - Campo eléctrico $|\vec{E}|$ en $\text{N/C}$ y $\text{kN/C}$; potencial $V$ en $\text{V}$ y $\text{kV}$.
     - Flujo eléctrico $\Phi_E$ en $\text{N}\cdot\text{m}^2/\text{C}$ comparado contra $Q_{\text{enc}}/\varepsilon_0$.
     - Capacitancia ideal y con **corrección de borde de Kirchhoff** en $\text{pF}$, redes **Serie / Paralelo**, carga en $\text{pC}$ y energía en $\text{pJ}$.
     - Campo magnético $|\vec{B}|$ en $\mu\text{T}$ y circulación numérica de la **Ley de Ampère** ($\oint_C \vec{B}\cdot d\vec{l} = \mu_0 I_{\text{enc}}$) en $\mu\text{T}\cdot\text{m}$.
     - Dinámica 3D con razón normalizada $|q|/m = 1.00\ \text{C/kg}$, radio de Larmor en $\text{m}$ y frecuencia ciclotrón en $\text{Hz}$.
     - Flujo magnético 3D en $\text{mWb}$, derivada $d\Phi_B/dt$ en $\text{Wb/s}$, FEM inducida en $\text{V}$ y corriente en $\text{mA}$.

---

## 🔬 Las 6 Salas de Laboratorio Virtual

| Sala | Unidad Curricular UPC | Motor Físico y Numérico | Instrumentación Interactiva |
| :--- | :--- | :--- | :--- |
| **Sala 1** | Electrostática 2D y Ley de Coulomb | RK4 de 4.º orden, mapa de potencial con interpolación bilineal suave y Coulomb SI exacto ($100\text{ px}=1\text{ m}$) | Multímetro digital SI, partículas de prueba dinámicas y regla métrica |
| **Sala 2** | Ley de Gauss (2D y 3D Volumétrico) | Cuadratura de Fibonacci en esfera, cubo, cilindro y tetraedro + Teorema de la Divergencia | Superficies gaussianas 2D/3D, vectores normales $\hat{n}$ y balance cara por cara |
| **Sala 3** | Capacitancia, Dieléctricos y Redes | $C=\kappa\varepsilon_0 A/d$, factor de borde de **Kirchhoff** y solucionador de redes **Serie / Paralelo** | Dieléctrico deslizable, batería conectada/aislada, voltímetro de 2 puntas y analizador de red |
| **Sala 4** | Magnetostática, Biot-Savart y Ampère | $\vec{B}=\frac{\mu_0 I}{2\pi r}\hat{\theta}$ en SI + integración cerrada $\oint_C \vec{B}\cdot d\vec{l}=\mu_0 I_{\text{enc}}$ (256 nodos) | Brújula/magnetómetro SI, hilos paralelos/solenoide y **Curva Amperiana arrastrable** |
| **Sala 5** | Dinámica 3D y Fuerza de Lorentz | Integrador simpléctico **Boris Pusher** en WebGL (Three.js) que conserva la energía cinética | Selector de Wien, Ciclotrón, Deriva $\vec{E}\times\vec{B}$ y Botella Magnética |
| **Sala 6** | Inducción de Faraday y Ley de Lenz | Cuadratura radial de **Gauss-Legendre (32 nodos)** sobre disco 3D y $\mathcal{E}=-N\,d\Phi_B/dt$ | Imán arrastrable/oscilante, galvanómetro amortiguado, bombilla y osciloscopio accesible |

---

## 🗂️ Arquitectura del Código Fuente (100 % en Español)

```
Proyecto Simulador/
├── index.html                           # Punto de montaje HTML (carga src/principal.tsx)
├── electron/main.cjs                    # Proceso principal de Electron endurecido (sandbox + CSP)
├── src/
│   ├── principal.tsx                    # Arranque de React con ControladorErrores global
│   ├── Aplicacion.tsx                   # Orquestador global, persistencia y atajos
│   ├── estilos.css                      # Paleta pastel Marfil-Arena-Salvia y utilidades CSS
│   │
│   ├── salas/                           # 🏛️ Vistas y Renderizadores de las 6 Salas
│   │   ├── sala1_electrostatica/        # LienzoElectrostatica.tsx + renderizadorElectrostatica.ts
│   │   ├── sala2_gauss/                 # LienzoGauss2D.tsx + renderizadorGauss2D.ts + VisorGauss3D.tsx
│   │   ├── sala3_capacitancia/          # LienzoCapacitor.tsx, Controles, Telemetría, diseño y renderizador
│   │   ├── sala4_magnetostatica/        # LienzoMagnetostatica.tsx + renderizadorMagnetostatica.ts
│   │   ├── sala5_lorentz3d/             # VisorLorentz3D.tsx + TelemetriaLorentz.tsx
│   │   └── sala6_faraday/               # LienzoFaraday.tsx, Controles, Telemetría, renderizador y hook
│   │
│   ├── interfaz/                        # 🖥️ Componentes de Interfaz y Navegación
│   │   ├── BarraSuperior.tsx            # Selector de salas, modo SI, Ficha Evidencia y Compartir Enlace
│   │   ├── BarraEstado.tsx              # Barra inferior de estado y FPS
│   │   ├── PanelGuia.tsx                # Guía pedagógica lateral con experimentos de 1 clic
│   │   ├── PanelControles.tsx           # Inspector contextual (solo en salas que lo requieren)
│   │   ├── VisorSalas.tsx               # Conmutador central con carga diferida (React.lazy)
│   │   ├── PantallaBienvenida.tsx       # Portal institucional UPC con las 8 unidades curriculares
│   │   ├── ModalTeoria.tsx              # Compendio teórico y fórmulas explicadas fácil (F1)
│   │   ├── ModalBuscador.tsx            # Buscador instantáneo indexado (Ctrl+K)
│   │   ├── InsigniaUPC.tsx              # Escudo vectorial oficial de la UPC
│   │   ├── SeccionPlegable.tsx          # Acordeón reutilizable
│   │   ├── AvisoNotificacion.tsx        # Notificaciones flotantes
│   │   ├── ControladorErrores.tsx       # Aislamiento de fallos por sala
│   │   └── __tests__/interfaz.test.tsx  # Pruebas automatizadas de componentes React
│   │
│   ├── fisica/                          # ⚛️ Motores Físicos Puros (sin React ni DOM)
│   │   ├── electrostatica.ts            # Coulomb visual y SI exacto, RK4 de campo y equipotenciales
│   │   ├── gauss.ts                     # Flujo 2D/esfera/caja en unidades SI
│   │   ├── gauss3d.ts                   # Flujo volumétrico 3D y Teorema de la Divergencia
│   │   ├── capacitancia.ts              # Condensadores, dieléctricos, Kirchhoff y redes Serie/Paralelo
│   │   ├── biotsavart.ts                # Biot-Savart SI exacto y Ley de Ampère numérica
│   │   ├── lorentz.ts                   # Integrador simpléctico de Boris 3D
│   │   ├── faraday.ts                   # Dipolo 3D, cuadratura Gauss-Legendre y Faraday-Lenz
│   │   └── __tests__/                   # 113 pruebas unitarias contra soluciones analíticas
│   │
│   ├── ganchos/                         # 🪝 Hooks personalizados (persistencia, tamaño, atajos, exportar)
│   ├── configuracion/                   # ⚙️ Estado y presets iniciales (valoresPorDefecto.ts)
│   ├── datos/                           # 📚 Base de datos curricular (temas.ts)
│   ├── tipos/                           # 📐 Contratos e interfaces TypeScript (index.ts)
│   └── utilidades/                      # 🛠️ Generador de fichas de evidencia con membrete UPC
├── GUIA_EXPLICACION_PROYECTO.md         # Manual detallado para estudiar y sustentar el proyecto
├── INFORME_JURADO_UPC.md                # Informe técnico formal de ingeniería y validación
├── package.json
└── vite.config.ts
```

---

## ✅ Calidad, Rendimiento, Accesibilidad y Seguridad

- **120 / 120 pruebas automatizadas en Vitest (`< 1 s`):** 113 pruebas matemáticas contra soluciones analíticas exactas + 7 suites de renderizado de interfaz y persistencia URL.
- **Carga ultrarrápida (`Code Splitting`):** Paquete inicial de solo **`92.9 kB` gzip**; `Three.js` se descarga bajo demanda únicamente al abrir una sala 3D.
- **Soporte táctil, teclado y daltonismo:** Eventos `PointerEvents` (`touch-none`) compatibles con celulares y tablets, navegación por flechas de teclado en los lienzos y trazos diferenciados (punteado vs. continuo) en el osciloscopio.
- **Persistencia y Enlaces Compartibles:** Guarda automáticamente tu trabajo en `localStorage` y genera enlaces directos por sala (`?sala=faraday&vista=lab`).
- **Seguridad Desktop:** Electron con `sandbox`, `contextIsolation`, sin `nodeIntegration` y política `Content-Security-Policy` estricta offline.

---

## ⚖️ Créditos Académicos
Desarrollado para la **Universidad Popular del Cesar (UPC)** — Facultad de Ingenierías y Tecnologías, Departamento de Física.  
Valledupar, Cesar, Colombia • 2026.

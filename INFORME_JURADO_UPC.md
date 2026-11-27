# 🏛️ Universidad Popular del Cesar — Laboratorio Virtual de Electromagnetismo
## Informe Técnico, Físico y de Arquitectura para Jurado Evaluador

**Proyecto:** Simulador Computacional Interactivo para Física Electromagnética (2D / 3D)  
**Institución:** Universidad Popular del Cesar (UPC) — Valledupar, Cesar  
**Facultad:** Facultad de Ingenierías y Tecnologías (FIT) — Departamento de Física  
**Repositorio Oficial:** https://github.com/andruul/Simulador-electromagnetismo-UPC  
**Despliegue Público en Vivo:** https://simulador-electromagnetismo-upc.vercel.app  
**Estado de Auditoría:** **APROBADO CON EXCELENCIA (0 errores TypeScript, 0 advertencias de linter, 120/120 pruebas automatizadas superadas).**

---

## 1. Resumen de Ingeniería y Arquitectura

El proyecto implementa una estación de laboratorio virtual modular con **separación estricta de responsabilidades** y nomenclatura íntegra en español:

1. **Motor Físico-Matemático Puro (`src/fisica/`):** Siete módulos independientes de React y del DOM (`electrostatica.ts`, `gauss.ts`, `gauss3d.ts`, `capacitancia.ts`, `biotsavart.ts`, `lorentz.ts`, `faraday.ts`) formulados rigurosamente en el **Sistema Internacional de Unidades (SI)**.
2. **Salas de Simulación (`src/salas/`):** Seis laboratorios interactivos (Canvas 2D de alta densidad `devicePixelRatio` y escenas volumétricas WebGL en `Three.js`), desacoplados en componentes de estado, telemetría tabular y renderizadores puros.
3. **Interfaz Académica (`src/interfaz/`):** Sistema visual en paleta clara **Marfil (`#FAF7F2`), Arena (`#DDD5C8`) y Verde Salvia UPC (`#2D7A64`)** con contraste tipográfico superior a `13:1` (`#231F1C`), paneles contextuales que eliminan controles innecesarios según la sala, buscador curricular `Ctrl+K`, modal teórico `F1`, exportación de **Ficha de Evidencia institucional** y compartición de estado por URL.

---

## 2. Rigor Físico y Métodos Numéricos por Sala

### 2.1. Sala 1 — Electrostática y Ley de Coulomb (`sala1_electrostatica/`)
- **Modelo SI exacto:** Escala métrica explícita en pantalla (`1.00 m = 100 px`), $k_e = 8.9875517923 \times 10^9\ \text{N}\cdot\text{m}^2/\text{C}^2$.
- **Métodos numéricos:** Integración **Runge-Kutta de 4.º orden (RK4)** para líneas de campo, trazado ortogonal para curvas equipotenciales ($\vec{E} = -\nabla V$) y mapa continuo de potencial mediante interpolación bilineal en buffer fuera de pantalla.

### 2.2. Sala 2 — Ley de Gauss 2D y 3D Volumétrico (`sala2_gauss/`)
$$\Phi_E = \oint_{\mathcal{S}} \vec{E} \cdot d\vec{A} = \frac{Q_{\text{enc}}}{\varepsilon_0}, \qquad \oint_{\mathcal{S}} \vec{E} \cdot d\vec{A} = \iiint_{\mathcal{V}} (\nabla \cdot \vec{E})\,dV$$
- **Métodos numéricos:** Cuadratura esférica espiral de Fibonacci (720 nodos), subdivisión baricéntrica en tetraedros regulares e integración cara por cara en cubos y cilindros 3D bajo campos uniformes y no uniformes (lineales, cuadráticos, divergentes y coulombianos), con error relativo $< 0.8\%$.

### 2.3. Sala 3 — Capacitancia, Dieléctricos, Kirchhoff y Redes (`sala3_capacitancia/`)
$$C = \frac{\kappa \varepsilon_0 A}{d}, \qquad f_{\text{Kirchhoff}} = 1 + \frac{d}{\pi R}\left[\ln\left(\frac{16\pi R}{d}\right) - 1\right]$$
- Simula los dos regímenes termodinámicos/electrostáticos canónicos: **fuente conectada ($V = \text{cte}$)** y **placas aisladas ($Q = \text{cte}$)** con inserción continua de dieléctricos ($\kappa \in [1.0, 8.5]$) y carga ligada de polarización $Q_b = Q(1 - 1/\kappa)$.
- Incorpora visualización de líneas curvas de efecto de borde, cálculo de $C_{\text{Kirchhoff}}$ y solucionador interactivo de **bancos de capacitores en Serie y en Paralelo**.

### 2.4. Sala 4 — Magnetostática: Ley de Biot-Savart y Ley de Ampère (`sala4_magnetostatica/`)
$$\vec{B}(\vec{r}) = \frac{\mu_0 I}{2\pi r}\hat{\theta}, \qquad \oint_{\mathcal{C}} \vec{B}\cdot d\vec{l} = \mu_0 I_{\text{enc}}$$
- Evalúa el campo magnético exacto en $\mu\text{T}$ a escala `1.00 m = 100 px` e integra numéricamente la circulación cerrada $\oint_{\mathcal{C}} \vec{B}\cdot d\vec{l}$ en 256 nodos angulares sobre una **Curva Amperiana interactiva**, verificando invarianza frente a corrientes exteriores y cancelación de corrientes antiparalelas.

### 2.5. Sala 5 — Dinámica Tridimensional de Lorentz (`sala5_lorentz3d/`)
$$\frac{d\vec{v}}{dt} = \frac{q}{m}\left(\vec{E} + \vec{v}\times\vec{B}\right)$$
- Implementa el **Integrador Simpléctico de Boris (`borisStep`)** con acumulador de paso fijo real ($\Delta t \in [0.005, 0.150]\ \text{s}$) en una cámara de vacío `60×44×60 m`, conservando la energía cinética a precisión de máquina ($\Delta v / v \approx 1.1 \times 10^{-13}$ tras $201\,000$ pasos).
- Incluye selección individual 3D por *Raycasting* con **Inspector de Partícula** (rapidez exacta $|\vec{v}|$, ángulos $(\theta, \phi)$ respecto al flujo, carga, masa y botón de aplicación), **Gizmo 3D (`X, Y, Z` / `î, ĵ, k̂`)** y sistema global de **Deshacer/Rehacer (`Ctrl+Z` / `Ctrl+Y`)** transversal a las 6 salas.

### 2.6. Sala 6 — Inducción Electromagnética de Faraday-Lenz (`sala6_faraday/`)
$$\mathcal{E} = -N \frac{d\Phi_B}{dt}, \qquad I = \frac{\mathcal{E}}{R_{\text{total}}}, \qquad P = I^2 R_{\text{carga}}$$
- Integra el flujo magnético 3D real de un dipolo finito sobre el disco de la bobina mediante **Cuadratura de Gauss-Legendre de 32 nodos radiales** (error $< 0.06\%$), con bucle `requestAnimationFrame` continuo sin reinicios de estado, HUD de ancho fijo tabular (`tabular-nums`) y osciloscopio accesible para daltonismo.

---

## 3. Métricas Verificadas de Calidad, Rendimiento y Accesibilidad

| Indicador de Ingeniería | Herramienta / Criterio | Resultado Medido |
| :--- | :--- | :--- |
| **Chequeo de Tipos** | `tsc -b` (TypeScript estricto) | **0 errores** |
| **Análisis Estático** | `oxlint src/` (60 archivos, 116 reglas) | **0 errores, 0 advertencias (58 ms)** |
| **Suite de Pruebas** | `vitest run` (9 suites: física SI + UI + URL) | **120 / 120 pruebas aprobadas (673 ms)** |
| **Carga Diferida (Code Splitting)** | `React.lazy` + `vite build` | **Paquete inicial `92.9 kB` gzip (-70 %)** |
| **Compatibilidad Multi-dispositivo** | `PointerEvents` + `ResizeObserver` + Teclado | **PC, Celular, Tablet y Teclado (`Tab`/Flechas)** |
| **Persistencia y Trazabilidad** | `localStorage` + Query URL + Ficha PNG/TXT | **Sesión persistente + Enlaces `?sala=...`** |
| **Seguridad Desktop** | Electron `sandbox` + `CSP` estricta offline | **Sin CDNs externos ni `nodeIntegration`** |

---

*Universidad Popular del Cesar — Facultad de Ingenierías y Tecnologías • Valledupar, Colombia.*

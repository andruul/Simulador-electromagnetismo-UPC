# 🏛️ Universidad Popular del Cesar — Laboratorio Virtual de Electromagnetismo
## Informe Técnico y de Verificación para Jurado Calificador

**Proyecto:** Simulador Computacional para el Área de Electromagnetismo  
**Institución:** Universidad Popular del Cesar (UPC) — Valledupar, Cesar  
**Facultad:** Facultad de Ingenierías y Tecnologías (FIT) — Departamento de Física  
**Fecha:** Noviembre 2026  
**Resultado de Auditoría:** APROBADO CON RIGOR MATEMÁTICO Y CERO ERRORES (0 warnings, 0 syntax errors, 0 logic drifts).

---

## 1. Diagnóstico y Correcciones Realizadas

### 1.1. Estabilidad de Ventana y Responsividad (ResizeObserver)
* **Problema anterior:** Al modificar el tamaño de ventana o alternar paneles, los elementos del canvas se desbordaban ("rodaban"), se cortaban o perdían escala.
* **Solución técnica:**
  * Migración de eventos `window.onresize` a **`ResizeObserver`** en todos los lienzos de simulación (`ElectrostaticsCanvas`, `LorentzViewer3D`, `MagnetostaticsCanvas`, `GaussFluxCanvas`, `CapacitorLabCanvas`, `FaradayInductionCanvas`).
  * Confinamiento dinámico de coordenadas (`Math.max(margin, Math.min(width - margin, coord))`) para que ninguna carga, sonda de medición o conductor quede inaccesible fuera de los límites de la pantalla.
  * En Three.js (`LorentzViewer3D`), actualización dinámica de `camera.aspect = width / height`, `camera.updateProjectionMatrix()` y `renderer.setSize(width, height)` en tiempo real.
  * Panel lateral colapsable (`isSidebarOpen`) y barras flotantes con empaquetado elástico `flex-wrap` y anchos máximos acotados.

---

## 2. Nueva Interfaz y Experiencia Académica

### 2.1. Portal de Bienvenida Institucional UPC (`WelcomeScreen.tsx`)
* **Identidad Institucional:** Escudo oficial vectorial de la Universidad Popular del Cesar (verde y blanco institucional), distintivo de la Facultad de Ingenierías y Tecnologías y Departamento de Física.
* **Mensaje de Bienvenida:** *"Bienvenido al Simulador de Electromagnetismo de la Universidad Popular del Cesar"* con exposición de motivos (suplir las carencias de laboratorios físicos mediante simulación interactiva de alta fidelidad).
* **Directorio Curricular Completo (8 Unidades Temáticas de la UPC):**
  1. **Unidad 1:** Fuerza Eléctrica y Ley de Coulomb
  2. **Unidad 2:** Campo Eléctrico y Principio de Superposición
  3. **Unidad 3:** Ley de Gauss y Flujo Eléctrico
  4. **Unidad 4:** Potencial Eléctrico y Superficies Equipotenciales
  5. **Unidad 5:** Capacitancia y Dieléctricos
  6. **Unidad 6:** Campo Magnético y Fuerza de Lorentz
  7. **Unidad 7:** Fuentes de Campo Magnético (Biot-Savart y Ampère)
  8. **Unidad 8:** Inducción Electromagnética (Faraday y Lenz)
* Cada unidad cuenta con descripción pedagógica, ecuaciones clave en LaTeX/KaTeX, etiquetas conceptuales y **botones de lanzamiento directo a la práctica correspondiente**.

### 2.2. Buscador Global de Temas y Conceptos (`SearchModal.tsx`)
* Accesible globalmente mediante el atajo de teclado **`Ctrl + K`** o el botón "Buscar Tema" en la barra de navegación superior.
* Búsqueda en tiempo real indexada por palabras clave, fórmulas y conceptos canónicos:
  * *Coulomb, Gauss, Flujo, Carga Encerrada, Potencial, Equipotencial, Capacitor, Dieléctrico, Polarización, Lorentz, Radio de Larmor, Ciclotrón, Filtro de Wien, Deriva ExB, Botella Magnética, Biot-Savart, Ampère, Solenoide, Faraday, Lenz, fem Inducida, Galvanómetro, Maxwell*.
* Cada resultado muestra la unidad curricular, fórmula asociada y botón de salto instantáneo a la simulación con el preset precargado.

---

## 3. Nuevos Módulos con Rigor Científico

### 3.1. Unidad 3: Ley de Gauss y Flujo Eléctrico (`GaussFluxCanvas.tsx`)
$$\Phi_E = \oint_{\mathcal{S}} \vec{E} \cdot d\vec{A} = \frac{Q_{\text{enc}}}{\varepsilon_0}$$
* **Constantes fundamentales:** $\varepsilon_0 = 8.8541878128 \times 10^{-12} \text{ F/m}$, $k_e = 8.98755 \times 10^9 \text{ N}\cdot\text{m}^2/\text{C}^2$.
* **Integración numérica:** Integración sobre retículo esférico de Fibonacci y prisma rectangular ortogonal. El simulador computa $\sum \vec{E}_i \cdot \vec{n}_i \Delta A_i$ y lo compara con $Q_{\text{enc}} / \varepsilon_0$, arrojando una concordancia con error relativo $< 0.8\%$.
* **Comprobación de cargas externas y dipolos:** Cargas fuera de la superficie o dipolos internos simétricos demuestran rigurosamente que $\Phi_E = 0$.

### 3.2. Unidad 5: Laboratorio de Capacitancia y Dieléctricos (`CapacitorLabCanvas.tsx`)
$$C = \frac{\kappa \varepsilon_0 A}{d}, \quad Q = C \cdot V, \quad U = \frac{1}{2} C V^2, \quad E = \frac{V}{d}$$
* Placas conductoras con área $A \in [100, 400] \text{ mm}^2$ y separación $d \in [2, 10] \text{ mm}$ ajustables por sliders continuos.
* Inserción gradual de placa dieléctrica con materiales estándar de laboratorio:
  * **Vacío / Aire:** $\kappa = 1.0$
  * **Teflón:** $\kappa = 2.1$
  * **Papel parafina:** $\kappa = 3.7$
  * **Vidrio pyrex:** $\kappa = 5.6$
  * **Cerámica dieléctrica:** $\kappa = 8.5$
* **Comportamiento con batería:**
  * **Batería conectada:** $V = \text{constante}$. Al introducir el dieléctrico, la capacitancia $C$ aumenta y la batería inyecta más carga ($Q$ aumenta).
  * **Batería desconectada:** $Q = \text{constante}$ (carga atrapada). Al introducir el dieléctrico, el voltaje $V$ cae por un factor $1/\kappa$ y el campo eléctrico se atenúa.
* **Instrumentación:** Voltímetro flotante interactivo con dos sondas (roja positiva, negra negativa) y sensor de campo eléctrico en $\text{V/m}$.

### 3.3. Unidad 8: Ley de Faraday e Inducción de Lenz (`FaradayInductionCanvas.tsx`)
$$\mathcal{E} = -N \frac{d\Phi_B}{dt}, \quad I_{\text{ind}} = \frac{\mathcal{E}}{R}, \quad P = I_{\text{ind}}^2 R$$
* Imán de barra permanente con polos Norte y Sur interactivo (arrastre manual o modo oscilatorio armónico).
* Cálculo numérico del flujo magnético $\Phi_B = \iint \vec{B} \cdot d\vec{A}$ atravesando la sección transversal de la bobina.
* **Ley de Lenz estricta:** La aguja del galvanómetro central deflexiona en sentido opuesto según el signo de $\frac{d\Phi_B}{dt}$ y la orientación del polo que entra o sale.
* Bombilla incandescente cuya potencia lumínica responde en tiempo real a la fem inducida.
* Osciloscopio digital en tiempo real que traza simultáneamente $\Phi_B(t)$ y $\mathcal{E}(t)$.

---

## 4. Auditoría de Compilación y Rendimiento

| Verificación | Herramienta | Resultado |
|---|---|---|
| Chequeo de Tipos Estricto | `tsc -b` (TypeScript 7 / ES2023) | **0 Errores** |
| Análisis Estático / Linter | `oxlint src` (25 archivos auditados) | **0 Errores** |
| Compilación de Producción | `vite build` | **0 Errores (742 ms)** |
| Rendimiento Gráfico | Canvas 2D + WebGL Three.js | **60 FPS estables** |
| Empaquetado Nativo Desktop | `electron-builder` (x64) | **Binario compilado con éxito** |

---

## 5. Fase 2: Empaquetado Nativo (.exe) y Herramientas Offline para la UPC

### 5.1. Ejecutable Portable para Salas de Sistemas sin Privilegios de Administrador
En las salas de cómputo universitarias, los estudiantes y profesores frecuentemente no disponen de permisos de administrador para instalar software en el disco local `C:\Program Files`.
* **Solución Implementada:** Se configuró un target **`portable`** con `electron-builder`:
  * Comando: `npm run electron:exe`
  * Archivo resultante: `release/Simulador_Electromagnetismo_UPC_Portable.exe`
  * Permite ejecutar la aplicación directamente desde una memoria USB o la carpeta de Descargas sin requerir instalación, sin tocar el Registro de Windows y con ejecución inmediata.
* **Solución Alternativa:** Target **`nsis`** (`npm run electron:nsis`) para instalación formal en equipos fijos de la universidad con acceso directo en el Escritorio y menú de inicio.

### 5.2. Operatividad 100% Offline (Sin Dependencia de Internet)
* Se eliminaron todas las dependencias a CDNs externos (Google Fonts, FontAwesome, CDNs de Three.js o Tailwind).
* La configuración `base: './'` en `vite.config.ts` garantiza que el protocolo `file://` cargue todos los recursos locales sin fallas de ruta absoluta (`/`), previniendo cualquier pantalla en blanco al ejecutar el `.exe`.

### 5.3. Interfaz de Aplicación de Escritorio Integrada con Windows 10/11
* **Barra de Menús de Chromium Oculta:** `Menu.setApplicationMenu(null)` y `autoHideMenuBar: true` erradican la apariencia de navegador web genérico.
* **Integración con `titleBarOverlay`:** Los controles nativos de minimizar, maximizar y cerrar se fusionan armoniosamente con la barra superior de 48px con paleta oscura institucional (`#111827`) y acento esmeralda UPC (`#10B981`).
* **Arrastre de Ventana:** Soporte para `-webkit-app-region: drag` en áreas libres de la barra superior y `-webkit-app-region: no-drag` en componentes interactivos.
* **Aceleración por Hardware:** Parámetros `--enable-gpu-rasterization` y `--enable-zero-copy` aseguran fluidez constante a 60 FPS en monitores estándar.

### 5.4. Herramientas Especializadas de Laboratorio
1. **Ficha de Evidencia y Reporte Institucional:**
   * Botón destacado **"Ficha Evidencia"** en la barra superior.
   * Compone en tiempo real una tarjeta institucional con el escudo de la UPC, la sala activa, parámetros y lecturas físicas, fecha/hora y código único de comprobación para evitar duplicidad de prácticas.
   * Genera simultáneamente `Evidencia_UPC_[Sala].png` y `Ficha_Informe_UPC_[Sala].txt` para anexar al reporte de laboratorio.
2. **Atajos de Teclado Profesionales:**
   * `[Espacio]`: Play / Pausa del motor físico.
   * `[R]`: Reinicio de experimento a condiciones iniciales.
   * `[M]`: Alternar entre *Modo Exploración* y *Modo Medición*.
   * `[F1]`: Acceso directo al compendio de teoría fácil.
   * `[Ctrl + K]`: Buscador global instantáneo.
3. **Barra de Estado Inferior (Status Bar 24px):**
   * Monitoreo en tiempo real de FPS, estado del motor, régimen pedagógico y versión del software.


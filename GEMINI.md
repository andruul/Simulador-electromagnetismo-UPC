# Directrices del Proyecto • Simulador de Electromagnetismo UPC

## Estándar de Ingeniería UI/UX: Antigravity Design (`antigravity-design-expert`)

Todas las interfaces de usuario, paneles, tarjetas de laboratorio, visores y modales de este proyecto deben regirse por los principios del skill **`antigravity-design-expert`**:

1. **Ingravidez (Weightlessness):**
   - Los elementos interactivos y tarjetas deben transmitir sensación de flotación libre.
   - Emplear sombras multicapa difusas y suaves (ej. `box-shadow: 0 20px 40px rgba(0,0,0,0.05)`).

2. **Profundidad Espacial (Eje Z):**
   - Utilizar estratificación visual en el eje Z (`perspective`, `transform-style: preserve-3d`).
   - Fondos oscuros profundos (`#0B0F17`, `#090D16`) que hagan resaltar los elementos en primer plano.

3. **Glassmorphism:**
   - Translúcidos elegantes con desenfoque de fondo (`backdrop-filter: blur(12px)`).
   - Bordes delgados semitransparentes (`border-white/10`, `border-emerald-500/30`).

4. **Micro-interacciones y Movimiento:**
   - Entradas escalonadas (*staggered*) para listas y rejillas de tarjetas (desfase de `0.1s`).
   - Respetar siempre `prefers-reduced-motion: reduce` para accesibilidad.
   - Optimizar animaciones mediante propiedades aceleradas por GPU (`transform`, `opacity`) sin animar filtros pesados continuamente.

5. **Regla de Oro del Proyecto:**
   - Cualquier mejora estética, animación o efecto visual debe mantener **100% intacta la lógica matemática y física** dentro de `src/physics/`.

import type { SimulationMode } from '../types';

export interface TopicItem {
  id: string;
  unitNumber: number;
  unitName: string;
  title: string;
  synopsis: string;
  simpleExplanation?: string;
  everydayExample?: string;
  formula: string;
  mode: SimulationMode | 'theory';
  presetKey?: string;
  category: 'electrostatics' | 'lorentz3d' | 'magnetostatics' | 'theory' | 'gauss' | 'capacitor' | 'faraday';
  tags: string[];
  badge: string;
}

export interface CourseUnit {
  unitNumber: number;
  title: string;
  subtitle: string;
  description: string;
  simpleExplanation?: string;
  everydayExample?: string;
  keyFormula: string;
  coreConcepts: string[];
  mode: SimulationMode | 'theory';
  defaultPresetKey?: string;
  practices: {
    title: string;
    description: string;
    mode: SimulationMode | 'theory';
    presetKey?: string;
    badge: string;
  }[];
}

export const COURSE_UNITS: CourseUnit[] = [
  {
    unitNumber: 1,
    title: 'Ley de Coulomb & Campo Eléctrico',
    subtitle: 'Interacciones electrostáticas y superposición vectorial',
    description:
      'Estudio analítico y computacional de fuerzas entre cargas puntuales, cálculo del vector campo eléctrico E(r) y mapeo de líneas de fuerza y momentos dipolares.',
    simpleExplanation:
      'Las cargas eléctricas se atraen o se repelen a distancia. Cuanto más cerca estén, más fuerte se empujan.',
    everydayExample:
      'El globo frotado contra el pelo que levanta papelitos o las pantallas que acumulan polvo por estática.',
    keyFormula: 'F⃗ = (1 / 4πε₀) · (|q₁ · q₂| / r²) · r̂',
    coreConcepts: ['Ley de Coulomb', 'Campo Eléctrico E', 'Principio de Superposición', 'Dipolo y Cuadrupolo'],
    mode: 'electrostatics',
    defaultPresetKey: 'dipole',
    practices: [
      {
        title: 'Dipolo Eléctrico (+q, −q)',
        description: 'Mapea la distribución espacial de líneas de campo y simetría dipolar.',
        mode: 'electrostatics',
        presetKey: 'dipole',
        badge: 'Dipolo'
      },
      {
        title: 'Repulsión Cargas Homólogas (+q, +q)',
        description: 'Observa el punto neutro central y la divergencia mutua de líneas de fuerza.',
        mode: 'electrostatics',
        presetKey: 'repulsion',
        badge: 'Repulsión'
      },
      {
        title: 'Cuadrupolo Eléctrico Planar',
        description: 'Simula cuatro cargas alternadas y observa la caída rápida del potencial.',
        mode: 'electrostatics',
        presetKey: 'quadrupole',
        badge: 'Cuadrupolo'
      }
    ]
  },
  {
    unitNumber: 2,
    title: 'Ley de Gauss & Flujo Eléctrico',
    subtitle: 'Teorema de la divergencia y superficies equipotenciales',
    description:
      'Cálculo del flujo eléctrico a través de superficies gaussianas cerradas, simetrías electrostáticas y relación ortogonal E = −∇V con superficies equipotenciales.',
    simpleExplanation:
      'La cantidad de campo eléctrico que sale de una superficie cerrada solo depende de cuánta carga hay encerrada dentro.',
    everydayExample:
      'Una bombilla dentro de una caja cerrada: el flujo de luz que escapa de la caja no cambia si la caja es redonda o cúbica.',
    keyFormula: 'Φ_E = ∮ E⃗ · dA⃗ = Q_enc / ε₀',
    coreConcepts: ['Flujo Eléctrico', 'Superficie Gaussiana', 'Carga Neta Encerrada', 'Superficies Equipotenciales'],
    mode: 'gauss',
    defaultPresetKey: 'monopole',
    practices: [
      {
        title: 'Superficie Gaussiana & Flujo ∮ E · dA',
        description: 'Verifica la ley de Gauss Φ_E = Q_enc / ε₀ en tiempo real con integración de superficie exacta.',
        mode: 'gauss',
        presetKey: 'monopole',
        badge: 'Gauss Exacto'
      },
      {
        title: 'Mapeo de Curvas Equipotenciales 2D',
        description: 'Verifica la ortogonalidad estricta entre el campo eléctrico y las curvas V(r)=cte.',
        mode: 'electrostatics',
        presetKey: 'dipole',
        badge: 'Equipotenciales'
      }
    ]
  },
  {
    unitNumber: 3,
    title: 'Capacitancia & Dieléctricos',
    subtitle: 'Almacenamiento de energía electrostática y polarización',
    description:
      'Configuración de placas conductoras paralelas, distribución de carga superficial σ, campo uniforme interno y efecto de la polarización dieléctrica en la permitividad.',
    simpleExplanation:
      'Un condensador es una pequeña batería ultrarrápida que guarda energía y la suelta en una fracción de segundo.',
    everydayExample:
      'El flash de una cámara fotográfica, las teclas táctiles capacitivas del celular o el desfibrilador de emergencias.',
    keyFormula: 'C = ε₀ · A / d  |  E = σ / ε₀  |  U = ½ C V²',
    coreConcepts: ['Capacitor de Placas Planas', 'Permitividad ε₀', 'Densidad de Carga σ', 'Energía Almacenada'],
    mode: 'capacitor',
    defaultPresetKey: 'teflon',
    practices: [
      {
        title: 'Laboratorio de Capacitancia PhET',
        description: 'Ajusta área A, distancia d, inserta dieléctricos (Teflón, Papel, Vidrio) y mide con voltímetro.',
        mode: 'capacitor',
        presetKey: 'teflon',
        badge: 'Capacitor PhET'
      }
    ]
  },
  {
    unitNumber: 4,
    title: 'Circuitos & Ley de Ohm',
    subtitle: 'Transporte de carga, densidad de corriente y deriva',
    description:
      'Modelo microscópico del flujo de portadores de carga sometidos a un gradiente de potencial electrostático, relación J = σE y disipación óhmica.',
    simpleExplanation:
      'El voltaje empuja a los electrones a través del conductor, y la resistencia del material intenta frenarlos.',
    everydayExample:
      'Una manguera de jardín: el voltaje es la presión del grifo, la corriente es el caudal de agua y la resistencia es el grosor del tubo.',
    keyFormula: 'J⃗ = σ · E⃗ = n · q · v⃗_d  |  V = I · R',
    coreConcepts: ['Densidad de Corriente J', 'Velocidad de Arrastre', 'Ley de Ohm Microscópica', 'Partículas de Prueba'],
    mode: 'electrostatics',
    defaultPresetKey: 'capacitor',
    practices: [
      {
        title: 'Inyección de Partículas de Prueba',
        description: 'Lanza partículas de prueba positivas y negativas para analizar trayectorias de corriente.',
        mode: 'electrostatics',
        presetKey: 'capacitor',
        badge: 'Partículas'
      }
    ]
  },
  {
    unitNumber: 5,
    title: 'Fuerza de Lorentz & Dinámica 3D',
    subtitle: 'Movimiento de partículas en campos electromagnéticos acoplados',
    description:
      'Integración numérica Boris Pusher de la trayectoria de iones en campos E y B 3D. Fenómenos de radio de Larmor, frecuencia de ciclotrón y derivas de plasma.',
    simpleExplanation:
      'Los campos magnéticos nunca aumentan la velocidad de una carga, solo doblan su camino en círculos o hélices.',
    everydayExample:
      'Las auroras boreales en los polos terrestres o los tubos de rayos catódicos de los televisores antiguos.',
    keyFormula: 'F⃗ = q · (E⃗ + v⃗ × B⃗)  |  r_L = m v_⊥ / (|q| B)',
    coreConcepts: ['Fuerza Magnética F=qv×B', 'Radio de Larmor', 'Filtro de Wien', 'Acelerador Ciclotrón', 'Botella Magnética'],
    mode: 'lorentz3d',
    defaultPresetKey: 'helix',
    practices: [
      {
        title: 'Hélice Espiral en B Puro',
        description: 'Movimiento helicoidal puro en campo magnético con conservación estricta de energía.',
        mode: 'lorentz3d',
        presetKey: 'helix',
        badge: 'Espiral 3D'
      },
      {
        title: 'Selector de Velocidades (Filtro de Wien)',
        description: 'Campos E y B cruzados: solo partículas con v = E/B experimentan fuerza nula y siguen rectas.',
        mode: 'lorentz3d',
        presetKey: 'velocity_selector',
        badge: 'Filtro Wien'
      },
      {
        title: 'Acelerador Ciclotrón',
        description: 'Resonancia orbital de partículas aceleradas cíclicamente por radiofrecuencia.',
        mode: 'lorentz3d',
        presetKey: 'cyclotron',
        badge: 'Ciclotrón'
      },
      {
        title: 'Botella Magnética (Confinamiento)',
        description: 'Espejo magnético por gradiente no homogéneo, principio de confinamiento en reactores Tokamak.',
        mode: 'lorentz3d',
        presetKey: 'magnetic_bottle',
        badge: 'Botella B'
      },
      {
        title: 'Deriva E × B (Drift de Plasma)',
        description: 'Trayectoria cicloidal con velocidad neta lateral perpendicular a ambos campos.',
        mode: 'lorentz3d',
        presetKey: 'drift',
        badge: 'Deriva E×B'
      }
    ]
  },
  {
    unitNumber: 6,
    title: 'Biot-Savart & Ley de Ampère',
    subtitle: 'Magnetostática generada por corrientes estacionarias',
    description:
      'Ley de Biot-Savart para corrientes filiformes y Ley circuital de Ampère ∮B·dl = μ₀I_enc. Fuerzas de interacción entre conductores paralelos y solenoides.',
    simpleExplanation:
      'Toda corriente eléctrica convierte al cable en un imán con líneas de fuerza que giran a su alrededor.',
    everydayExample:
      'Los electroimanes de grúas industriales y los motores eléctricos que hacen girar ventiladores y lavadoras.',
    keyFormula: 'B = (μ₀ · I) / (2π · r)  |  ∮ B⃗ · dl⃗ = μ₀ · I_enc',
    coreConcepts: ['Biot-Savart', 'Ley de Ampère', 'Regla de la Mano Derecha', 'Fuerza entre Conductores', 'Solenoide'],
    mode: 'magnetostatics',
    defaultPresetKey: 'parallel_attraction',
    practices: [
      {
        title: 'Conductores Paralelos (Atracción)',
        description: 'Corrientes en el mismo sentido (+Z) generando atracción mutua según la regla de la mano derecha.',
        mode: 'magnetostatics',
        presetKey: 'parallel_attraction',
        badge: 'Atracción'
      },
      {
        title: 'Conductores Opuestos (Repulsión)',
        description: 'Corrientes antiparalelas produciendo repulsión y deformación de las líneas cerradas de B.',
        mode: 'magnetostatics',
        presetKey: 'parallel_repulsion',
        badge: 'Repulsión'
      },
      {
        title: 'Solenoide / Bobina Multihilo',
        description: 'Superposición de corrientes salientes y entrantes formando un campo axial confinado.',
        mode: 'magnetostatics',
        presetKey: 'solenoid',
        badge: 'Solenoide'
      }
    ]
  },
  {
    unitNumber: 7,
    title: 'Ley de Faraday-Lenz & Inducción',
    subtitle: 'Flujo magnético variable y fuerza electromotriz inducida',
    description:
      'Fundamentos de la inducción electromagnética: una variación temporal del flujo magnético engendra una fuerza electromotriz inducida opuesta a la causa que la produce.',
    simpleExplanation:
      'Mover un imán cerca de un cable genera electricidad de inmediato. Si el imán se queda quieto, la corriente se apaga.',
    everydayExample:
      'Las turbinas de represas hidroeléctricas, las cocinas de inducción y las tarjetas de transporte con chip sin contacto.',
    keyFormula: 'ε = - dΦ_B / dt = - d/dt ∬ B⃗ · dA⃗',
    coreConcepts: ['Flujo Magnético Φ_B', 'Ley de Faraday', 'Regla de Lenz', 'Corrientes de Eddy (Foucault)'],
    mode: 'faraday',
    defaultPresetKey: 'faraday',
    practices: [
      {
        title: 'Laboratorio de Inducción Faraday & Lenz',
        description: 'Mueve el imán a través de la bobina de N espiras, mide FEM ε = -N(dΦ/dt) y enciende la bombilla.',
        mode: 'faraday',
        presetKey: 'faraday',
        badge: 'Faraday-Lenz'
      },
      {
        title: 'Dinámica de Cargas en Campos Variables',
        description: 'Explora la respuesta de portadores sometidos a fuerzas electromagnéticas cruzadas.',
        mode: 'lorentz3d',
        presetKey: 'drift',
        badge: 'Drift Dinámico'
      }
    ]
  },
  {
    unitNumber: 8,
    title: 'Ecuaciones de Maxwell & Ondas EM',
    subtitle: 'Unificación electromagnética y radiación de ondas',
    description:
      'Las cuatro ecuaciones fundamentales en formulación diferencial e integral: Gauss eléctrico y magnético, Faraday-Maxwell y Ampère-Maxwell con corriente de desplazamiento.',
    simpleExplanation:
      'Electricidad y magnetismo son dos caras de una misma moneda. Al juntarse e interactuar en el espacio, forman la luz.',
    everydayExample:
      'Las señales de Wi-Fi, la telefonía celular 5G, las ondas de radio y la luz solar que ilumina la Tierra.',
    keyFormula: '∇·E = ρ/ε₀ | ∇·B = 0 | ∇×E = -∂B/∂t | ∇×B = μ₀J + μ₀ε₀∂E/∂t',
    coreConcepts: ['Corriente de Desplazamiento', 'Teorema de Poynting', 'Velocidad de la Luz c', 'Ondas Electromagnéticas'],
    mode: 'theory',
    defaultPresetKey: 'maxwell',
    practices: [
      {
        title: 'Síntesis Universal de Maxwell',
        description: 'Revisa las 4 ecuaciones universales, su significado físico e impacto en las telecomunicaciones.',
        mode: 'theory',
        presetKey: 'maxwell',
        badge: 'Maxwell 4'
      },
      {
        title: 'Laboratorio de Partículas 3D',
        description: 'Simula el movimiento tridimensional bajo la acción simultánea de campos E y B.',
        mode: 'lorentz3d',
        presetKey: 'helix',
        badge: 'Simulación 3D'
      }
    ]
  }
];

export const TOPICS_DATABASE: TopicItem[] = [
  {
    id: 'coulomb',
    unitNumber: 1,
    unitName: 'Unidad 1',
    title: 'Ley de Coulomb & Interacción Electrostática',
    synopsis:
      'Fuerza fundamental electrostática entre cargas puntuales en reposo en el vacío o medio material. Sigue la ley del inverso del cuadrado de la distancia.',
    simpleExplanation:
      'Cargas del mismo signo se repelen; cargas opuestas se atraen. La fuerza cae rápidamente si las separas.',
    everydayExample:
      'Frotar un peine contra el cabello seco para levantar pequeños pedacitos de papel.',
    formula: 'F = (1 / 4πε₀) · (|q₁ · q₂| / r²)',
    mode: 'electrostatics',
    presetKey: 'dipole',
    category: 'electrostatics',
    tags: ['coulomb', 'fuerza', 'cargas puntuales', 'interaccion', 'electrostática', 'inverso cuadrado'],
    badge: 'Electrostática'
  },
  {
    id: 'dipole',
    unitNumber: 1,
    unitName: 'Unidad 1',
    title: 'Dipolo Eléctrico & Momento Dipolar',
    synopsis:
      'Par de cargas de igual magnitud y signo opuesto (+q, −q) separadas por una distancia fija. Las líneas de campo emergen de la carga positiva y convergen en la negativa.',
    simpleExplanation:
      'Una pareja de carga positiva y negativa unidas. Es la estructura que explica cómo funciona el agua y las microondas.',
    everydayExample:
      'La molécula de agua (H₂O), cuyos dipolos giran con las ondas del microondas calentando la comida.',
    formula: 'p⃗ = q · d⃗  |  V(r, θ) ≈ (k · p · cos θ) / r²',
    mode: 'electrostatics',
    presetKey: 'dipole',
    category: 'electrostatics',
    tags: ['dipolo', 'momento dipolar', 'lineas de campo', 'polaridad', 'superficies equipotenciales'],
    badge: 'Dipolo'
  },
  {
    id: 'repulsion',
    unitNumber: 1,
    unitName: 'Unidad 1',
    title: 'Repulsión de Cargas Homólogas (+q, +q)',
    synopsis:
      'Distribución de dos cargas del mismo signo. Las líneas de campo divergen lateralmente originando un punto de campo nulo (E = 0) en el punto equidistante intermedio.',
    simpleExplanation:
      'Dos cargas iguales empujan en sentidos contrarios, cancelándose en el punto exacto del medio donde el campo vale cero.',
    everydayExample:
      'Cuando dos imanes con el mismo polo norte se empujan y sientes un "colchón invisible" en medio.',
    formula: 'E_centro = E₁ - E₂ = 0  (si q₁ = q₂)',
    mode: 'electrostatics',
    presetKey: 'repulsion',
    category: 'electrostatics',
    tags: ['repulsion', 'cargas iguales', 'punto neutro', 'lineas divergentes'],
    badge: 'Repulsión'
  },
  {
    id: 'quadrupole',
    unitNumber: 1,
    unitName: 'Unidad 1',
    title: 'Cuadrupolo Eléctrico Planar',
    synopsis:
      'Configuración de cuatro cargas alternadas con carga neta cero y momento dipolar nulo. Su potencial electrostático decae rápidamente como 1/r³.',
    simpleExplanation:
      'Cuatro cargas balanceadas que anulan el campo a larga distancia, usado en trampas iónicas y espectrómetros de masas.',
    everydayExample:
      'Trampas de cuadrupolo en aceleradores que confinan iones sin que toquen las paredes.',
    formula: 'V_cuadrupolo(r) ∝ 1 / r³',
    mode: 'electrostatics',
    presetKey: 'quadrupole',
    category: 'electrostatics',
    tags: ['cuadrupolo', 'multipolar', 'momento cuadrupolar', 'distribucion de carga'],
    badge: 'Cuadrupolo'
  },
  {
    id: 'gauss',
    unitNumber: 2,
    unitName: 'Unidad 2',
    title: 'Ley de Gauss & Flujo Eléctrico',
    synopsis:
      'El flujo eléctrico neto a través de una superficie gaussiana cerrada es igual a la carga neta encerrada dividida por la permitividad del vacío ε₀.',
    simpleExplanation:
      'Solo las cargas dentro de la burbuja cerrada cuentan para el flujo total. Lo que esté afuera entra y sale sin aportar nada.',
    everydayExample:
      'Contar cuántas personas entran a un vagón de tren cerrado comparando las puertas de entrada y salida.',
    formula: 'Φ_E = ∮ E⃗ · dA⃗ = Q_enc / ε₀',
    mode: 'gauss',
    presetKey: 'monopole',
    category: 'gauss',
    tags: ['gauss', 'flujo electrico', 'superficie cerrada', 'carga encerrada', 'teorema divergencia'],
    badge: 'Gauss'
  },
  {
    id: 'equipotentials',
    unitNumber: 2,
    unitName: 'Unidad 2',
    title: 'Superficies Equipotenciales & Gradiente de Potencial',
    synopsis:
      'Lugares geométricos donde el potencial V es constante. El vector campo eléctrico E es siempre perpendicular a las equipotenciales (E = −∇V).',
    simpleExplanation:
      'Son como las curvas de nivel de un mapa de montaña: caminar por la curva no cuesta trabajo; bajar en perpendicular es donde más rápido caes.',
    everydayExample:
      'Curvas de altitud topográficas donde el agua fluye montaña abajo perpendicular a las líneas de igual altura.',
    formula: 'E⃗ = - ∇V  |  W = - q · ΔV = 0  (a lo largo de la curva)',
    mode: 'electrostatics',
    presetKey: 'dipole',
    category: 'electrostatics',
    tags: ['equipotenciales', 'potencial', 'gradiente', 'voltaje', 'ortogonalidad'],
    badge: 'Potencial'
  },
  {
    id: 'capacitor',
    unitNumber: 3,
    unitName: 'Unidad 3',
    title: 'Condensador de Placas Paralelas & Campo Uniforme',
    synopsis:
      'Dos armaduras conductoras planas separadas por un dieléctrico. Entre las placas el campo eléctrico es uniforme: E = σ/ε₀, con capacitancia C = ε₀A/d.',
    simpleExplanation:
      'Dos láminas de metal frente a frente que acumulan carga eléctrica como una represa de energía.',
    everydayExample:
      'El almacenamiento de energía que alimenta el flash de tu teléfono inteligente.',
    formula: 'C = ε₀ · A / d  |  E = σ / ε₀  |  U = ½ C V²',
    mode: 'capacitor',
    presetKey: 'teflon',
    category: 'capacitor',
    tags: ['capacitor', 'capacitancia', 'condensador', 'placas paralelas', 'campo uniforme', 'energia'],
    badge: 'Capacitor'
  },
  {
    id: 'dielectrico',
    unitNumber: 3,
    unitName: 'Unidad 3',
    title: 'Dieléctricos, Polarización & Permitividad',
    synopsis:
      'Materiales aislantes cuyos dipolos microscópicos se orientan bajo un campo externo, reduciendo el campo neto y multiplicando la capacitancia por la constante κ.',
    simpleExplanation:
      'Un aislante colocado entre placas que se polariza internamente permitiendo acumular mucha más carga eléctrica.',
    everydayExample:
      'El teflón o la mica dentro de condensadores industriales para evitar chispazos y maximizar potencia.',
    formula: 'C = κ · C₀  |  E = E₀ / κ  |  P⃗ = ε₀ (κ - 1) E⃗',
    mode: 'capacitor',
    presetKey: 'glass',
    category: 'capacitor',
    tags: ['dielectrico', 'dieléctrico', 'polarizacion', 'permitividad relativa', 'susceptibilidad'],
    badge: 'Dieléctricos'
  },
  {
    id: 'lorentz',
    unitNumber: 5,
    unitName: 'Unidad 5',
    title: 'Fuerza de Lorentz & Dinámica 3D',
    synopsis:
      'Fuerza neta ejercida por campos eléctricos y magnéticos sobre una partícula en movimiento: F = q(E + v × B). La fuerza magnética no realiza trabajo.',
    simpleExplanation:
      'La fuerza que desvía a cualquier electrón o ion que viaje en un campo magnético, formando trayectorias curvas.',
    everydayExample:
      'El cinturón de radiación de Van Allen que desvía las partículas letales del espacio antes de llegar a nosotros.',
    formula: 'F⃗ = q · (E⃗ + v⃗ × B⃗)  |  r_L = m v_⊥ / (|q| B)',
    mode: 'lorentz3d',
    presetKey: 'helix',
    category: 'lorentz3d',
    tags: ['lorentz', 'fuerza de lorentz', 'campo magnetico', 'helice', 'espiral', '3d', 'boris'],
    badge: 'Lorentz 3D'
  },
  {
    id: 'wien',
    unitNumber: 5,
    unitName: 'Unidad 5',
    title: 'Filtro de Wien (Selector de Velocidades)',
    synopsis:
      'Configuración con campos perpendiculares E y B cruzados. Únicamente las partículas cuya velocidad cumple exactamente v = E/B continúan en trayectoria rectilínea sin desviarse.',
    simpleExplanation:
      'Un túnel electromagnético donde solo pasan las partículas con una velocidad perfecta; todas las demás chocan contra los lados.',
    everydayExample:
      'La etapa de entrada de un espectrómetro de masas para analizar muestras biológicas o químicas.',
    formula: 'v_crit = E / B  |  qE = q v B  ⇒  F_neta = 0',
    mode: 'lorentz3d',
    presetKey: 'velocity_selector',
    category: 'lorentz3d',
    tags: ['wien', 'filtro de wien', 'selector de velocidades', 'campos cruzados', 'espectrometria'],
    badge: 'Filtro Wien'
  },
  {
    id: 'ciclotron',
    unitNumber: 5,
    unitName: 'Unidad 5',
    title: 'Acelerador Ciclotrón de Partículas',
    synopsis:
      'Acelerador circular donde el campo magnético constante dobla la trayectoria en espirales concéntricas con frecuencia independiente del radio orbital: f = qB/(2πm).',
    simpleExplanation:
      'Un tiovivo magnético que le da un empujón eléctrico a las partículas cada vez que dan media vuelta hasta que van casi a la velocidad de la luz.',
    everydayExample:
      'Los ciclotrones médicos en hospitales que producen isótopos radiactivos para escáneres PET oncológicos.',
    formula: 'f_c = |q| B / (2π · m)  |  ω = q B / m',
    mode: 'lorentz3d',
    presetKey: 'cyclotron',
    category: 'lorentz3d',
    tags: ['ciclotron', 'ciclotrón', 'acelerador', 'frecuencia de ciclotron', 'radio de larmor', 'resonancia'],
    badge: 'Ciclotrón'
  },
  {
    id: 'botella',
    unitNumber: 5,
    unitName: 'Unidad 5',
    title: 'Botella Magnética & Espejo Magnético',
    synopsis:
      'Estructura con campos magnéticos más intensos en los extremos que en el centro. El gradiente genera una fuerza paralela que frena y refleja las cargas, confinándolas.',
    formula: 'F_z = - μ · (∂B_z / ∂z)  |  μ = ½ m v_⊥² / B = cte',
    mode: 'lorentz3d',
    presetKey: 'magnetic_bottle',
    category: 'lorentz3d',
    tags: ['botella magnetica', 'espejo magnetico', 'confinamiento', 'plasma', 'van allen', 'tokamak'],
    badge: 'Botella B'
  },
  {
    id: 'drift',
    unitNumber: 5,
    unitName: 'Unidad 5',
    title: 'Deriva E × B en Plasmas (Drift Velocity)',
    synopsis:
      'En presencia simultánea de campos E y B perpendiculares, las partículas describen cicloides y adquieren una velocidad de deriva neta perpendicular a ambos vectores.',
    formula: 'v⃗_d = (E⃗ × B⃗) / B²',
    mode: 'lorentz3d',
    presetKey: 'drift',
    category: 'lorentz3d',
    tags: ['deriva', 'drift', 'cicloide', 'e x b', 'plasma', 'velocidad de deriva'],
    badge: 'Deriva E×B'
  },
  {
    id: 'biotsavart',
    unitNumber: 6,
    unitName: 'Unidad 6',
    title: 'Ley de Biot-Savart & Campo Magnético',
    synopsis:
      'Cálculo del campo magnético dB originado por elementos diferenciales de corriente Idl. Para un conductor rectilíneo largo produce líneas concéntricas circulares.',
    formula: 'B = (μ₀ · I) / (2π · r)  |  dB⃗ = (μ₀ / 4π) · (I dl⃗ × r̂) / r²',
    mode: 'magnetostatics',
    presetKey: 'parallel_attraction',
    category: 'magnetostatics',
    tags: ['biot-savart', 'biotsavart', 'campo magnetico', 'corriente rectilinea', 'induccion'],
    badge: 'Biot-Savart'
  },
  {
    id: 'ampere',
    unitNumber: 6,
    unitName: 'Unidad 6',
    title: 'Ley de Ampère & Conductores Paralelos',
    synopsis:
      'Circulación del campo magnético a lo largo de un lazo cerrado proporcional a la corriente neta enlazada. Dos conductores con corrientes paralelas se atraen mutuamente.',
    formula: '∮ B⃗ · dl⃗ = μ₀ · I_enc  |  F/L = (μ₀ · I₁ · I₂) / (2π · d)',
    mode: 'magnetostatics',
    presetKey: 'parallel_attraction',
    category: 'magnetostatics',
    tags: ['ampere', 'ampère', 'circulacion', 'fuerza entre conductores', 'corrientes paralelas'],
    badge: 'Ampère'
  },
  {
    id: 'solenoide',
    unitNumber: 6,
    unitName: 'Unidad 6',
    title: 'Solenoide Ideal & Bobinas Cilíndricas',
    synopsis:
      'Bobinado helicoidal de múltiples espiras por el que circula corriente. Genera un campo magnético cuasi-uniforme e intenso en su interior y casi nulo en el exterior.',
    formula: 'B_interior = μ₀ · n · I  (n = N / L)',
    mode: 'magnetostatics',
    presetKey: 'solenoid',
    category: 'magnetostatics',
    tags: ['solenoide', 'bobina', 'espiras', 'campo uniforme', 'ampere', 'inductor'],
    badge: 'Solenoide'
  },
  {
    id: 'faraday',
    unitNumber: 7,
    unitName: 'Unidad 7',
    title: 'Ley de Faraday-Lenz & Inducción Electromagnética',
    synopsis:
      'Una variación en el flujo magnético en el tiempo genera una fuerza electromotriz inducida. El signo negativo (Lenz) refleja la oposición a la variación del flujo.',
    formula: 'ε = - N · (dΦ_B / dt)  |  Φ_B = ∬ B⃗ · dA⃗',
    mode: 'faraday',
    presetKey: 'faraday',
    category: 'faraday',
    tags: ['faraday', 'lenz', 'induccion', 'fem inducida', 'flujo magnetico', 'corrientes eddy', 'bobina', 'espiras'],
    badge: 'Faraday-Lenz'
  },
  {
    id: 'maxwell',
    unitNumber: 8,
    unitName: 'Unidad 8',
    title: 'Ecuaciones de Maxwell & Síntesis Electromagnética',
    synopsis:
      'Las 4 leyes unificadas que rigen todos los fenómenos eléctricos, magnéticos y ópticos. Predicen ondas electromagnéticas propagándose a la velocidad de la luz c = 1/√(ε₀μ₀).',
    formula: '∇·E = ρ/ε₀  |  ∇·B = 0  |  ∇×E = -∂B/∂t  |  ∇×B = μ₀J + μ₀ε₀∂E/∂t',
    mode: 'theory',
    presetKey: 'maxwell',
    category: 'theory',
    tags: ['maxwell', 'ecuaciones de maxwell', 'ondas electromagneticas', 'corriente desplazamiento', 'optica'],
    badge: 'Maxwell'
  }
];

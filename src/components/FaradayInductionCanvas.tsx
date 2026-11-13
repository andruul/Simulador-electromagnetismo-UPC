import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import type { Vector2D } from '../types';
import {
  calculateCoilFlux,
  computeFaradayInduction,
  getMagnetPoles,
  traceMagneticFieldLine,
  type BarMagnet,
  type InductionCoil
} from '../physics/faraday';
import {
  Zap,
  Repeat,
  ArrowRightLeft,
  Info
} from 'lucide-react';

export const FaradayInductionCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [dimensions, setDimensions] = useState({ width: 900, height: 650 });

  // Scale: 1 meter = 800 pixels (so 100 px = 0.125 m)
  const PIXELS_PER_METER = 750;

  // Bar Magnet State (meters)
  const [magnet, setMagnet] = useState<BarMagnet>({
    x: -0.22,      // center in meters
    y: 0,
    length: 0.18,  // 18 cm
    width: 0.05,   // 5 cm
    angle: 0,      // radians (0 = North to right, South to left)
    poleStrength: 1800 // A·m
  });

  // Induction Coil State (meters)
  const [coilTurns, setCoilTurns] = useState<number>(3); // 1 to 4 turns
  const [coilRadius] = useState<number>(0.07); // 7 cm

  // Magnet Motion & Dynamics
  const [isOscillating, setIsOscillating] = useState<boolean>(false);
  const [oscillationFreq] = useState<number>(1.2); // Hz
  const [oscillationAmp] = useState<number>(0.22); // meters

  // Output Device Mode: Galvanometer or Lightbulb or Both
  const [outputDevice, setOutputDevice] = useState<'both' | 'galvanometer' | 'lightbulb'>('both');

  // Dragging state
  const [isDraggingMagnet, setIsDraggingMagnet] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<Vector2D>({ x: 0, y: 0 });

  // Physics dynamic tracking state
  const prevFluxRef = useRef<number>(0);
  const prevTimeRef = useRef<number>(performance.now());
  const smoothedNeedleRef = useRef<number>(0);
  const animTimeRef = useRef<number>(0);

  // Time-series history for mini oscilloscope strip
  const historyRef = useRef<{ time: number; flux: number; emf: number }[]>([]);

  // Coil definition
  const coil: InductionCoil = useMemo(() => ({
    x: 0.08, // coil center 8 cm to the right of origin
    y: 0,
    radius: coilRadius,
    turns: coilTurns,
    resistancePerTurn: 0.8,
    normal: { x: 1, y: 0 }
  }), [coilRadius, coilTurns]);

  // Coordinate transforms
  const originX = dimensions.width / 2;
  const originY = dimensions.height / 2;

  const toPx = useCallback((mx: number, my: number) => ({
    px: originX + mx * PIXELS_PER_METER,
    py: originY + my * PIXELS_PER_METER
  }), [originX, originY, PIXELS_PER_METER]);

  const toMeters = useCallback((px: number, py: number) => ({
    mx: (px - originX) / PIXELS_PER_METER,
    my: (py - originY) / PIXELS_PER_METER
  }), [originX, originY, PIXELS_PER_METER]);

  // Update canvas dimensions on container resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width: Math.floor(width), height: Math.floor(height) });
        }
      }
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Flip magnet poles
  const flipPoles = () => {
    setMagnet((m) => ({
      ...m,
      angle: m.angle + Math.PI
    }));
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const mPos = toMeters(mx, my);

    // Check if clicked inside bar magnet
    const { px, py } = toPx(magnet.x, magnet.y);
    const magWpx = magnet.length * PIXELS_PER_METER;
    const magHpx = magnet.width * PIXELS_PER_METER;

    if (
      Math.abs(mx - px) < magWpx / 2 + 10 &&
      Math.abs(my - py) < magHpx / 2 + 10
    ) {
      setIsDraggingMagnet(true);
      setIsOscillating(false); // dragging pauses oscillation
      setDragOffset({ x: mPos.mx - magnet.x, y: mPos.my - magnet.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingMagnet) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const mPos = toMeters(mx, my);

    setMagnet((m) => ({
      ...m,
      x: mPos.mx - dragOffset.x,
      y: mPos.my - dragOffset.y
    }));
  };

  const handleMouseUp = () => {
    setIsDraggingMagnet(false);
  };

  // State for HUD displays
  const [instantValues, setInstantValues] = useState({
    flux: 0,
    dFluxDt: 0,
    emf: 0,
    current: 0,
    bulbPower: 0,
    bulbBrightness: 0
  });

  // ==========================================
  // Main Animation & Physics Loop
  // ==========================================
  useEffect(() => {
    let animId: number;

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.002, (now - prevTimeRef.current) / 1000));
      prevTimeRef.current = now;
      animTimeRef.current += dt;

      // Handle auto harmonic oscillation if enabled
      let curMagnet = { ...magnet };
      if (isOscillating) {
        const omega = 2 * Math.PI * oscillationFreq;
        const newX = coil.x - 0.05 + oscillationAmp * Math.sin(omega * animTimeRef.current);
        curMagnet.x = newX;
        setMagnet(curMagnet);
      }

      // 1. Calculate magnetic flux through the coil
      const flux = calculateCoilFlux(coil, curMagnet, 32);

      // 2. Compute induction & EMF via Faraday's Law
      const induction = computeFaradayInduction(
        flux,
        prevFluxRef.current,
        dt,
        coil,
        10
      );
      prevFluxRef.current = flux;

      // 3. Smooth galvanometer needle physics (damped response)
      const targetNeedle = Math.max(-1, Math.min(1, induction.inducedEmf / 3.0));
      smoothedNeedleRef.current += (targetNeedle - smoothedNeedleRef.current) * Math.min(1, dt * 14);

      // 4. Update history for mini oscilloscope (rolling 120 points)
      historyRef.current.push({
        time: animTimeRef.current,
        flux: flux * 1000, // milli-Webers
        emf: induction.inducedEmf
      });
      if (historyRef.current.length > 120) {
        historyRef.current.shift();
      }

      setInstantValues({
        flux,
        dFluxDt: induction.dFluxDt,
        emf: induction.inducedEmf,
        current: induction.inducedCurrent,
        bulbPower: induction.bulbPower,
        bulbBrightness: induction.bulbBrightness
      });

      // ==========================================
      // Draw Frame
      // ==========================================
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = dimensions.width;
          const h = dimensions.height;
          canvas.width = w;
          canvas.height = h;

          // Background
          const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, Math.max(w, h));
          bgGrad.addColorStop(0, '#0c1222');
          bgGrad.addColorStop(1, '#05070f');
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, w, h);

          // Grid
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.lineWidth = 1;
          for (let x = 0; x < w; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
          }
          for (let y = 0; y < h; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
          }

          // ------------------------------------------
          // Draw Magnetic Dipole Field Lines
          // ------------------------------------------
          const { north } = getMagnetPoles(curMagnet);
          const numLinesPerPole = 16;
          const bounds = {
            minX: toMeters(0, 0).mx,
            maxX: toMeters(w, 0).mx,
            minY: toMeters(0, 0).my,
            maxY: toMeters(0, h).my
          };

          ctx.save();
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.lineWidth = 1.3;

          for (let i = 0; i < numLinesPerPole; i++) {
            const angle = (2 * Math.PI * i) / numLinesPerPole;
            const startDist = 0.012; // meters from pole center
            const startPos: Vector2D = {
              x: north.x + Math.cos(angle) * startDist,
              y: north.y + Math.sin(angle) * startDist
            };

            const linePts = traceMagneticFieldLine(
              startPos,
              curMagnet,
              0.007,
              120,
              bounds
            );

            if (linePts.length > 2) {
              ctx.beginPath();
              const firstPx = toPx(linePts[0].x, linePts[0].y);
              ctx.moveTo(firstPx.px, firstPx.py);

              for (let j = 1; j < linePts.length; j++) {
                const ptPx = toPx(linePts[j].x, linePts[j].y);
                ctx.lineTo(ptPx.px, ptPx.py);
              }
              ctx.stroke();

              // Draw directional arrow on the field line
              if (linePts.length > 15) {
                const midIdx = Math.floor(linePts.length / 2);
                const p1 = toPx(linePts[midIdx].x, linePts[midIdx].y);
                const p2 = toPx(linePts[midIdx + 1].x, linePts[midIdx + 1].y);
                const dirAngle = Math.atan2(p2.py - p1.py, p2.px - p1.px);

                ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
                ctx.beginPath();
                ctx.moveTo(p1.px, p1.py);
                ctx.lineTo(
                  p1.px - 6 * Math.cos(dirAngle - Math.PI / 6),
                  p1.py - 6 * Math.sin(dirAngle - Math.PI / 6)
                );
                ctx.lineTo(
                  p1.px - 6 * Math.cos(dirAngle + Math.PI / 6),
                  p1.py - 6 * Math.sin(dirAngle + Math.PI / 6)
                );
                ctx.closePath();
                ctx.fill();
              }
            }
          }
          ctx.restore();

          // ------------------------------------------
          // Draw Coil Windings & Copper Wire Geometry
          // ------------------------------------------
          const coilCenterPx = toPx(coil.x, coil.y);
          const coilRPx = coil.radius * PIXELS_PER_METER;
          const coilWidthPx = 40 + coil.turns * 18;

          // Coil core axis line
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
          ctx.lineWidth = 1;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.moveTo(coilCenterPx.px - coilWidthPx / 2 - 40, coilCenterPx.py);
          ctx.lineTo(coilCenterPx.px + coilWidthPx / 2 + 40, coilCenterPx.py);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw Individual Coil Loops
          const loopSpacing = coilWidthPx / (coil.turns + 1);
          for (let turn = 1; turn <= coil.turns; turn++) {
            const lx = coilCenterPx.px - coilWidthPx / 2 + turn * loopSpacing;

            // Copper 3D tube gradient
            const copperGrad = ctx.createLinearGradient(lx - 8, 0, lx + 8, 0);
            copperGrad.addColorStop(0, '#b45309');
            copperGrad.addColorStop(0.4, '#f59e0b');
            copperGrad.addColorStop(0.7, '#d97706');
            copperGrad.addColorStop(1, '#78350f');

            ctx.save();
            ctx.strokeStyle = copperGrad;
            ctx.lineWidth = 9;
            ctx.beginPath();
            ctx.ellipse(lx, coilCenterPx.py, 12, coilRPx, 0, 0, 2 * Math.PI);
            ctx.stroke();

            // Inner highlight
            ctx.strokeStyle = 'rgba(254, 243, 199, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(lx - 2, coilCenterPx.py, 10, coilRPx - 3, 0, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.restore();

            // Moving charge carriers along loops (Lenz current animation)
            if (Math.abs(induction.inducedCurrent) > 0.005) {
              const currentDir = Math.sign(induction.inducedCurrent);
              const speed = currentDir * animTimeRef.current * 4;
              const dotCount = 8;

              ctx.fillStyle = '#38bdf8';
              for (let d = 0; d < dotCount; d++) {
                const theta = (2 * Math.PI * d) / dotCount + speed;
                const dotX = lx + 12 * Math.cos(theta);
                const dotY = coilCenterPx.py + coilRPx * Math.sin(theta);

                ctx.beginPath();
                ctx.arc(dotX, dotY, 3, 0, 2 * Math.PI);
                ctx.fill();
              }
            }
          }

          // ------------------------------------------
          // Circuit Wires Connecting Coil to Devices
          // ------------------------------------------
          const topWireX = coilCenterPx.px - coilWidthPx / 2 + loopSpacing;
          const botWireX = coilCenterPx.px - coilWidthPx / 2 + coil.turns * loopSpacing;
          const deviceX = coilCenterPx.px + 180;
          const deviceY = coilCenterPx.py;

          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          // Top wire
          ctx.beginPath();
          ctx.moveTo(topWireX, coilCenterPx.py - coilRPx);
          ctx.lineTo(topWireX, coilCenterPx.py - coilRPx - 45);
          ctx.lineTo(deviceX - 50, coilCenterPx.py - coilRPx - 45);
          ctx.lineTo(deviceX - 50, deviceY - 30);
          ctx.stroke();

          // Bottom wire
          ctx.beginPath();
          ctx.moveTo(botWireX, coilCenterPx.py + coilRPx);
          ctx.lineTo(botWireX, coilCenterPx.py + coilRPx + 45);
          ctx.lineTo(deviceX - 50, coilCenterPx.py + coilRPx + 45);
          ctx.lineTo(deviceX - 50, deviceY + 30);
          ctx.stroke();

          // ------------------------------------------
          // Draw Bar Magnet (Realistic 3D look)
          // ------------------------------------------
          const magCenterPx = toPx(curMagnet.x, curMagnet.y);
          const magLenPx = curMagnet.length * PIXELS_PER_METER;
          const magWidPx = curMagnet.width * PIXELS_PER_METER;

          ctx.save();
          ctx.translate(magCenterPx.px, magCenterPx.py);
          ctx.rotate(curMagnet.angle);

          // Magnet Body Shadow
          ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
          ctx.shadowBlur = 18;
          ctx.shadowOffsetX = 4;
          ctx.shadowOffsetY = 6;

          // South Half (Blue, Left)
          const southGrad = ctx.createLinearGradient(-magLenPx / 2, -magWidPx / 2, -magLenPx / 2, magWidPx / 2);
          southGrad.addColorStop(0, '#2563eb');
          southGrad.addColorStop(0.5, '#3b82f6');
          southGrad.addColorStop(1, '#1d4ed8');
          ctx.fillStyle = southGrad;
          ctx.beginPath();
          ctx.roundRect(-magLenPx / 2, -magWidPx / 2, magLenPx / 2, magWidPx, [8, 0, 0, 8]);
          ctx.fill();

          // North Half (Red, Right)
          const northGrad = ctx.createLinearGradient(0, -magWidPx / 2, 0, magWidPx / 2);
          northGrad.addColorStop(0, '#dc2626');
          northGrad.addColorStop(0.5, '#ef4444');
          northGrad.addColorStop(1, '#b91c1c');
          ctx.fillStyle = northGrad;
          ctx.beginPath();
          ctx.roundRect(0, -magWidPx / 2, magLenPx / 2, magWidPx, [0, 8, 8, 0]);
          ctx.fill();

          // Reset Shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;

          // Border & Center Seam
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-magLenPx / 2, -magWidPx / 2, magLenPx, magWidPx);
          ctx.beginPath();
          ctx.moveTo(0, -magWidPx / 2);
          ctx.lineTo(0, magWidPx / 2);
          ctx.stroke();

          // Labels 'S' and 'N'
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 22px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('S', -magLenPx / 4, 0);
          ctx.fillText('N', magLenPx / 4, 0);
          ctx.restore();

          // ------------------------------------------
          // Draw Center-Zero Galvanometer Instrument
          // ------------------------------------------
          if (outputDevice === 'both' || outputDevice === 'galvanometer') {
            const galvX = deviceX + 60;
            const galvY = deviceY - 45;
            const galvR = 55;

            ctx.save();
            // Outer casing
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(galvX, galvY, galvR, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();

            // Dial Face
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.arc(galvX, galvY, galvR - 8, 0, 2 * Math.PI);
            ctx.fill();

            // Dial Arc and Tick Marks
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1.5;

            // Zero at top center (-π/2)
            for (let t = -4; t <= 4; t++) {
              const tickAngle = -Math.PI / 2 + (t / 4) * (Math.PI / 4);
              const innerR = t % 2 === 0 ? galvR - 22 : galvR - 17;
              const outerR = galvR - 12;

              ctx.beginPath();
              ctx.moveTo(galvX + innerR * Math.cos(tickAngle), galvY + innerR * Math.sin(tickAngle));
              ctx.lineTo(galvX + outerR * Math.cos(tickAngle), galvY + outerR * Math.sin(tickAngle));
              ctx.stroke();

              // Labels -V, 0, +V
              if (t === -4 || t === 0 || t === 4) {
                ctx.fillStyle = '#334155';
                ctx.font = 'bold 9px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const lblR = galvR - 28;
                const txt = t === 0 ? '0' : t < 0 ? '−' : '+';
                ctx.fillText(txt, galvX + lblR * Math.cos(tickAngle), galvY + lblR * Math.sin(tickAngle));
              }
            }

            // Galvanometer Brand / Symbol 'G'
            ctx.fillStyle = '#64748b';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('G', galvX, galvY + 16);

            // Needle with damped angle
            const needleAngle = -Math.PI / 2 + smoothedNeedleRef.current * (Math.PI / 4);
            const needleLen = galvR - 14;

            ctx.strokeStyle = '#ef4444'; // Red needle
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(galvX, galvY);
            ctx.lineTo(galvX + needleLen * Math.cos(needleAngle), galvY + needleLen * Math.sin(needleAngle));
            ctx.stroke();

            // Center pivot cap
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(galvX, galvY, 5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
          }

          // ------------------------------------------
          // Draw Realistic Lightbulb Instrument
          // ------------------------------------------
          if (outputDevice === 'both' || outputDevice === 'lightbulb') {
            const bulbX = deviceX + 60;
            const bulbY = deviceY + 70;
            const bBright = instantValues.bulbBrightness;

            ctx.save();
            // Radiating glow when active
            if (bBright > 0.05) {
              const glowGrad = ctx.createRadialGradient(bulbX, bulbY, 10, bulbX, bulbY, 70 * bBright + 20);
              glowGrad.addColorStop(0, `rgba(253, 224, 71, ${0.9 * bBright})`);
              glowGrad.addColorStop(0.5, `rgba(250, 204, 21, ${0.4 * bBright})`);
              glowGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
              ctx.fillStyle = glowGrad;
              ctx.beginPath();
              ctx.arc(bulbX, bulbY, 70 * bBright + 20, 0, 2 * Math.PI);
              ctx.fill();

              // Light Rays
              ctx.strokeStyle = `rgba(254, 240, 138, ${0.7 * bBright})`;
              ctx.lineWidth = 2;
              const rayCount = 10;
              for (let r = 0; r < rayCount; r++) {
                const rAngle = (2 * Math.PI * r) / rayCount;
                ctx.beginPath();
                ctx.moveTo(bulbX + 24 * Math.cos(rAngle), bulbY + 24 * Math.sin(rAngle));
                ctx.lineTo(bulbX + (28 + 20 * bBright) * Math.cos(rAngle), bulbY + (28 + 20 * bBright) * Math.sin(rAngle));
                ctx.stroke();
              }
            }

            // Glass bulb globe
            ctx.fillStyle = bBright > 0.1 ? `rgba(254, 240, 138, ${0.3 + 0.5 * bBright})` : 'rgba(148, 163, 184, 0.15)';
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(bulbX, bulbY, 20, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();

            // Filament (Tungsten coil)
            ctx.strokeStyle = bBright > 0.05 ? '#fef08a' : '#94a3b8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(bulbX - 6, bulbY + 8);
            ctx.lineTo(bulbX - 4, bulbY - 6);
            ctx.lineTo(bulbX, bulbY - 10);
            ctx.lineTo(bulbX + 4, bulbY - 6);
            ctx.lineTo(bulbX + 6, bulbY + 8);
            ctx.stroke();

            // Screw base
            ctx.fillStyle = '#64748b';
            ctx.fillRect(bulbX - 8, bulbY + 20, 16, 12);
            ctx.strokeStyle = '#475569';
            ctx.strokeRect(bulbX - 8, bulbY + 20, 16, 12);
            ctx.restore();
          }

          // ------------------------------------------
          // Draw Lenz's Law Induced Field Vector
          // ------------------------------------------
          if (Math.abs(instantValues.dFluxDt) > 0.001) {
            ctx.save();
            const opposingDir = -Math.sign(instantValues.dFluxDt);
            const arrowLen = Math.min(50, Math.max(16, Math.abs(instantValues.dFluxDt) * 600));

            ctx.strokeStyle = '#a855f7'; // Purple for B_ind
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(coilCenterPx.px, coilCenterPx.py);
            ctx.lineTo(coilCenterPx.px + opposingDir * arrowLen, coilCenterPx.py);
            ctx.stroke();

            // Arrow head
            const tipX = coilCenterPx.px + opposingDir * arrowLen;
            ctx.fillStyle = '#a855f7';
            ctx.beginPath();
            ctx.moveTo(tipX, coilCenterPx.py);
            ctx.lineTo(tipX - opposingDir * 8, coilCenterPx.py - 6);
            ctx.lineTo(tipX - opposingDir * 8, coilCenterPx.py + 6);
            ctx.closePath();
            ctx.fill();

            // Label
            ctx.font = 'bold 11px sans-serif';
            ctx.fillStyle = '#c084fc';
            ctx.textAlign = 'center';
            ctx.fillText('B_inducido (Lenz)', coilCenterPx.px, coilCenterPx.py + coilRPx + 22);
            ctx.restore();
          }

          // ------------------------------------------
          // Mini Rolling Oscilloscope Strip (Bottom Left)
          // ------------------------------------------
          const oscW = 260;
          const oscH = 75;
          const oscX = 16;
          const oscY = h - 90;

          ctx.save();
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(oscX, oscY, oscW, oscH, 8);
          ctx.fill();
          ctx.stroke();

          // Center line
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
          ctx.beginPath();
          ctx.moveTo(oscX, oscY + oscH / 2);
          ctx.lineTo(oscX + oscW, oscY + oscH / 2);
          ctx.stroke();

          // Plot EMF in amber/rose and Flux in cyan
          const pts = historyRef.current;
          if (pts.length > 2) {
            // Plot Flux
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let i = 0; i < pts.length; i++) {
              const px = oscX + (i / 120) * oscW;
              const py = oscY + oscH / 2 - pts[i].flux * 1.5;
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.stroke();

            // Plot EMF
            ctx.strokeStyle = '#fb7185';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            for (let i = 0; i < pts.length; i++) {
              const px = oscX + (i / 120) * oscW;
              const py = oscY + oscH / 2 - pts[i].emf * 15;
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.stroke();
          }

          // Oscilloscope legend
          ctx.font = '9px monospace';
          ctx.textAlign = 'left';
          ctx.fillStyle = '#38bdf8';
          ctx.fillText('— Flujo Φ_B', oscX + 8, oscY + 14);
          ctx.fillStyle = '#fb7185';
          ctx.fillText('— FEM ε (V)', oscX + 85, oscY + 14);
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [
    magnet,
    coil,
    coilTurns,
    coilRadius,
    isOscillating,
    oscillationFreq,
    oscillationAmp,
    outputDevice,
    dimensions,
    toPx,
    toMeters,
    originX,
    originY
  ]);

  return (
    <div ref={containerRef} className="w-full h-full relative flex flex-col bg-slate-950 select-none overflow-hidden">
      {/* Top HUD: Real-time Physical Readings */}
      <div className="absolute top-3 left-4 z-20 flex flex-wrap items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-700/70 shadow-2xl">
        <div className="flex items-center gap-2 border-r border-slate-700/80 pr-4">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold">
            ε
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide">LEY DE FARADAY & LENZ</div>
            <div className="text-[11px] font-mono text-purple-400">
              ε = −N (dΦ_B / dt) &nbsp;|&nbsp; P = I²·R
            </div>
          </div>
        </div>

        {/* Real-time Values Bar */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400">Flujo Φ_B: </span>
            <span className="text-sky-400 font-bold">{(instantValues.flux * 1000).toFixed(2)} mWb</span>
          </div>

          <div className="border-l border-slate-800 pl-3">
            <span className="text-slate-400">dΦ_B/dt: </span>
            <span className="text-indigo-300 font-bold">{instantValues.dFluxDt.toFixed(3)} Wb/s</span>
          </div>

          <div className="border-l border-slate-800 pl-3">
            <span className="text-slate-400">FEM Inducida ε: </span>
            <span className={`font-bold ${Math.abs(instantValues.emf) > 0.05 ? 'text-rose-400' : 'text-slate-300'}`}>
              {instantValues.emf.toFixed(3)} V
            </span>
          </div>

          <div className="border-l border-slate-800 pl-3">
            <span className="text-slate-400">Corriente I: </span>
            <span className="text-emerald-400 font-bold">{(instantValues.current * 1000).toFixed(1)} mA</span>
          </div>

          <div className="border-l border-slate-800 pl-3">
            <span className="text-slate-400">Potencia P: </span>
            <span className="text-amber-400 font-bold">{(instantValues.bulbPower * 1000).toFixed(1)} mW</span>
          </div>
        </div>
      </div>

      {/* Magnet & Animation Controls (Top Right) */}
      <div className="absolute top-3 right-4 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-slate-700/70 shadow-2xl">
        {/* Flip Poles Button */}
        <button
          onClick={flipPoles}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-all border border-slate-700"
          title="Invertir Polos N/S del Imán"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" />
          <span>Invertir Polos</span>
        </button>

        {/* Auto Oscillation Toggle */}
        <button
          onClick={() => setIsOscillating(!isOscillating)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            isOscillating
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30'
          }`}
        >
          <Repeat className={`w-3.5 h-3.5 ${isOscillating ? 'animate-spin' : ''}`} />
          <span>{isOscillating ? 'Detener Oscilación' : 'Oscilar Imán'}</span>
        </button>
      </div>

      {/* Bottom Controls Bar: Coil Turns & Output Device */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 bg-slate-900/95 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-700/70 shadow-2xl">
        {/* Turns Selector */}
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-slate-300">Espiras de la Bobina (N):</span>
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setCoilTurns(n)}
                className={`px-3 py-1 rounded cursor-pointer transition-all ${
                  coilTurns === n ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                N = {n}
              </button>
            ))}
          </div>
        </div>

        {/* Output Device Switcher */}
        <div className="flex items-center gap-2 border-l border-slate-800 pl-4 text-xs text-slate-300">
          <span className="text-[11px]">Carga Conectada:</span>
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setOutputDevice('both')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
                outputDevice === 'both' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400'
              }`}
            >
              Ambos
            </button>
            <button
              onClick={() => setOutputDevice('galvanometer')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
                outputDevice === 'galvanometer' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400'
              }`}
            >
              Galvanómetro
            </button>
            <button
              onClick={() => setOutputDevice('lightbulb')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
                outputDevice === 'lightbulb' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400'
              }`}
            >
              Bombilla
            </button>
          </div>
        </div>

        {/* Academic Guidance Note */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 border-l border-slate-800 pl-4">
          <Info className="w-4 h-4 text-sky-400 flex-shrink-0" />
          <span>
            Arrastre el imán manualmente a través de la bobina para experimentar la ley de Lenz en tiempo real.
          </span>
        </div>
      </div>

      {/* Canvas Viewport */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />
    </div>
  );
};
export default FaradayInductionCanvas;

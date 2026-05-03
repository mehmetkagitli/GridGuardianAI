// GridGuardian AI - Matter.js EV Şarj Alanı
import { useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';

const { Engine, Render, Runner, Bodies, Composite, Events } = Matter;

export default function PhysicsScene({ neighborhood, mode, vehicleCount = 0 }) {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const runnerRef = useRef(null);
  const vehiclesRef = useRef([]);
  const prevCountRef = useRef(vehicleCount);

  const getColor = useCallback(() => {
    if (mode === 'critical') return '#dc2626';
    if (mode === 'hybrid') return '#ea580c';
    return '#16a34a';
  }, [mode]);

  // vehicleCount değişince araç ekle/çıkar
  useEffect(() => {
    if (!engineRef.current) return;
    const w = containerRef.current?.clientWidth || 280;
    const diff = vehicleCount - prevCountRef.current;
    prevCountRef.current = vehicleCount;

    if (diff > 0) {
      // Yeni araç ekle
      for (let i = 0; i < diff; i++) {
        const x = 20 + Math.random() * (w - 40);
        const v = Bodies.rectangle(x, -10, 20, 11, {
          restitution: 0.3, friction: 0.5, frictionAir: 0.02,
          chamfer: { radius: 3 },
          render: { fillStyle: getColor(), strokeStyle: '#fff', lineWidth: 1 },
        });
        Composite.add(engineRef.current.world, v);
        vehiclesRef.current.push(v);
      }
    } else if (diff < 0) {
      // Araç çıkar
      for (let i = 0; i < Math.abs(diff); i++) {
        const old = vehiclesRef.current.pop();
        if (old) Composite.remove(engineRef.current.world, old);
      }
    }
  }, [vehicleCount, getColor]);

  // Engine kurulumu
  useEffect(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth;
    const h = 100;

    const engine = Engine.create({ gravity: { x: 0, y: 0.6 } });
    const render = Render.create({
      element: containerRef.current, engine,
      options: { width: w, height: h, wireframes: false, background: '#f9fafb', pixelRatio: window.devicePixelRatio || 1 },
    });

    const ground = Bodies.rectangle(w / 2, h + 5, w + 20, 10, { isStatic: true, render: { fillStyle: '#e5e7eb' } });
    const wallL = Bodies.rectangle(-5, h / 2, 10, h, { isStatic: true, render: { fillStyle: 'transparent' } });
    const wallR = Bodies.rectangle(w + 5, h / 2, 10, h, { isStatic: true, render: { fillStyle: 'transparent' } });

    // Şarj istasyonları
    const stationCount = neighborhood.stations || 2;
    const stationSpacing = w / (stationCount + 1);
    const stations = Array.from({ length: stationCount }, (_, i) => {
      const x = stationSpacing * (i + 1);
      return Bodies.rectangle(x, h - 14, 8, 22, {
        isStatic: true, chamfer: { radius: 2 },
        render: {
          fillStyle: mode === 'critical' ? '#fca5a5' : mode === 'hybrid' ? '#fde68a' : '#86efac',
          strokeStyle: mode === 'critical' ? '#dc2626' : mode === 'hybrid' ? '#ca8a04' : '#16a34a',
          lineWidth: 1.5,
        },
      });
    });

    // Başlangıç araçları
    const color = getColor();
    const initVehicles = Array.from({ length: vehicleCount }, (_, idx) => {
      const sx = stationSpacing * ((idx % stationCount) + 1);
      const x = sx + (Math.random() - 0.5) * 16;
      return Bodies.rectangle(x, 10 + Math.random() * 20, 20, 11, {
        restitution: 0.3, friction: 0.5, frictionAir: 0.02, chamfer: { radius: 3 },
        render: { fillStyle: color, strokeStyle: '#fff', lineWidth: 1 },
      });
    });
    vehiclesRef.current = [...initVehicles];
    prevCountRef.current = vehicleCount;

    Composite.add(engine.world, [ground, wallL, wallR, ...stations, ...initVehicles]);

    // Overlay çizimi
    Events.on(render, 'afterRender', () => {
      const ctx = render.context;
      stations.forEach((st) => {
        ctx.save();
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = mode === 'critical' ? '#dc2626' : mode === 'hybrid' ? '#ca8a04' : '#16a34a';
        ctx.fillText('⚡', st.position.x, st.position.y - 16);
        ctx.restore();
      });
      vehiclesRef.current.forEach((v) => {
        if (v.position.y > 0 && v.position.y < h) {
          ctx.save();
          ctx.font = 'bold 6px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#fff';
          ctx.fillText('EV', v.position.x, v.position.y + 3);
          ctx.restore();
        }
      });
    });

    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);
    engineRef.current = engine;
    renderRef.current = render;
    runnerRef.current = runner;

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      if (render.canvas) render.canvas.remove();
      render.textures = {};
      engineRef.current = null;
      renderRef.current = null;
      runnerRef.current = null;
      vehiclesRef.current = [];
    };
  }, [neighborhood.id, mode]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">EV Şarj Alanı</span>
        <span className="text-xs text-gray-400">{vehicleCount}/{neighborhood.stations} araç</span>
      </div>
      <div ref={containerRef} className="w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-50 physics-canvas" style={{ height: '100px' }} />
    </div>
  );
}

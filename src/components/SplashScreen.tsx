import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Orbit, ShieldCheck, Cpu, Terminal, Layers } from 'lucide-react';

interface Point3D {
  x: number;
  y: number;
  z: number;
  ox: number; 
  oy: number;
  oz: number;
  color: string;
}

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [bootStage, setBootStage] = useState('INTEGRITY_CHECK_OK');
  const [showMainElements, setShowMainElements] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const pointsRef = useRef<Point3D[]>([]);
  const ringsRef = useRef<{ angleX: number; angleY: number; radius: number; color: string }[]>([]);

  // 1. Boot progression with sophisticated staging
  useEffect(() => {
    setShowMainElements(true);
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 1;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 800);
          return 100;
        }

        // Cycle through highly sophisticated status logs
        if (next < 25) {
          setBootStage('ESTABLISHING_SECURE_NODE_TUNNELS');
        } else if (next < 50) {
          setBootStage('DECRYPTING_QUANTUM_LEAP_ASSETS');
        } else if (next < 75) {
          setBootStage('SYNCRONIZING_DECENTRALIZED_EXCHANGE_INDEX');
        } else if (next < 95) {
          setBootStage('INITIALIZING_NEURAL_TELEMETRY_GATES');
        } else {
          setBootStage('AETHER_CORE_SYSTEMS_OPERATIONAL');
        }

        return next;
      });
    }, 25);

    return () => clearInterval(interval);
  }, [onComplete]);

  // 2. Interactive mouse tracker
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      // Convert normal coordinates to -1 to +1 range
      mouseRef.current.tx = (e.clientX / innerWidth) * 2 - 1;
      mouseRef.current.ty = (e.clientY / innerHeight) * 2 - 1;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 3. Initialize and run 3D holographic wireframe canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    // Build geodesic spherical points
    const points: Point3D[] = [];
    const numPoints = 85;
    const r = Math.min(width, height) * 0.22; // Orbit sphere radius

    const colors = [
      'rgba(34, 211, 238, 0.85)', // Cyan-400
      'rgba(59, 130, 246, 0.85)', // Blue-500
      'rgba(99, 102, 241, 0.85)', // Indigo-500
    ];

    for (let i = 0; i < numPoints; i++) {
      // Golden spiral distribution for uniform spherical grid
      const theta = Math.acos(-1 + (2 * i) / numPoints);
      const phi = Math.sqrt(numPoints * Math.PI) * theta;

      const x = r * Math.sin(theta) * Math.cos(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(theta);

      points.push({
        x, y, z,
        ox: x, oy: y, oz: z,
        color: colors[i % colors.length]
      });
    }
    pointsRef.current = points;

    // Background 3D drifting quantum dust particles
    const ambientParticles: { x: number; y: number; z: number; size: number; speedZ: number; color: string }[] = [];
    for (let i = 0; i < 110; i++) {
      ambientParticles.push({
        x: (Math.random() - 0.5) * width * 1.8,
        y: (Math.random() - 0.5) * height * 1.8,
        z: Math.random() * 600 - 300,
        size: Math.random() * 1.5 + 0.4,
        speedZ: Math.random() * 0.35 + 0.1,
        color: i % 2 === 0 ? 'rgba(34, 211, 238, ' : 'rgba(99, 102, 241, '
      });
    }

    // Orbital planetary rings setup
    ringsRef.current = [
      { angleX: 0.5, angleY: 0.8, radius: r * 1.5, color: 'rgba(34, 211, 238, 0.15)' },
      { angleX: -0.6, angleY: -0.4, radius: r * 1.8, color: 'rgba(99, 102, 241, 0.12)' }
    ];

    let rotX = 0.004;
    let rotY = 0.005;
    let rotZ = 0.001;

    // Resize handler
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Elastic mouse smoothing
      mouseRef.current.x += (mouseRef.current.tx - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.ty - mouseRef.current.y) * 0.08;

      // Mouse interactive tilt angles
      const extraAngleY = mouseRef.current.x * 0.4;
      const extraAngleX = -mouseRef.current.y * 0.4;

      // Render floating quantum dust particles in depth before overlaying vectors
      ambientParticles.forEach(p => {
        p.z -= p.speedZ;
        if (p.z < -300) {
          p.z = 300;
          p.x = (Math.random() - 0.5) * width * 1.8;
          p.y = (Math.random() - 0.5) * height * 1.8;
        }

        // Apply mouse gravity warp factor
        const px = p.x + mouseRef.current.x * 45;
        const py = p.y + mouseRef.current.y * 45;

        const fov = 420;
        const perspective = fov / (fov + p.z);
        const sx = centerX + px * perspective;
        const sy = centerY + py * perspective;

        if (sx >= 0 && sx <= width && sy >= 0 && sy <= height) {
          const alpha = Math.max(0.04, Math.min(0.5, 0.35 - p.z / 600));
          ctx.fillStyle = p.color + `${alpha})`;
          ctx.beginPath();
          ctx.arc(sx, sy, p.size * perspective, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Base rotation speeds
      const finalRotX = rotX + extraAngleX * 0.01;
      const finalRotY = rotY + extraAngleY * 0.01;

      // Rotate and Project points
      const projected = pointsRef.current.map(p => {
        // Copy original coords
        let x = p.ox;
        let y = p.oy;
        let z = p.oz;

        // Apply automatic self rotations
        rotX += 0.00002;
        rotY += 0.00003;
        rotZ += 0.00001;

        // Combine base rotation + mouse tilts
        const angleX = rotX + extraAngleX;
        const angleY = rotY + extraAngleY;
        const angleZ = rotZ;

        // Rotate Y Axis
        let cosY = Math.cos(angleY), sinY = Math.sin(angleY);
        let x1 = x * cosY + z * sinY;
        let z1 = -x * sinY + z * cosY;

        // Rotate X Axis
        let cosX = Math.cos(angleX), sinX = Math.sin(angleX);
        let y2 = y * cosX - z1 * sinX;
        let z2 = y * sinX + z1 * cosX;

        // Rotate Z Axis
        let cosZ = Math.cos(angleZ), sinZ = Math.sin(angleZ);
        let x2 = x1 * cosZ - y2 * sinZ;
        let y3 = x1 * sinZ + y2 * cosZ;

        p.x = x2;
        p.y = y3;
        p.z = z2;

        // Perspective Projection calculation
        const fov = 420;
        const perspective = fov / (fov + z2);

        return {
          sx: centerX + x2 * perspective,
          sy: centerY + y2 * perspective,
          depth: z2,
          perspective,
          orig: p
        };
      });

      // Draw connecting wireframe plexus links (pulsating neon laser glow lines)
      ctx.lineWidth = 0.9;
      const connectionDist = r * 0.68;
      const pulseTime = Date.now() * 0.0015;

      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const pi = projected[i];
          const pj = projected[j];

          const dx = pi.orig.x - pj.orig.x;
          const dy = pi.orig.y - pj.orig.y;
          const dz = pi.orig.z - pj.orig.z;
          const dist = Math.hypot(dx, dy, dz);

          if (dist < connectionDist) {
            // Calculate line opacity based on depth, distance and real-time sinus frequencies
            const baseAlpha = 1 - dist / connectionDist;
            const avgDepth = (pi.depth + pj.depth) / (r * 2); // scaled density-depth
            const depthAlpha = Math.max(0.1, Math.min(1, 0.5 - avgDepth));
            const liveSine = Math.sin(pulseTime + i + j) * 0.22 + 0.78;
            const totalAlpha = baseAlpha * depthAlpha * 0.45 * liveSine;

            ctx.strokeStyle = `rgba(34, 211, 238, ${totalAlpha})`;
            ctx.beginPath();
            ctx.moveTo(pi.sx, pi.sy);
            ctx.lineTo(pj.sx, pj.sy);
            ctx.stroke();
          }
        }
      }

      // Render 3D planetary surrounding rings with soft orbital glows
      ringsRef.current.forEach((ring, index) => {
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = 1.6;
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(99, 102, 241, 0.35)';
        
        ctx.beginPath();

        // Trace virtual 3D tilted ellipse rings
        for (let deg = 0; deg <= 360; deg += 3) {
          const rad = (deg * Math.PI) / 180;
          let rx = ring.radius * Math.cos(rad);
          let ry = 0;
          let rz = ring.radius * Math.sin(rad);

          // Apply rotation
          const cosRX = Math.cos(ring.angleX), sinRX = Math.sin(ring.angleX);
          const cosRY = Math.cos(ring.angleY + rotY * (0.5 + index * 0.1)), sinRY = Math.sin(ring.angleY + rotY * (0.5 + index * 0.1));

          let rx1 = rx * cosRY + rz * sinRY;
          let rz1 = -rx * sinRY + rz * cosRY;
          let ry1 = ry * cosRX - rz1 * sinRX;
          let rz2 = ry * sinRX + rz1 * cosRX;

          const fov = 420;
          const perspective = fov / (fov + rz2);

          const sx = centerX + rx1 * perspective;
          const sy = centerY + ry1 * perspective;

          if (deg === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.stroke();
      });
      ctx.shadowBlur = 0; // Reset shadow

      // Draw projected nodes with incredible bioluminescent glowing aura
      projected.forEach(p => {
        const radius = Math.max(1.8, p.perspective * 3.8);
        const alpha = Math.max(0.2, Math.min(1.0, 0.7 - p.depth / r));

        // Create brilliant node blooms
        ctx.shadowBlur = p.perspective > 1.1 ? 16 : 6;
        ctx.shadowColor = p.orig.color;

        ctx.fillStyle = p.orig.color.replace('0.85', `${alpha}`);
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0; // Performance Reset

        // Glowing white center core for highly projected nodes
        if (p.perspective > 1.15) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.45})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, radius * 1.8, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // Subtle dynamic scanlines
      ctx.fillStyle = 'rgba(255,255,255,0.01)';
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1);
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <motion.div 
      exit={{ opacity: 0, scale: 1.08, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
      className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-6 overflow-hidden"
    >
      {/* Real-time 3D Interactive Canvas Backdrop */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-80 pointer-events-none"
      />

      {/* Cybernetic Grid Filter */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.1)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/80 pointer-events-none z-0" />

      <AnimatePresence>
        {showMainElements && (
          <div className="relative z-10 flex flex-col items-center justify-between h-full w-full max-w-lg py-12 pointer-events-none">
            
            {/* Header Telemetry */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.8 }}
              className="w-full flex justify-between items-center px-4"
            >
              <div className="flex items-center gap-2 font-mono text-[9px] text-cyan-400 font-bold uppercase tracking-[0.2em] bg-cyan-950/45 border border-cyan-500/20 px-3.5 py-1.5 rounded-full backdrop-blur-md">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping shrink-0" />
                <span>SECURE QUANTUM CHANNEL</span>
              </div>
              <div className="font-mono text-[9px] text-slate-500 font-semibold tracking-wider">
                NODE_SEC_V3.80 // ACTIVE
              </div>
            </motion.div>

            {/* Glowing 3D Orb Housing */}
            <div className="flex flex-col items-center gap-6 mt-12 mb-6">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 60, damping: 15 }}
                className="relative flex items-center justify-center"
              >
                {/* Visual anchor ring */}
                <div className="absolute w-28 h-28 border border-cyan-500/10 rounded-full animate-[ping_4s_infinite_linear]" />
                <div className="absolute w-44 h-44 border border-indigo-500/5 rounded-full" />
                
                <div className="w-20 h-20 bg-gradient-to-tr from-cyan-400 to-indigo-600 rounded-[28px] flex items-center justify-center shadow-3xl shadow-cyan-500/30 border border-white/20 relative z-10">
                  <Orbit className="w-10 h-10 text-slate-950 animate-[spin_24s_linear_infinite]" />
                </div>
              </motion.div>

              <div className="text-center space-y-2">
                <motion.h1 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl sm:text-5xl font-black tracking-[-0.04em] text-white"
                >
                  AETHER<span className="text-cyan-400">EX</span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 font-mono"
                >
                  DECENTRALIZED QUANTUM EXCHANGE
                </motion.p>
              </div>
            </div>

            {/* Futuristic Diagnostic HUD Progress Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="w-full px-6 space-y-4"
            >
              {/* Virtual Diagnostics Streams */}
              <div className="bg-slate-900/60 border border-slate-800/40 rounded-2xl p-4 font-mono text-[9px] text-slate-400 flex flex-col gap-2 backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 mb-1">
                  <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                    <Terminal className="w-3.5 h-3.5" /> SYSTEM BOOT DIAGNOSTIC
                  </span>
                  <span className="text-[8px] text-slate-500">REV. 2026.11A</span>
                </div>
                <div className="flex justify-between items-center class-diag-row">
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-cyan-400" /> AUTH KEY ENHANCEMENT</span>
                  <span className="text-emerald-405 font-bold">SECURED</span>
                </div>
                <div className="flex justify-between items-center class-diag-row">
                  <span className="flex items-center gap-1.5"><Cpu className="w-3 h-3 text-cyan-400" /> GPU PIPELINE BUFFER</span>
                  <span className="text-emerald-405 font-bold">STABLE (60 FPS)</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 text-[8px] italic truncate">
                  &gt; {bootStage}...
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest">
                  <span className="text-cyan-400">SYNC PROGRESS</span>
                  <span>{progress}%</span>
                </div>
                
                {/* Progressive Bar Outer Glow */}
                <div className="w-full h-2 bg-slate-900/80 rounded-full p-0.5 border border-white/5 relative overflow-hidden backdrop-blur-sm shadow-inner">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-600 rounded-full shadow-lg shadow-cyan-500/40 relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full animate-pulse" />
                  </motion.div>
                </div>
              </div>

              <div className="text-center text-[9px] font-semibold text-slate-500 uppercase tracking-[0.2em]">
                Version 2.8.0 • Powered by Secure Blockchain Ledgers
              </div>
            </motion.div>

          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

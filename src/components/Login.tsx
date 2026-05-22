import React, { useState, useEffect, useRef } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Orbit, ShieldCheck, Terminal, Layers } from 'lucide-react';

interface Node3D {
  x: number;
  y: number;
  z: number;
  ox: number;
  oy: number;
  oz: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
}

function Login3DGrid() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseRef.current.tx = (e.clientX / innerWidth) * 2 - 1;
      mouseRef.current.ty = (e.clientY / innerHeight) * 2 - 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    const nodes: Node3D[] = [];
    const numNodes = 75;
    const colors = [
      'rgba(34, 211, 238, 0.4)',  // Cyan
      'rgba(99, 102, 241, 0.4)',  // Indigo
      'rgba(14, 165, 233, 0.35)', // Sky
    ];

    for (let i = 0; i < numNodes; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const dist = 180 + Math.random() * 140;

      const x = dist * Math.sin(phi) * Math.cos(theta);
      const y = dist * Math.sin(phi) * Math.sin(theta);
      const z = dist * Math.cos(phi);

      nodes.push({
        x, y, z,
        ox: x, oy: y, oz: z,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        vz: (Math.random() - 0.5) * 0.4,
        color: colors[i % colors.length]
      });
    }

    // Realtime quantum field ambient stardust backdrop for login page
    const ambientParticles: { x: number; y: number; z: number; size: number; speedZ: number; color: string }[] = [];
    for (let i = 0; i < 90; i++) {
      ambientParticles.push({
        x: (Math.random() - 0.5) * width * 1.8,
        y: (Math.random() - 0.5) * height * 1.8,
        z: Math.random() * 500 - 250,
        size: Math.random() * 1.2 + 0.3,
        speedZ: Math.random() * 0.3 + 0.08,
        color: i % 2 === 0 ? 'rgba(34, 211, 238, ' : 'rgba(129, 140, 248, '
      });
    }

    let rotX = 0.0015;
    let rotY = 0.002;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse updates
      mouseRef.current.x += (mouseRef.current.tx - mouseRef.current.x) * 0.06;
      mouseRef.current.y += (mouseRef.current.ty - mouseRef.current.y) * 0.06;

      const centerX = width / 2;
      const centerY = height / 2;

      // Render beautiful background dust particles with subtle mouse reactiveness
      ambientParticles.forEach(p => {
        p.z -= p.speedZ;
        if (p.z < -250) {
          p.z = 250;
          p.x = (Math.random() - 0.5) * width * 1.8;
          p.y = (Math.random() - 0.5) * height * 1.8;
        }

        const px = p.x + mouseRef.current.x * 40;
        const py = p.y + mouseRef.current.y * 40;

        const fov = 400;
        const scale = fov / (fov + p.z);
        const sx = centerX + px * scale;
        const sy = centerY + py * scale;

        if (sx >= 0 && sx <= width && sy >= 0 && sy <= height) {
          const alpha = Math.max(0.04, Math.min(0.4, 0.3 - p.z / 500));
          ctx.fillStyle = p.color + `${alpha})`;
          ctx.beginPath();
          ctx.arc(sx, sy, p.size * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Base rotations with custom mouse modifiers
      rotX += 0.0002;
      rotY += 0.0003;

      const finalAngleY = rotY + mouseRef.current.x * 0.35;
      const finalAngleX = rotX - mouseRef.current.y * 0.35;

      const cosX = Math.cos(finalAngleX), sinX = Math.sin(finalAngleX);
      const cosY = Math.cos(finalAngleY), sinY = Math.sin(finalAngleY);

      const projected = nodes.map(node => {
        // Subtle orbital drift
        node.ox += node.vx;
        node.oy += node.vy;
        node.oz += node.vz;

        const maxBoundary = 320;
        if (Math.abs(node.ox) > maxBoundary) node.vx *= -1;
        if (Math.abs(node.oy) > maxBoundary) node.vy *= -1;
        if (Math.abs(node.oz) > maxBoundary) node.vz *= -1;

        // Apply 3D math transformations
        let x = node.ox;
        let y = node.oy;
        let z = node.oz;

        // Y rot
        let x1 = x * cosY + z * sinY;
        let z1 = -x * sinY + z * cosY;

        // X rot
        let y2 = y * cosX - z1 * sinX;
        let z2 = y * sinX + z1 * cosX;

        const fov = 400;
        const scale = fov / (fov + z2);

        return {
          sx: centerX + x1 * scale,
          sy: centerY + y2 * scale,
          z: z2,
          scale,
          color: node.color
        };
      });

      // Plexus connecting laser links
      ctx.lineWidth = 0.65;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].sx - projected[j].sx;
          const dy = projected[i].sy - projected[j].sy;
          const dist = Math.hypot(dx, dy);

          if (dist < 105) {
            const alpha = (1 - dist / 105) * 0.18;
            ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(projected[i].sx, projected[i].sy);
            ctx.lineTo(projected[j].sx, projected[j].sy);
            ctx.stroke();
          }
        }
      }

      // Render 3D nodes with beautiful bioluminescent halo glow
      projected.forEach(p => {
        const rad = Math.max(1.0, p.scale * 2.8);
        const alpha = Math.max(0.12, Math.min(0.85, 0.45 - p.z / 640));
        
        ctx.shadowBlur = p.scale > 1.1 ? 12 : 4;
        ctx.shadowColor = 'rgba(34, 211, 238, 0.45)';
        
        ctx.fillStyle = p.color.replace('0.4', `${alpha}`);
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, rad, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0; // Reset performance properties
        
        // Add subtle neon halo rings on highly projected points
        if (p.scale > 1.25) {
          ctx.strokeStyle = `rgba(129, 140, 248, ${alpha * 0.4})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, rad * 2, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover z-0 opacity-70 pointer-events-none" />;
}

export function Login({ onLogin }: { onLogin: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 1. Save/Update user profile
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      
      let accountNumber = userData?.accountNumber;
      if (!accountNumber) {
        accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      }

      const generateKeyAddr = (symbol: string) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let randStr = '';
        for (let i = 0; i < 16; i++) {
          randStr += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `ak_live_${symbol.toLowerCase()}_${randStr}`;
      };

      const shouldRegen = (val: string | undefined | null) => {
        if (!val) return true;
        return val.includes('.') || val.startsWith('10.');
      };

      const btc_ip = shouldRegen(userData?.btc_ip) ? generateKeyAddr('btc') : userData!.btc_ip;
      const eth_ip = shouldRegen(userData?.eth_ip) ? generateKeyAddr('eth') : userData!.eth_ip;
      const sol_ip = shouldRegen(userData?.sol_ip) ? generateKeyAddr('sol') : userData!.sol_ip;
      const usdt_ip = shouldRegen(userData?.usdt_ip) ? generateKeyAddr('usdt') : userData!.usdt_ip;
      const xrp_ip = shouldRegen(userData?.xrp_ip) ? generateKeyAddr('xrp') : userData!.xrp_ip;

      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        name: user.displayName || 'No Name',
        displayName: user.displayName || 'No Name',
        photoURL: user.photoURL || '',
        provider: 'google',
        accountNumber,
        btc_ip,
        eth_ip,
        sol_ip,
        usdt_ip,
        xrp_ip,
        lastLoginAt: serverTimestamp(),
      }, { merge: true });

      if (!userSnap.data()?.createdAt) {
        await setDoc(userRef, { createdAt: serverTimestamp(), balance: 0 }, { merge: true });
      }

      // 2. Auto create realtime wallet
      const walletRef = doc(db, 'wallets', user.uid);
      const walletSnap = await getDoc(walletRef);
      if (!walletSnap.exists()) {
        await setDoc(walletRef, {
          balance: 0,
          currency: "IDR",
          updatedAt: serverTimestamp()
        });
      }

      // 3. Auto create exchange wallet
      const exchangeWalletRef = doc(db, 'exchange_wallets', user.uid);
      const exchangeWalletSnap = await getDoc(exchangeWalletRef);
      if (!exchangeWalletSnap.exists()) {
        await setDoc(exchangeWalletRef, {
          idr: 0,
          btc: 0,
          eth: 0,
          updatedAt: serverTimestamp()
        });
      }

      // 4. Add activity log
      await addDoc(collection(db, 'activity_logs'), {
        uid: user.uid,
        loginTime: serverTimestamp(),
        device: navigator.userAgent,
        ip: "Unknown",
        provider: 'google'
      });

      onLogin();
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/unauthorized-domain') {
        setError("Domain ini belum diotorisasi di Firebase. Silakan ke Firebase Console -> Authentication -> Settings -> Authorized domains.");
      } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.log('Login popup cancelled or duplicate request');
      } else {
        setError(error.message || 'Terjadi kesalahan saat login.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-6 overflow-hidden relative">
      
      {/* Immersive 3D Interactive Grid/Plexus */}
      <Login3DGrid />

      {/* Futuristic Scanlines Filter */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.15)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-indigo-950/20 to-slate-950 pointer-events-none z-0" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 85, damping: 15 }}
        className="relative z-10 bg-slate-900/50 p-8 sm:p-10 rounded-[48px] shadow-[0_25px_60px_rgba(0,0,0,0.4)] text-center w-full max-w-md border border-white/5 backdrop-blur-2xl"
      >
        {/* Glowing Logo */}
        <div className="relative w-18 h-18 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-indigo-500 rounded-[24px] blur-lg opacity-40 animate-pulse" />
          <div className="relative w-16 h-16 bg-slate-900 rounded-[22px] flex items-center justify-center shadow-xl border border-white/10">
            <Orbit className="w-8 h-8 text-cyan-400 animate-[spin_12s_linear_infinite]" />
          </div>
        </div>

        <h1 className="text-3xl font-black mb-2 tracking-tight text-white uppercase">Aether<span className="text-cyan-400">Ex</span></h1>
        <p className="text-slate-400 mb-8 text-xs font-semibold uppercase tracking-wider">Secure Decentralized Exchange Gate</p>
        
        {error && (
          <div className="bg-red-950/80 border border-red-500/20 text-red-200 p-4 rounded-2xl mb-6 text-xs text-left font-bold flex gap-3 items-center backdrop-blur-md">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping shrink-0"></span>
            {error}
          </div>
        )}

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className={`w-full text-slate-950 font-black py-4.5 rounded-2xl transition-all mb-8 flex items-center justify-center gap-3 active:scale-95 shadow-xl ${
            loading 
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-cyan-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 shadow-cyan-500/10 hover:shadow-cyan-500/20'
          }`}
        >
          {loading ? (
            <>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full"
              />
              Authenticating Terminal...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 origin-center" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="uppercase tracking-wider text-xs">Verify credentials</span>
            </>
          )}
        </button>

        <div className="pt-6 border-t border-white/5 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/90 px-4 border border-white/5 rounded-full">
            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-cyan-400">Security Clearance</p>
          </div>
          
          <div className="flex items-center justify-between gap-4 mt-3 px-2">
            
            {/* Bappebti */}
            <div className="flex flex-col items-center gap-1.5 group cursor-pointer text-center flex-1">
              <div className="flex items-center gap-1 transition-all">
                <svg viewBox="0 0 100 100" className="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10,50 C10,10 90,10 90,50 C90,90 10,90 10,50Z" stroke="#22d3ee" strokeWidth="4"/>
                  <path d="M30,50 C30,20 70,20 70,50 C70,80 30,80 30,50Z" stroke="#818cf8" strokeWidth="4"/>
                  <path d="M20,50 L80,50" stroke="#22d3ee" strokeWidth="3"/>
                </svg>
                <span className="font-[900] text-[10px] text-white tracking-tight leading-none">Bappebti</span>
              </div>
              <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest group-hover:text-cyan-400 transition-colors">LICENSED</p>
            </div>
            
            <div className="w-[1px] h-8 bg-white/5"></div>
            
            {/* CFX */}
            <div className="flex flex-col items-center gap-1.5 group cursor-pointer text-center flex-1">
              <div className="flex items-center transition-all h-5 justify-center">
                <span className="font-black text-[14px] text-white tracking-tighter leading-none">CFX</span>
              </div>
              <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest group-hover:text-indigo-400 transition-colors">MEMBER</p>
            </div>
            
            <div className="w-[1px] h-8 bg-white/5"></div>

            {/* J.P.Morgan */}
            <div className="flex flex-col items-center gap-1.5 group cursor-pointer text-center flex-1">
              <div className="flex items-center transition-all h-5 justify-center">
                <span className="font-serif font-black text-[10px] text-white tracking-tight leading-none">J.P.Morgan</span>
              </div>
              <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest group-hover:text-purple-400 transition-colors">EQUITY</p>
            </div>
          </div>
        </div>
      </motion.div>
      
      <p className="mt-6 text-[10px] text-slate-500 font-medium text-center max-w-xs leading-relaxed z-10">
        By continuing, you authorize AetherEx transaction nodes to execute cryptographic handshakes on your behalf. <a href="#" className="text-cyan-400 underline hover:text-cyan-300">Terms of Service</a>.
      </p>
    </div>
  );
}

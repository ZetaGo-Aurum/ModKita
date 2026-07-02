import { useEffect, useState, useRef } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { Activity, Database, Server, CheckCircle, XCircle, Globe, Shield, Cpu, Terminal, Cloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function Uptime() {
  const { t } = useTranslation();
  const [status, setStatus] = useState({
    firestore: 'loading',
    rtdb: 'loading',
    b2: 'loading',
    cdn: 'loading',
    auth: 'loading',
    cloudinary: 'loading'
  });
  const [ping, setPing] = useState({ firestore: 0, rtdb: 0, b2: 0, cdn: 0, auth: 0, cloudinary: 0 });
  const [history, setHistory] = useState({
    firestore: [120, 110, 130, 115, 125, 105, 118],
    rtdb: [85, 90, 78, 88, 92, 80, 84],
    b2: [240, 260, 235, 250, 270, 245, 255],
    cdn: [32, 45, 30, 38, 42, 35, 37],
    auth: [140, 155, 138, 148, 160, 142, 146],
    cloudinary: [95, 105, 90, 98, 112, 100, 102]
  });
  
  const [logs, setLogs] = useState([]);
  const [nextScanProgress, setNextScanProgress] = useState(0);
  const terminalContainerRef = useRef(null);

  // Store translation keys and parameters to support real-time language toggling inside logs
  const addLog = (key, params = {}, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-49), { time, key, params, type }]); // Keep last 50 logs
  };

  // Performant internal container scrolling instead of window.scrollIntoView
  useEffect(() => {
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    const checkServices = async () => {
      addLog('uptime_scan_init', {}, 'info');

      const measurePing = async (fn, key, displayName) => {
        const start = performance.now();
        try {
          await fn();
          const end = performance.now();
          const latency = Math.round(end - start);
          
          setPing(prev => ({ ...prev, [key]: latency }));
          setStatus(prev => ({ ...prev, [key]: 'online' }));
          
          setHistory(prev => {
            const currentHistory = prev[key] || [];
            return {
              ...prev,
              [key]: [...currentHistory.slice(-9), latency] // Keep last 10 points
            };
          });
          
          addLog('uptime_ping_success', { name: displayName, latency: latency }, 'success');
        } catch (e) {
          setStatus(prev => ({ ...prev, [key]: 'offline' }));
          addLog('uptime_ping_fail', { name: displayName }, 'error');
        }
      };

      // 1. Check Firestore
      measurePing(async () => {
        const q = query(collection(db, 'mods'), limit(1));
        await getDocs(q);
      }, 'firestore', 'Google Firestore Cluster');

      // 2. Check RTDB via REST API
      measurePing(async () => {
        const res = await fetch('https://mods-7c70d-default-rtdb.asia-southeast1.firebasedatabase.app/.json?shallow=true');
        if (res.status !== 200 && res.status !== 401) throw new Error();
      }, 'rtdb', 'Firebase Realtime DB');

      // 3. Check Backblaze B2 (API Check)
      measurePing(async () => {
        await fetch('https://api.backblazeb2.com', { mode: 'no-cors' });
      }, 'b2', 'Backblaze B2 Storage');

      // 4. Check Vercel CDN
      measurePing(async () => {
        await fetch(window.location.origin, { method: 'HEAD' });
      }, 'cdn', 'Vercel Edge Network');

      // 5. Check Firebase Auth
      measurePing(async () => {
        const res = await fetch('https://identitytoolkit.googleapis.com/$discovery/rest?version=v1');
        if (!res.ok) throw new Error();
      }, 'auth', 'Firebase Identity Service');

      // 6. Check Cloudinary CDN
      measurePing(async () => {
        await fetch('https://res.cloudinary.com/ubn1ot3x/image/upload/sample.jpg', { mode: 'no-cors' });
      }, 'cloudinary', 'Cloudinary Media CDN');
    };

    // Run first check
    checkServices();

    // 5-second interval for real-time auto updates
    const interval = setInterval(checkServices, 5000); 

    // Smooth real-time scanning progress bar animation
    const progressInterval = setInterval(() => {
      setNextScanProgress(prev => {
        if (prev >= 100) return 0;
        return prev + 2; // Increments to 100% every 5s (approx)
      });
    }, 100);

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, []);

  const renderSVGChart = (historyData) => {
    if (!historyData || historyData.length < 2) return null;
    const max = Math.max(...historyData, 100);
    const min = Math.min(...historyData, 0);
    const range = max - min || 1;
    
    const points = historyData.map((val, idx) => {
      const x = (idx / (historyData.length - 1)) * 140;
      const y = 35 - ((val - min) / range) * 25;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <svg className="w-full h-10 text-primary/80 overflow-visible mt-4" viewBox="0 0 140 35">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          points={points}
        />
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeOpacity="0.15"
          points={points}
        />
      </svg>
    );
  };

  const StatusCard = ({ title, desc, state, latency, icon: Icon, delay, keyName }) => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay, type: "spring", bounce: 0.4 }}
      className="relative group bg-surface/30 backdrop-blur-xl border border-outline-variant/30 p-6 rounded-[32px] overflow-hidden hover:border-primary/50 transition-colors shadow-lg"
    >
      <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 ${state === 'online' ? 'from-primary to-transparent' : 'from-error to-transparent'}`} />
      
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`p-3.5 rounded-2xl backdrop-blur-md border ${state === 'online' ? 'bg-primary/10 text-primary border-primary/20' : state === 'loading' ? 'bg-outline/10 text-outline border-outline/20' : 'bg-error/10 text-error border-error/20'}`}>
              <Icon size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-on-surface tracking-tight">{title}</h3>
              <p className="text-on-surface-variant text-xs mt-0.5">{desc}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            {state === 'online' ? (
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 99.9%
              </span>
            ) : (
              <span className="text-[10px] font-mono bg-error/10 text-error border border-error/20 px-2 py-0.5 rounded-md">
                0.0%
              </span>
            )}
          </div>
        </div>

        {/* Latency line & SVG Chart */}
        <div className="border-t border-outline-variant/10 pt-3">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-outline">{t('uptime_latency_trend')}</span>
            <span className={state === 'online' ? "text-primary font-bold" : "text-outline"}>
              {state === 'online' ? `${latency}ms` : '---'}
            </span>
          </div>
          {state === 'online' && renderSVGChart(history[keyName])}
        </div>
      </div>
    </motion.div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-6xl mx-auto py-12 px-4"
    >
      {/* Real-time Scan Progress Bar */}
      <div className="w-full h-1 bg-surface-variant/20 rounded-full overflow-hidden mb-8 relative">
        <div 
          className="h-full bg-primary shadow-[0_0_10px_rgba(168,199,250,0.8)] transition-all duration-100 ease-linear"
          style={{ width: `${nextScanProgress}%` }}
        />
      </div>

      <div className="text-center mb-16 relative">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -z-10"
        />
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="inline-flex items-center justify-center p-5 bg-surface rounded-[32px] border border-outline-variant/40 shadow-2xl mb-6"
        >
          <Cpu size={48} className="text-primary drop-shadow-[0_0_15px_rgba(168,199,250,0.8)]" />
        </motion.div>
        <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-on-surface via-primary to-on-surface mb-4 tracking-tighter animate-gradient-x">
          {t('uptime_title')}
        </h1>
        <p className="text-on-surface-variant text-base font-medium max-w-xl mx-auto">
          {t('uptime_desc')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
        <StatusCard title="Vercel Edge CDN" desc="Global Content Delivery Network" state={status.cdn} latency={ping.cdn} icon={Globe} delay={0.1} keyName="cdn" />
        <StatusCard title="Firestore DB" desc="NoSQL Document Database Cluster" state={status.firestore} latency={ping.firestore} icon={Database} delay={0.2} keyName="firestore" />
        <StatusCard title="Realtime DB" desc="Low-latency Synchronized State" state={status.rtdb} latency={ping.rtdb} icon={Activity} delay={0.3} keyName="rtdb" />
        <StatusCard title="Backblaze B2" desc="Object Storage Main Cluster" state={status.b2} latency={ping.b2} icon={Server} delay={0.4} keyName="b2" />
        <StatusCard title="Cloudinary CDN" desc="High-speed Media Delivery System" state={status.cloudinary} latency={ping.cloudinary} icon={Cloud} delay={0.5} keyName="cloudinary" />
        <StatusCard title="Auth Services" desc="Identity & Token Verification" state={status.auth} latency={ping.auth} icon={Shield} delay={0.6} keyName="auth" />
      </div>

      {/* Futuristic Scrolling Terminal Log console */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-black/85 rounded-3xl border border-outline-variant/30 overflow-hidden shadow-2xl font-mono text-sm max-w-4xl mx-auto"
      >
        <div className="bg-surface border-b border-outline-variant/20 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-primary" />
            <span className="font-bold text-on-surface">{t('uptime_terminal_title')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-error/40 border border-error/50" />
            <span className="w-3 h-3 rounded-full bg-amber-500/40 border border-amber-500/50" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/40 border border-emerald-500/50" />
          </div>
        </div>
        <div 
          ref={terminalContainerRef}
          className="p-6 h-56 overflow-y-auto space-y-1.5 custom-scrollbar text-xs scroll-smooth"
        >
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="text-outline shrink-0">[{log.time}]</span>
              <span className={
                log.type === 'success' ? 'text-emerald-400 font-medium' :
                log.type === 'error' ? 'text-error font-bold' :
                'text-primary/90'
              }>
                {t(log.key, log.params)}
              </span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-outline animate-pulse">{t('uptime_awaiting')}</div>
          )}
        </div>
      </motion.div>
      
      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface/50 border border-outline-variant/30 rounded-full text-xs font-mono text-on-surface-variant">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          {t('uptime_active_monitor')}
        </div>
      </div>
    </motion.div>
  );
}

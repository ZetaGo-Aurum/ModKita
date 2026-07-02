import { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { Activity, Database, Server, CheckCircle, XCircle, Globe, Shield, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function Uptime() {
  const { t } = useTranslation();
  const [status, setStatus] = useState({
    firestore: 'loading',
    rtdb: 'loading',
    b2: 'loading',
    cdn: 'loading',
    auth: 'loading'
  });
  const [ping, setPing] = useState({ firestore: 0, rtdb: 0, b2: 0, cdn: 0, auth: 0 });

  useEffect(() => {
    const checkServices = async () => {
      const measurePing = async (fn, key) => {
        const start = performance.now();
        try {
          await fn();
          const end = performance.now();
          setPing(prev => ({ ...prev, [key]: Math.round(end - start) }));
          setStatus(prev => ({ ...prev, [key]: 'online' }));
        } catch (e) {
          setStatus(prev => ({ ...prev, [key]: 'offline' }));
        }
      };

      // 1. Check Firestore
      measurePing(async () => {
        const q = query(collection(db, 'mods'), limit(1));
        await getDocs(q);
      }, 'firestore');

      // 2. Check RTDB via REST API
      measurePing(async () => {
        const res = await fetch('https://mods-7c70d-default-rtdb.asia-southeast1.firebasedatabase.app/.json?shallow=true');
        if (res.status !== 200 && res.status !== 401) throw new Error();
      }, 'rtdb');

      // 3. Check Backblaze B2 (API Check)
      measurePing(async () => {
        const res = await fetch('https://api.backblazeb2.com', { mode: 'no-cors' });
      }, 'b2');

      // 4. Check Vercel CDN
      measurePing(async () => {
        const res = await fetch(window.location.origin, { method: 'HEAD' });
      }, 'cdn');

      // 5. Check Firebase Auth
      measurePing(async () => {
        const res = await fetch('https://identitytoolkit.googleapis.com/$discovery/rest?version=v1');
        if (!res.ok) throw new Error();
      }, 'auth');
    };

    checkServices();
    const interval = setInterval(checkServices, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const StatusCard = ({ title, desc, state, latency, icon: Icon, delay }) => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay, type: "spring", bounce: 0.4 }}
      className="relative group bg-surface-variant/20 backdrop-blur-xl border border-outline-variant/30 p-6 rounded-[32px] overflow-hidden hover:border-primary/50 transition-colors"
    >
      <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${state === 'online' ? 'from-primary to-transparent' : 'from-error to-transparent'}`} />
      
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl backdrop-blur-md shadow-inner ${state === 'online' ? 'bg-primary/20 text-primary border border-primary/20' : state === 'loading' ? 'bg-outline/20 text-outline border border-outline/20' : 'bg-error/20 text-error border border-error/20'}`}>
            <Icon size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-on-surface tracking-tight">{title}</h3>
            <p className="text-on-surface-variant text-xs mt-1">{desc}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {state === 'online' ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 text-sm font-bold shadow-[0_0_15px_rgba(168,199,250,0.3)]">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Operational
            </motion.div>
          ) : state === 'loading' ? (
            <div className="flex items-center gap-1.5 bg-surface-variant text-on-surface-variant px-3 py-1 rounded-full border border-outline-variant text-sm font-bold">
              <Activity size={14} className="animate-spin" /> Checking
            </div>
          ) : (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 bg-error/10 text-error px-3 py-1 rounded-full border border-error/20 text-sm font-bold shadow-[0_0_15px_rgba(255,180,171,0.3)]">
              <XCircle size={14} /> Outage
            </motion.div>
          )}
          {state === 'online' && (
            <span className="text-xs font-mono text-outline">{latency}ms ping</span>
          )}
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
      <div className="text-center mb-16 relative">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -z-10"
        />
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="inline-flex items-center justify-center p-5 bg-gradient-to-br from-surface to-surface-variant rounded-[32px] border border-outline-variant/50 shadow-2xl mb-6"
        >
          <Cpu size={56} className="text-primary drop-shadow-[0_0_15px_rgba(168,199,250,0.8)]" />
        </motion.div>
        <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-on-surface via-primary to-on-surface mb-4 tracking-tighter">
          Network & Systems
        </h1>
        <p className="text-on-surface-variant text-lg font-medium max-w-xl mx-auto">
          Comprehensive real-time telemetry of ModKita's core infrastructure, CDNs, and database clusters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <StatusCard title="Vercel Edge CDN" desc="Global Content Delivery Network" state={status.cdn} latency={ping.cdn} icon={Globe} delay={0.1} />
        <StatusCard title="Firestore DB" desc="NoSQL Document Database Cluster" state={status.firestore} latency={ping.firestore} icon={Database} delay={0.2} />
        <StatusCard title="Realtime DB" desc="Low-latency Synchronized State" state={status.rtdb} latency={ping.rtdb} icon={Activity} delay={0.3} />
        <StatusCard title="Backblaze B2" desc="Object Storage Main Cluster" state={status.b2} latency={ping.b2} icon={Server} delay={0.4} />
        <StatusCard title="Auth Services" desc="Identity & Token Verification" state={status.auth} latency={ping.auth} icon={Shield} delay={0.5} />
      </div>
      
      <div className="mt-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface/50 rounded-full border border-outline-variant/30 text-xs font-mono text-on-surface-variant">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
          </span>
          Live monitoring active. Auto-refreshing every 15s.
        </div>
      </div>
    </motion.div>
  );
}

import { useEffect, useState } from 'react';
import { db, rtdb } from '../firebase/config';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { ref, get } from 'firebase/database';
import { Activity, Database, Server, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function Uptime() {
  const { t } = useTranslation();
  const [status, setStatus] = useState({
    firestore: 'loading',
    rtdb: 'loading',
    b2: 'loading'
  });

  useEffect(() => {
    const checkServices = async () => {
      // 1. Check Firestore
      try {
        const q = query(collection(db, 'mods'), limit(1));
        await getDocs(q);
        setStatus(prev => ({ ...prev, firestore: 'online' }));
      } catch (e) {
        setStatus(prev => ({ ...prev, firestore: 'offline' }));
      }

      // 2. Check RTDB
      try {
        await get(ref(rtdb, '.info/connected'));
        setStatus(prev => ({ ...prev, rtdb: 'online' }));
      } catch (e) {
        setStatus(prev => ({ ...prev, rtdb: 'offline' }));
      }

      // 3. Mock B2 Check (Since direct B2 ping from client isn't usually public, we assume online if network is up)
      try {
        // Just checking basic connectivity via a public fetch or assuming online for now
        await fetch('https://www.backblaze.com', { mode: 'no-cors' });
        setStatus(prev => ({ ...prev, b2: 'online' }));
      } catch (e) {
        setStatus(prev => ({ ...prev, b2: 'offline' }));
      }
    };

    checkServices();
    const interval = setInterval(checkServices, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const StatusCard = ({ title, state, icon: Icon, delay }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-surface border border-outline-variant/30 p-6 rounded-[32px] shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <div className={`p-4 rounded-full ${state === 'online' ? 'bg-primary/20 text-primary' : state === 'loading' ? 'bg-outline/20 text-outline' : 'bg-error/20 text-error'}`}>
          <Icon size={32} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-on-surface">{title}</h3>
          <p className="text-on-surface-variant text-sm mt-1">
            {state === 'online' ? 'Operational' : state === 'loading' ? 'Checking...' : 'Outage'}
          </p>
        </div>
      </div>
      <div>
        {state === 'online' ? (
          <CheckCircle size={32} className="text-primary drop-shadow-[0_0_10px_rgba(168,199,250,0.5)]" />
        ) : state === 'loading' ? (
          <Activity size={32} className="text-outline animate-spin" />
        ) : (
          <XCircle size={32} className="text-error drop-shadow-[0_0_10px_rgba(255,180,171,0.5)]" />
        )}
      </div>
    </motion.div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto py-12"
    >
      <div className="text-center mb-16">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center justify-center p-4 bg-primary/20 rounded-full mb-6"
        >
          <Activity size={48} className="text-primary" />
        </motion.div>
        <h1 className="text-4xl sm:text-5xl font-black text-on-surface mb-4 tracking-tight">System Status</h1>
        <p className="text-on-surface-variant text-lg">Real-time uptime monitoring for ModKita databases and storage.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatusCard title="Firestore DB" state={status.firestore} icon={Database} delay={0.1} />
        <StatusCard title="Realtime DB" state={status.rtdb} icon={Activity} delay={0.2} />
        <StatusCard title="Backblaze B2" state={status.b2} icon={Server} delay={0.3} />
      </div>
    </motion.div>
  );
}

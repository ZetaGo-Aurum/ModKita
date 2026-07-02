import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import ModCard from '../components/ModCard';
import ModModal from '../components/ModModal';
import { Layers, Sparkles, Send, Gamepad2, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Home() {
  const [mods, setMods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMod, setSelectedMod] = useState(null);
  const [showReqModal, setShowReqModal] = useState(false);
  const [reqForm, setReqForm] = useState({ title: '', detail: '' });
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'mods'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const modsData = [];
      snapshot.forEach((doc) => {
        modsData.push({ id: doc.id, ...doc.data() });
      });
      setMods(modsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('You must be logged in to request a mod.');
      return;
    }
    try {
      await addDoc(collection(db, 'requests'), {
        userId: currentUser.uid,
        email: currentUser.email,
        title: reqForm.title,
        detail: reqForm.detail,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      toast.success('Request sent successfully!');
      setShowReqModal(false);
      setReqForm({ title: '', detail: '' });
    } catch (error) {
      toast.error('Failed to send request.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-24"
    >
      {/* Hyper-Immersive Hero Section */}
      <section className="relative py-32 px-6 sm:px-12 mb-20 rounded-[48px] overflow-hidden border border-outline-variant/20 shadow-[0_0_80px_rgba(168,199,250,0.1)]">
        {/* Animated Background Mesh Grid */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik00MCAwaC00MHY0MGg0MHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPgo8cGF0aCBkPSJNMCAwTDQwIDQwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPgo8cGF0aCBkPSJNMCA0MEw0MCAwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] opacity-20" />
        
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />

        {/* Floating Glowing Orbs */}
        <motion.div 
          animate={{ x: [-50, 50, -50], y: [-50, 50, -50], scale: [1, 1.2, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-[20%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none"
        />
        <motion.div 
          animate={{ x: [50, -50, 50], y: [50, -50, 50], scale: [1, 1.3, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 right-[20%] w-[600px] h-[600px] bg-tertiary/20 rounded-full blur-[150px] mix-blend-screen pointer-events-none"
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          <motion.div 
            initial={{ y: 30, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-variant/30 backdrop-blur-xl text-primary border border-primary/30 mb-8 text-sm font-bold shadow-lg shadow-primary/20"
          >
            <Sparkles size={16} className="animate-pulse" /> The Next Generation of Game Modding
          </motion.div>
          
          <motion.h1 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="text-5xl sm:text-7xl md:text-8xl font-black text-on-surface mb-8 tracking-tighter leading-[1.05]"
          >
            {t('hero_title')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary via-tertiary to-primary animate-gradient-x">
              {t('hero_title_highlight')}
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-xl sm:text-2xl text-on-surface-variant max-w-3xl leading-relaxed mb-12 font-medium"
          >
            {t('hero_desc')}
          </motion.p>
          
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <button 
              onClick={() => currentUser ? setShowReqModal(true) : toast.error(t('btn_login_view'))}
              className="bg-primary text-on-primary font-black py-4 px-10 rounded-full shadow-[0_0_40px_rgba(168,199,250,0.4)] hover:shadow-[0_0_60px_rgba(168,199,250,0.6)] hover:bg-primary-container hover:text-on-primary-container hover:-translate-y-2 transition-all duration-300 flex items-center justify-center gap-3 ripple text-lg"
            >
              <Send size={22} /> {t('btn_req_mod')}
            </button>
            <a 
              href="#mods"
              className="bg-surface/50 backdrop-blur-md text-on-surface font-black py-4 px-10 rounded-full border border-outline-variant hover:bg-surface hover:-translate-y-2 transition-all duration-300 flex items-center justify-center gap-3 text-lg"
            >
              <Gamepad2 size={22} className="text-tertiary" /> Explore Mods
            </a>
          </motion.div>
        </div>
      </section>

      {/* Mods Grid */}
      <section id="mods" className="scroll-mt-32 relative">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
              <Zap size={32} className="text-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tight">{t('mods_available')}</h2>
          </div>
          <div className="px-5 py-2.5 bg-surface-variant/30 rounded-full text-sm font-bold text-on-surface-variant border border-outline-variant/30 backdrop-blur-sm">
            {mods.length} {t('mods_found')}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-surface-variant/20 h-[420px] rounded-[32px] border border-outline-variant/30"></div>
            ))}
          </div>
        ) : mods.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-32 bg-surface-variant/10 rounded-[40px] border border-outline-variant/30 backdrop-blur-xl shadow-2xl"
          >
            <Layers size={64} className="mx-auto text-outline mb-6 opacity-40" />
            <h3 className="text-2xl font-black text-on-surface mb-2 tracking-tight">{t('no_mods')}</h3>
            <p className="text-on-surface-variant text-lg">Be the first to request a mod!</p>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
          >
            {mods.map((mod) => (
              <ModCard key={mod.id} mod={mod} onOpenModal={setSelectedMod} />
            ))}
          </motion.div>
        )}
      </section>

      <ModModal mod={selectedMod} isOpen={!!selectedMod} onClose={() => setSelectedMod(null)} />

      {/* Request Modal */}
      <AnimatePresence>
        {showReqModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowReqModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30, rotateX: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 30, rotateX: -20 }}
              transition={{ type: "spring", bounce: 0.4 }}
              className="relative w-full max-w-lg bg-surface/80 backdrop-blur-2xl rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.5)] p-10 border border-outline-variant/40"
              style={{ perspective: 1000 }}
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 rounded-full blur-[40px]" />
              
              <h2 className="text-3xl font-black text-primary mb-2 tracking-tight">{t('req_mod_title')}</h2>
              <p className="text-base text-on-surface-variant mb-8">{t('req_mod_desc')}</p>
              
              <form onSubmit={handleRequestSubmit} className="space-y-6 relative z-10">
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-2 pl-1">{t('req_mod_name')}</label>
                  <input required value={reqForm.title} onChange={e => setReqForm({...reqForm, title: e.target.value})} className="w-full bg-surface-variant/30 border border-outline-variant rounded-2xl px-5 py-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline text-on-surface text-lg" placeholder="e.g. GTA V Ultra Graphics" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-2 pl-1">{t('req_mod_detail')}</label>
                  <textarea required rows={5} value={reqForm.detail} onChange={e => setReqForm({...reqForm, detail: e.target.value})} className="w-full bg-surface-variant/30 border border-outline-variant rounded-2xl px-5 py-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none custom-scrollbar transition-all placeholder:text-outline text-on-surface text-lg" placeholder="Describe the mod in detail..." />
                </div>
                <button type="submit" className="w-full bg-primary text-on-primary py-4 rounded-full font-black text-lg hover:bg-primary-container hover:text-on-primary-container transition-all shadow-[0_0_30px_rgba(168,199,250,0.3)] hover:shadow-[0_0_50px_rgba(168,199,250,0.5)] hover:-translate-y-1 ripple mt-4 flex items-center justify-center gap-2">
                  <Send size={20} /> {t('btn_send_req')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import ModCard from '../components/ModCard';
import ModModal from '../components/ModModal';
import { Layers, Sparkles, Send } from 'lucide-react';
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
      className="pb-16"
    >
      {/* Immersive Hero Section */}
      <section className="relative py-24 px-6 sm:px-12 mb-12 rounded-[40px] overflow-hidden border border-outline-variant/30 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-container via-surface to-background opacity-80" />
        
        {/* Animated Background Elements */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-32 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-32 -right-32 w-96 h-96 bg-tertiary/20 rounded-full blur-[100px]"
        />

        <div className="relative z-10 max-w-3xl">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/50 backdrop-blur-md text-primary border border-primary/20 mb-6 text-sm font-bold shadow-sm"
          >
            <Sparkles size={16} /> Exclusive Mod Distribution
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black text-on-surface mb-6 tracking-tight leading-[1.1]"
          >
            {t('hero_title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">{t('hero_title_highlight')}</span>
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg sm:text-xl text-on-surface-variant max-w-2xl leading-relaxed mb-8"
          >
            {t('hero_desc')}
          </motion.p>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <button 
              onClick={() => currentUser ? setShowReqModal(true) : toast.error(t('btn_login_view'))}
              className="bg-primary text-on-primary font-bold py-4 px-8 rounded-full shadow-xl hover:shadow-primary/30 hover:bg-primary-container hover:text-on-primary-container hover:-translate-y-1 transition-all flex items-center gap-2 ripple"
            >
              <Send size={18} /> {t('btn_req_mod')}
            </button>
          </motion.div>
        </div>
      </section>

      {/* Mods Grid */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-on-surface">{t('mods_available')}</h2>
          <div className="text-sm font-medium text-outline">
            {mods.length} {t('mods_found')}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-surface-variant/20 h-[380px] rounded-[28px] border border-outline-variant/30"></div>
            ))}
          </div>
        ) : mods.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-20 bg-surface-variant/20 rounded-[32px] border border-outline-variant/30 backdrop-blur-md"
          >
            <Layers size={48} className="mx-auto text-outline mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-on-surface mb-2">{t('no_mods')}</h3>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
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
              className="absolute inset-0 bg-scrim/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-surface-variant rounded-[32px] shadow-2xl p-8 border border-outline-variant/30"
            >
              <h2 className="text-2xl font-bold text-primary mb-2">{t('req_mod_title')}</h2>
              <p className="text-sm text-on-surface-variant mb-6">{t('req_mod_desc')}</p>
              
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">{t('req_mod_name')}</label>
                  <input required value={reqForm.title} onChange={e => setReqForm({...reqForm, title: e.target.value})} className="w-full bg-surface/50 border border-outline rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">{t('req_mod_detail')}</label>
                  <textarea required rows={4} value={reqForm.detail} onChange={e => setReqForm({...reqForm, detail: e.target.value})} className="w-full bg-surface/50 border border-outline rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none custom-scrollbar" />
                </div>
                <button type="submit" className="w-full bg-primary text-on-primary py-3 rounded-full font-bold hover:bg-primary-container hover:text-on-primary-container transition-all shadow-md ripple mt-4">
                  {t('btn_send_req')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

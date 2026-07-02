import { useState } from 'react';
import { Download, Lock, CheckCircle, Unlock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export default function ModCard({ mod, onOpenModal }) {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  const getActionButton = () => {
    // If it's a free mod
    if (mod.accessType === 'free') {
      return (
        <button 
          onClick={(e) => { e.stopPropagation(); onOpenModal(mod); }}
          className="w-full mt-4 bg-primary text-on-primary py-2.5 rounded-full font-black text-sm shadow-[0_0_20px_rgba(168,199,250,0.3)] hover:shadow-[0_0_30px_rgba(168,199,250,0.5)] hover:bg-primary-container hover:text-on-primary-container transition-all flex justify-center items-center gap-2"
        >
          <Unlock size={15} /> {t('btn_view_dl')}
        </button>
      );
    }

    // If it's restricted
    if (!currentUser) {
      return (
        <button 
          onClick={(e) => { e.stopPropagation(); navigate('/login'); }}
          className="w-full mt-4 bg-surface/50 text-primary border border-outline py-2.5 rounded-full font-bold text-sm hover:bg-primary/10 transition-all flex justify-center items-center gap-2"
        >
          {t('btn_login_view')}
        </button>
      );
    }
    
    const isDev = currentUser?.email === 'deltaastra24@gmail.com';
    const isAuthorized = isDev || userData?.role === 'admin' || userData?.role === 'dev' || userData?.status === 'approved';

    if (isAuthorized) {
      return (
        <button 
          onClick={(e) => { e.stopPropagation(); onOpenModal(mod); }}
          className="w-full mt-4 bg-primary text-on-primary py-2.5 rounded-full font-black text-sm shadow-[0_0_20px_rgba(168,199,250,0.3)] hover:shadow-[0_0_30px_rgba(168,199,250,0.5)] hover:bg-primary-container hover:text-on-primary-container transition-all flex justify-center items-center gap-2"
        >
          <CheckCircle size={15} /> {t('btn_view_dl')}
        </button>
      );
    }

    // Pending status for restricted mod
    return (
      <button 
        disabled
        className="w-full mt-4 bg-surface-variant/40 text-on-surface-variant/40 py-2.5 rounded-full font-bold text-sm flex justify-center items-center gap-2 cursor-not-allowed border border-outline-variant/20"
      >
        <Lock size={15} /> {t('btn_awaiting')}
      </button>
    );
  };

  const handleCardClick = () => {
    const isDev = currentUser?.email === 'deltaastra24@gmail.com';
    const isAuthorized = isDev || userData?.role === 'admin' || userData?.role === 'dev' || userData?.status === 'approved';

    if (mod.accessType === 'free' || isAuthorized) {
      onOpenModal(mod);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 350, damping: 22 }}
      className="group relative bg-surface/40 backdrop-blur-md rounded-[32px] overflow-hidden border border-outline-variant/20 hover:border-primary/40 transition-all duration-300 shadow-md hover:shadow-2xl hover:shadow-primary/5 flex flex-col h-full cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Decorative Radial Ambient Glow inside each Card */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500 pointer-events-none" />

      <div className="relative h-52 w-full overflow-hidden shrink-0">
        <motion.img 
          src={mod.coverUrl} 
          alt={mod.title} 
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Downloads Badge */}
        <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-outline-variant/30 text-[11px] font-bold text-on-surface flex items-center gap-1.5 shadow-sm">
          <Download size={12} className="text-primary" /> {mod.downloads || 0}
        </div>

        {/* Access Badge */}
        <div className="absolute top-4 left-4">
          <span className={`backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black tracking-wider uppercase shadow-md border ${mod.accessType === 'free' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-error/20 text-error border-error/30'}`}>
            {mod.accessType === 'free' ? t('card_free') : t('card_restricted')}
          </span>
        </div>

        {/* Category & Version Badges */}
        <div className="absolute bottom-4 left-4 flex gap-1.5 z-10">
          <span className="bg-primary/10 text-primary border border-primary/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
            {mod.category}
          </span>
          <span className="bg-secondary/10 text-secondary border border-secondary/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black tracking-wider">
            v{mod.version}
          </span>
        </div>
      </div>

      <div className="p-6 flex flex-col grow relative z-10">
        <h3 className="text-xl font-black text-on-surface mb-2 line-clamp-1 group-hover:text-primary transition-colors tracking-tight">{mod.title}</h3>
        <p className="text-sm text-on-surface-variant line-clamp-2 mb-4 grow leading-relaxed">
          {mod.description}
        </p>
        
        <div className="mt-auto">
          {getActionButton()}
        </div>
      </div>
    </motion.div>
  );
}

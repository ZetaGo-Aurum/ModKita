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
          className="w-full mt-4 bg-primary text-on-primary py-2.5 rounded-full font-semibold text-sm shadow-md hover:bg-primary-container hover:text-on-primary-container transition-colors ripple flex justify-center items-center gap-2"
        >
          <Unlock size={16} /> {t('btn_view_dl')}
        </button>
      );
    }

    // If it's restricted
    if (!currentUser) {
      return (
        <button 
          onClick={(e) => { e.stopPropagation(); navigate('/login'); }}
          className="w-full mt-4 bg-surface text-primary border border-outline py-2.5 rounded-full font-semibold text-sm hover:bg-surface-variant transition-colors flex justify-center items-center gap-2"
        >
          {t('btn_login_view')}
        </button>
      );
    }
    
    if (userData?.role === 'dev' || userData?.role === 'admin' || userData?.status === 'approved') {
      return (
        <button 
          onClick={(e) => { e.stopPropagation(); onOpenModal(mod); }}
          className="w-full mt-4 bg-primary text-on-primary py-2.5 rounded-full font-semibold text-sm shadow-md hover:bg-primary-container hover:text-on-primary-container transition-colors ripple flex justify-center items-center gap-2"
        >
          <CheckCircle size={16} /> {t('btn_view_dl')}
        </button>
      );
    }

    // Pending status for restricted mod
    return (
      <button 
        disabled
        className="w-full mt-4 bg-surface-variant text-on-surface-variant/50 py-2.5 rounded-full font-semibold text-sm flex justify-center items-center gap-2 cursor-not-allowed border border-outline-variant/30"
      >
        <Lock size={16} /> {t('btn_awaiting')}
      </button>
    );
  };

  const handleCardClick = () => {
    if (mod.accessType === 'free' || userData?.role === 'dev' || userData?.role === 'admin' || userData?.status === 'approved') {
      onOpenModal(mod);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative bg-surface-variant/20 rounded-[28px] overflow-hidden border border-outline-variant/30 hover:border-primary/50 transition-all duration-500 shadow-lg hover:shadow-2xl hover:shadow-primary/20 flex flex-col h-full cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <div className="relative h-48 w-full overflow-hidden shrink-0">
        <motion.img 
          src={mod.coverUrl} 
          alt={mod.title} 
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.7 }}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-variant/90 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="absolute top-4 right-4 bg-surface/80 backdrop-blur-md px-3 py-1 rounded-full border border-outline-variant text-xs font-bold text-on-surface flex items-center gap-1.5 shadow-sm">
          <Download size={14} className="text-primary" /> {mod.downloads || 0}
        </div>

        <div className="absolute top-4 left-4">
          <span className={`backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold shadow-md ${mod.accessType === 'free' ? 'bg-primary/90 text-on-primary' : 'bg-error/90 text-on-error'}`}>
            {mod.accessType === 'free' ? t('card_free') : t('card_restricted')}
          </span>
        </div>

        <div className="absolute bottom-4 left-4 flex gap-2">
          <span className="bg-primary/20 text-primary border border-primary/30 backdrop-blur-md px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide">
            {mod.category}
          </span>
          <span className="bg-secondary/20 text-secondary border border-secondary/30 backdrop-blur-md px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide">
            v{mod.version}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col grow bg-surface-variant/10 backdrop-blur-sm z-10">
        <h3 className="text-xl font-bold text-on-surface mb-2 line-clamp-1 group-hover:text-primary transition-colors">{mod.title}</h3>
        <p className="text-sm text-on-surface-variant line-clamp-2 mb-4 grow">
          {mod.description}
        </p>
        
        <div className="mt-auto">
          {getActionButton()}
        </div>
      </div>
    </motion.div>
  );
}

import { useState } from 'react';
import { Download, Lock, CheckCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ModCard({ mod, onOpenModal }) {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const getActionButton = () => {
    if (!currentUser) {
      return (
        <button 
          onClick={(e) => { e.stopPropagation(); navigate('/login'); }}
          className="w-full mt-4 bg-surface text-primary border border-outline py-2.5 rounded-full font-semibold text-sm hover:bg-surface-variant transition-colors flex justify-center items-center gap-2"
        >
          Login to View/Download
        </button>
      );
    }
    
    if (userData?.role === 'admin' || userData?.status === 'approved') {
      return (
        <button 
          onClick={(e) => { e.stopPropagation(); onOpenModal(mod); }}
          className="w-full mt-4 bg-primary text-on-primary py-2.5 rounded-full font-semibold text-sm shadow-md hover:bg-primary-container hover:text-on-primary-container transition-colors ripple flex justify-center items-center gap-2"
        >
          <CheckCircle size={16} /> View & Download
        </button>
      );
    }

    // Pending status
    return (
      <button 
        disabled
        className="w-full mt-4 bg-surface-variant text-on-surface-variant/50 py-2.5 rounded-full font-semibold text-sm flex justify-center items-center gap-2 cursor-not-allowed border border-outline-variant/30"
      >
        <Lock size={16} /> Awaiting Approval
      </button>
    );
  };

  return (
    <div 
      className="group relative bg-surface-variant/20 rounded-[28px] overflow-hidden border border-outline-variant/30 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 flex flex-col h-full cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => (userData?.role === 'admin' || userData?.status === 'approved') && onOpenModal(mod)}
    >
      <div className="relative h-48 w-full overflow-hidden shrink-0">
        <img 
          src={mod.coverUrl} 
          alt={mod.title} 
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-variant/90 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="absolute top-4 right-4 bg-surface/80 backdrop-blur-md px-3 py-1 rounded-full border border-outline-variant text-xs font-bold text-on-surface flex items-center gap-1.5 shadow-sm">
          <Download size={14} className="text-primary" /> {mod.downloads || 0}
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

      <div className="p-5 flex flex-col grow">
        <h3 className="text-xl font-bold text-on-surface mb-2 line-clamp-1 group-hover:text-primary transition-colors">{mod.title}</h3>
        <p className="text-sm text-on-surface-variant line-clamp-2 mb-4 grow">
          {mod.description}
        </p>
        
        <div className="mt-auto">
          {getActionButton()}
        </div>
      </div>
    </div>
  );
}

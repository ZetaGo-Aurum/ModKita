import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Calendar, HardDrive, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

export default function ModModal({ mod, isOpen, onClose }) {
  const { userData } = useAuth();
  
  if (!mod) return null;

  const handleDownload = async () => {
    if (userData?.role !== 'admin' && userData?.status !== 'approved') {
      toast.error('You must be an approved member to download mods.');
      return;
    }

    try {
      // Increment download count in Firestore
      const modRef = doc(db, 'mods', mod.id);
      await updateDoc(modRef, {
        downloads: increment(1)
      });
      
      // Trigger download
      window.open(mod.fileUrl, '_blank');
      toast.success('Download started!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to start download');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-scrim/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-3xl bg-surface-variant rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header / Cover */}
            <div className="relative h-64 sm:h-80 w-full shrink-0">
              <img 
                src={mod.coverUrl} 
                alt={mod.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-variant to-transparent" />
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-surface/50 hover:bg-surface backdrop-blur-md rounded-full text-on-surface transition-colors z-10"
              >
                <X size={24} />
              </button>
              
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                    {mod.category}
                  </span>
                  <span className="px-3 py-1 bg-secondary/20 text-secondary border border-secondary/30 rounded-full text-xs font-bold backdrop-blur-md">
                    v{mod.version}
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tight">{mod.title}</h2>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-primary mb-3">Description</h3>
                    <div className="text-on-surface-variant whitespace-pre-wrap leading-relaxed">
                      {mod.description}
                    </div>
                  </div>
                  
                  {mod.changelog && (
                    <div>
                      <h3 className="text-xl font-bold text-primary mb-3">Changelog</h3>
                      <div className="p-4 bg-surface rounded-2xl text-on-surface-variant text-sm whitespace-pre-wrap border border-outline-variant/30">
                        {mod.changelog}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="p-5 bg-surface rounded-3xl border border-outline-variant/30">
                    <h3 className="font-bold text-on-surface mb-4">Mod Details</h3>
                    <ul className="space-y-4">
                      <li className="flex items-center gap-3 text-on-surface-variant text-sm">
                        <Calendar size={18} className="text-primary" />
                        <div>
                          <p className="text-xs text-outline">Uploaded</p>
                          <p className="font-medium text-on-surface">{formatDate(mod.createdAt)}</p>
                        </div>
                      </li>
                      <li className="flex items-center gap-3 text-on-surface-variant text-sm">
                        <HardDrive size={18} className="text-primary" />
                        <div>
                          <p className="text-xs text-outline">File Size</p>
                          <p className="font-medium text-on-surface">{formatBytes(mod.fileSize)}</p>
                        </div>
                      </li>
                      <li className="flex items-center gap-3 text-on-surface-variant text-sm">
                        <Download size={18} className="text-primary" />
                        <div>
                          <p className="text-xs text-outline">Total Downloads</p>
                          <p className="font-medium text-on-surface">{mod.downloads || 0}</p>
                        </div>
                      </li>
                      <li className="flex items-center gap-3 text-on-surface-variant text-sm">
                        <Tag size={18} className="text-primary" />
                        <div>
                          <p className="text-xs text-outline">Tags</p>
                          <p className="font-medium text-on-surface">{mod.tags || 'None'}</p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={handleDownload}
                    className="w-full py-4 bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container rounded-full font-bold shadow-lg hover:shadow-xl transition-all ripple flex justify-center items-center gap-2"
                  >
                    <Download size={20} />
                    Download Mod
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

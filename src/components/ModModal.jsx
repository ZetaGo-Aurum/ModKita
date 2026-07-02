import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Calendar, HardDrive, Tag, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function ModModal({ mod, isOpen, onClose }) {
  const { userData } = useAuth();
  const { t } = useTranslation();
  
  if (!mod) return null;

  const handleDownload = async () => {
    // Free mods don't require verification to download.
    // Restricted mods require approved member or admin role.
    if (mod.accessType !== 'free') {
      if (userData?.role !== 'admin' && userData?.role !== 'dev' && userData?.status !== 'approved') {
        toast.error('You must be an approved member to download mods.');
        return;
      }
    }

    try {
      const modRef = doc(db, 'mods', mod.id);
      await updateDoc(modRef, {
        downloads: increment(1)
      });
      
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

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return null;
  };

  const embedUrl = getYouTubeEmbedUrl(mod.videoUrl);
  const isDirectVideo = mod.videoUrl && (
    mod.videoUrl.toLowerCase().endsWith('.mp4') || 
    mod.videoUrl.toLowerCase().endsWith('.webm') || 
    mod.videoUrl.toLowerCase().endsWith('.ogg') ||
    mod.videoUrl.includes('firebasestorage.googleapis.com') ||
    mod.videoUrl.includes('catbox') ||
    mod.videoUrl.includes('uguu') ||
    mod.videoUrl.includes('top4top')
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-surface/90 backdrop-blur-2xl rounded-[40px] shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] border border-outline-variant/30"
          >
            {/* Header / Cover */}
            <div className="relative h-64 sm:h-80 w-full shrink-0">
              <img 
                src={mod.coverUrl} 
                alt={mod.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/95 to-transparent" />
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-3 bg-surface/50 hover:bg-surface backdrop-blur-md rounded-full text-on-surface transition-all border border-outline-variant/30 z-10 hover:scale-105"
              >
                <X size={20} />
              </button>
              
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-3.5 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md">
                    {mod.category}
                  </span>
                  <span className="px-3.5 py-1 bg-secondary/20 text-secondary border border-secondary/30 rounded-full text-xs font-black backdrop-blur-md">
                    v{mod.version}
                  </span>
                  <span className={`px-3.5 py-1 border rounded-full text-xs font-black backdrop-blur-md ${mod.accessType === 'free' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-error/20 text-error border-error/30'}`}>
                    {mod.accessType === 'free' ? 'Free' : 'Restricted'}
                  </span>
                </div>
                <h2 className="text-3xl sm:text-5xl font-black text-on-surface tracking-tight">{mod.title}</h2>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 overflow-y-auto custom-scrollbar flex-grow">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {/* Description */}
                  <div>
                    <h3 className="text-xl font-black text-primary mb-3">{t('modal_desc')}</h3>
                    <div className="text-on-surface-variant whitespace-pre-wrap leading-relaxed">
                      {mod.description}
                    </div>
                  </div>

                  {/* Video Preview */}
                  {mod.videoUrl && (
                    <div>
                      <h3 className="text-xl font-black text-primary mb-3 flex items-center gap-2">
                        <Video size={20} /> Video Preview
                      </h3>
                      <div className="relative aspect-video rounded-3xl overflow-hidden border border-outline-variant/30 shadow-lg">
                        {embedUrl ? (
                          <iframe
                            src={embedUrl}
                            title="Video preview"
                            className="w-full h-full"
                            allowFullScreen
                            loading="lazy"
                          />
                        ) : isDirectVideo ? (
                          <video
                            src={mod.videoUrl}
                            controls
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-surface-variant/20 flex flex-col items-center justify-center p-6 text-center">
                            <Video size={40} className="text-outline mb-2" />
                            <a href={mod.videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">
                              Watch Video Preview Link
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Changelog */}
                  {mod.changelog && (
                    <div>
                      <h3 className="text-xl font-black text-primary mb-3">{t('modal_changelog')}</h3>
                      <div className="p-6 bg-surface-variant/20 rounded-3xl text-on-surface-variant text-sm whitespace-pre-wrap border border-outline-variant/30 leading-relaxed">
                        {mod.changelog}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar details */}
                <div className="space-y-6">
                  <div className="p-6 bg-surface-variant/10 rounded-3xl border border-outline-variant/30">
                    <h3 className="font-bold text-on-surface mb-4">{t('modal_details')}</h3>
                    <ul className="space-y-4">
                      <li className="flex items-center gap-3 text-on-surface-variant text-sm">
                        <Calendar size={18} className="text-primary" />
                        <div>
                          <p className="text-xs text-outline">{t('modal_uploaded')}</p>
                          <p className="font-bold text-on-surface">{formatDate(mod.createdAt)}</p>
                        </div>
                      </li>
                      <li className="flex items-center gap-3 text-on-surface-variant text-sm">
                        <HardDrive size={18} className="text-primary" />
                        <div>
                          <p className="text-xs text-outline">{t('modal_size')}</p>
                          <p className="font-bold text-on-surface">{formatBytes(mod.fileSize)}</p>
                        </div>
                      </li>
                      <li className="flex items-center gap-3 text-on-surface-variant text-sm">
                        <Download size={18} className="text-primary" />
                        <div>
                          <p className="text-xs text-outline">{t('modal_dl_count')}</p>
                          <p className="font-bold text-on-surface">{mod.downloads || 0}</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3 text-on-surface-variant text-sm">
                        <Tag size={18} className="text-primary mt-1" />
                        <div className="flex-1">
                          <p className="text-xs text-outline">Tags</p>
                          {Array.isArray(mod.tags) && mod.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {mod.tags.map((tag, idx) => (
                                <span key={idx} className="bg-primary/10 text-primary border border-primary/20 text-xs px-2.5 py-0.5 rounded-full font-bold">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="font-bold text-on-surface">{mod.tags || 'None'}</p>
                          )}
                        </div>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={handleDownload}
                    className="w-full py-4.5 bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container rounded-full font-black text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all ripple flex justify-center items-center gap-2"
                  >
                    <Download size={20} />
                    {t('modal_btn_dl')}
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

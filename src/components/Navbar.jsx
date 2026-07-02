import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { LogOut, ShieldAlert, Activity, Globe, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success(t('nav_logout') + ' Success');
      setMobileMenuOpen(false);
      navigate('/');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'id' ? 'en' : 'id';
    i18n.changeLanguage(newLang);
  };

  const getStatusBadge = () => {
    if (!userData) return null;
    if (userData.role === 'dev') {
      return (
        <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <ShieldAlert size={14} /> {t('status_dev')}
        </span>
      );
    }
    if (userData.role === 'admin') {
      return (
        <span className="bg-tertiary/20 text-tertiary border border-tertiary/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <ShieldAlert size={14} /> {t('status_admin')}
        </span>
      );
    }
    if (userData.status === 'approved') {
      return (
        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold">
          {t('status_approved')}
        </span>
      );
    }
    return (
      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
        {t('status_pending')}
      </span>
    );
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/60 backdrop-blur-xl border-b border-outline-variant/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo & Desktop Nav */}
          <div className="flex-shrink-0 flex items-center gap-8">
            <Link to="/" className="text-2xl font-black text-primary tracking-tighter hover:scale-105 transition-transform flex items-center gap-2">
              <span className="bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent">MOD</span>
              <span className="text-on-surface">KITA</span>
            </Link>
            <div className="hidden md:flex gap-6">
              <Link to="/" className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">
                {t('nav_home')}
              </Link>
              <Link to="/uptime" className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5">
                <Activity size={16} /> {t('nav_uptime')}
              </Link>
            </div>
          </div>

          {/* Desktop Right Panel */}
          <div className="hidden md:flex items-center gap-4">
            <button onClick={toggleLanguage} className="p-2.5 rounded-full hover:bg-surface-variant/50 text-on-surface-variant hover:text-on-surface transition-colors border border-outline-variant/30" title="Toggle Language">
              <Globe size={18} />
            </button>
            
            {currentUser ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  {getStatusBadge()}
                  <span className="text-xs text-on-surface-variant font-mono bg-surface-variant/20 px-3 py-1.5 rounded-full border border-outline-variant/20">{currentUser.email}</span>
                </div>
                
                {(userData?.role === 'admin' || userData?.role === 'dev') && (
                  <Link 
                    to="/admin" 
                    className="text-sm font-black text-on-primary bg-primary hover:bg-primary-container hover:text-on-primary-container transition-all px-5 py-2.5 rounded-full shadow-[0_0_20px_rgba(168,199,250,0.2)] hover:shadow-[0_0_30px_rgba(168,199,250,0.4)]"
                  >
                    {t('nav_dashboard')}
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-full hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors border border-outline-variant/30"
                  title={t('nav_logout')}
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-bold text-primary hover:text-primary-container transition-colors px-5 py-2.5 rounded-full hover:bg-primary/10"
                >
                  {t('nav_login')}
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-black bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-all px-6 py-3 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5"
                >
                  {t('nav_register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-3">
            <button onClick={toggleLanguage} className="p-2 rounded-full hover:bg-surface-variant/50 text-on-surface-variant hover:text-on-surface transition-colors" title="Toggle Language">
              <Globe size={18} />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-full bg-surface-variant/30 text-on-surface hover:text-primary transition-colors border border-outline-variant/30"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-outline-variant/20 bg-background/95 backdrop-blur-2xl overflow-hidden"
          >
            <div className="px-4 pt-4 pb-6 space-y-4">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-2xl text-base font-bold text-on-surface hover:bg-surface-variant/40 hover:text-primary transition-all"
              >
                {t('nav_home')}
              </Link>
              <Link
                to="/uptime"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-2xl text-base font-bold text-on-surface hover:bg-surface-variant/40 hover:text-primary transition-all flex items-center gap-2"
              >
                <Activity size={18} /> {t('nav_uptime')}
              </Link>

              {currentUser && (
                <div className="border-t border-outline-variant/20 pt-4 pb-2">
                  <div className="px-4 py-2 flex flex-col gap-2 mb-3">
                    <span className="text-xs text-outline font-mono overflow-hidden text-ellipsis whitespace-nowrap">
                      {currentUser.email}
                    </span>
                    <div className="w-fit">{getStatusBadge()}</div>
                  </div>

                  {(userData?.role === 'admin' || userData?.role === 'dev') && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-2xl text-base font-black text-primary bg-primary/10 border border-primary/20 hover:bg-primary hover:text-on-primary transition-all text-center"
                    >
                      {t('nav_dashboard')}
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full mt-3 px-4 py-3 rounded-2xl text-base font-bold text-error bg-error/10 hover:bg-error hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut size={18} /> {t('nav_logout')}
                  </button>
                </div>
              )}

              {!currentUser && (
                <div className="grid grid-cols-2 gap-3 border-t border-outline-variant/20 pt-4">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-2xl text-center text-sm font-bold text-primary hover:bg-primary/10 transition-all"
                  >
                    {t('nav_login')}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-2xl text-center text-sm font-black bg-primary text-on-primary hover:bg-primary-container transition-all"
                  >
                    {t('nav_register')}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

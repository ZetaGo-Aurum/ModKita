import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { LogOut, ShieldAlert, Activity, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function Navbar() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success(t('nav_logout') + ' Success');
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
      return <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"><ShieldAlert size={14} /> {t('status_dev')}</span>;
    }
    if (userData.role === 'admin') {
      return <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"><ShieldAlert size={14} /> {t('status_admin')}</span>;
    }
    if (userData.status === 'approved') {
      return <span className="bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-xs font-medium">{t('status_approved')}</span>;
    }
    return <span className="bg-error-container text-on-error-container px-3 py-1 rounded-full text-xs font-medium">{t('status_pending')}</span>;
  };

  return (
    <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center gap-6">
            <Link to="/" className="text-2xl font-black text-primary tracking-tighter hover:scale-105 transition-transform">
              MOD<span className="text-on-surface">KITA</span>
            </Link>
            <div className="hidden md:flex gap-4">
              <Link to="/" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">
                {t('nav_home')}
              </Link>
              <Link to="/uptime" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1">
                <Activity size={16} /> {t('nav_uptime')}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleLanguage} className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant hover:text-on-surface transition-colors" title="Toggle Language">
              <Globe size={20} />
            </button>
            
            {currentUser ? (
              <div className="flex items-center gap-4">
                <div className="hidden lg:flex items-center gap-3">
                  {getStatusBadge()}
                  <span className="text-sm text-on-surface-variant font-medium">{currentUser.email}</span>
                </div>
                
                {(userData?.role === 'admin' || userData?.role === 'dev') && (
                  <Link 
                    to="/admin" 
                    className="text-sm font-medium text-primary hover:text-primary-container transition-colors"
                  >
                    {t('nav_dashboard')}
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant hover:text-on-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                  title={t('nav_logout')}
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-primary hover:text-primary-container transition-colors px-4 py-2 rounded-full hover:bg-primary/10"
                >
                  {t('nav_login')}
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-colors px-5 py-2.5 rounded-full shadow-sm hover:shadow-md"
                >
                  {t('nav_register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

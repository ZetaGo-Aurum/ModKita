import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, googleProvider, githubProvider, db } from '../firebase/config';
import { signInWithEmailAndPassword, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email.endsWith('.mod')) {
      toast.error('Only .mod email domains are allowed for members.', { icon: '🚫' });
      return;
    }
    
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success(t('login_title'));
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Failed to login.');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      setLoading(true);
      const user = result.user;
      
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email || user.providerData[0]?.email || 'github-user',
          role: 'member',
          status: 'pending',
          createdAt: new Date().toISOString()
        });
        toast.success('Registration via GitHub successful! Please wait for Admin approval.');
      } else {
        toast.success(t('login_title'));
      }
      navigate('/');
    } catch (error) {
      if (error.code === 'auth/popup-blocked') {
        toast.loading('Popup blocked by browser. Redirecting to GitHub...', { duration: 3000 });
        await signInWithRedirect(auth, githubProvider);
      } else {
        toast.error(error.message || 'GitHub Sign-In failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdminGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setLoading(true);
      const user = result.user;
      
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        if (user.email === 'deltaastra24@gmail.com') { 
          await setDoc(userRef, {
            email: user.email,
            role: 'dev',
            status: 'approved',
            createdAt: new Date().toISOString()
          });
          toast.success('Dev Admin initialized.');
          navigate('/admin');
        } else {
          await auth.signOut();
          toast.error('Access Denied. Only authorized admins can use Google Sign-In.');
        }
      } else {
        const userData = userSnap.data();
        if (userData.role === 'admin' || userData.role === 'dev') {
          toast.success('Welcome, Admin.');
          navigate('/admin');
        } else {
          await auth.signOut();
          toast.error('Access Denied. Your account does not have admin privileges.');
        }
      }
    } catch (error) {
      if (error.code === 'auth/popup-blocked') {
        toast.loading('Popup blocked by browser. Redirecting to Google...', { duration: 3000 });
        await signInWithRedirect(auth, googleProvider);
      } else {
        toast.error(error.message || 'Google Sign-In failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex justify-center items-center min-h-[80vh]"
    >
      <div className="bg-surface-variant/30 backdrop-blur-xl p-8 rounded-[32px] w-full max-w-md border border-outline-variant/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-secondary/20 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-center text-primary mb-2">{t('login_title')}</h2>
          <p className="text-center text-on-surface-variant mb-8 text-sm">{t('login_desc')}</p>

          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div className="relative">
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="peer w-full bg-surface/50 border border-outline text-on-surface rounded-2xl px-4 pt-6 pb-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder=" " required />
              <label htmlFor="email" className="absolute text-sm text-on-surface-variant duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-primary">{t('login_email_ph')}</label>
            </div>

            <div className="relative">
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="peer w-full bg-surface/50 border border-outline text-on-surface rounded-2xl px-4 pt-6 pb-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder=" " required />
              <label htmlFor="password" className="absolute text-sm text-on-surface-variant duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-primary">{t('login_pass_ph')}</label>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-primary text-on-primary font-semibold py-3.5 rounded-full ripple shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all">
              {loading ? '...' : t('btn_signin_member')}
            </button>
          </form>

          <div className="mt-4">
            <button onClick={handleGithubLogin} disabled={loading} className="w-full bg-[#24292e] text-white font-medium py-3 rounded-full ripple hover:bg-[#2c3137] transition-colors flex items-center justify-center gap-3">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57C20.565 21.795 24 17.31 24 12c0-6.63-5.37-12-12-12z"/></svg>
              {t('btn_signin_github')}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-outline-variant/30">
            <button onClick={handleAdminGoogleLogin} disabled={loading} className="w-full bg-surface flex items-center justify-center gap-3 text-on-surface font-medium py-3 rounded-full border border-outline ripple hover:bg-surface-variant/50 transition-colors disabled:opacity-50">
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g>
              </svg>
              {t('btn_signin_admin')}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-on-surface-variant">
            {t('no_account')}{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              {t('nav_register')}
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

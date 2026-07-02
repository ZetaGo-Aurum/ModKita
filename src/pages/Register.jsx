import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, githubProvider, db } from '../firebase/config';
import { createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { currentUser, userData } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (currentUser && userData) {
      if (userData.role === 'admin' || userData.role === 'dev') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [currentUser, userData, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!email.endsWith('.mod')) {
      toast.error('Registration requires a .mod email address', { icon: '🚫' });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: 'member',
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      toast.success('Registration successful! Please wait for Admin approval.');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Registration failed');
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
          <h2 className="text-3xl font-bold text-center text-primary mb-2">Apply for Access</h2>
          <p className="text-center text-on-surface-variant mb-8 text-sm">Join the exclusive ModKita community</p>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="relative">
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="peer w-full bg-surface/50 border border-outline text-on-surface rounded-2xl px-4 pt-6 pb-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder=" " required />
              <label htmlFor="email" className="absolute text-sm text-on-surface-variant duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-primary">Email (.mod domain)</label>
            </div>

            <div className="relative">
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="peer w-full bg-surface/50 border border-outline text-on-surface rounded-2xl px-4 pt-6 pb-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder=" " required minLength={6} />
              <label htmlFor="password" className="absolute text-sm text-on-surface-variant duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-primary">Password (min 6 chars)</label>
            </div>

            <div className="relative">
              <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="peer w-full bg-surface/50 border border-outline text-on-surface rounded-2xl px-4 pt-6 pb-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder=" " required />
              <label htmlFor="confirmPassword" className="absolute text-sm text-on-surface-variant duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-primary">Confirm Password</label>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-primary text-on-primary font-semibold py-3.5 rounded-full ripple shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all mt-6">
              {loading ? 'Creating...' : t('nav_register')}
            </button>
          </form>
          
          <div className="mt-4">
            <button onClick={handleGithubLogin} disabled={loading} className="w-full bg-[#24292e] text-white font-medium py-3 rounded-full ripple hover:bg-[#2c3137] transition-colors flex items-center justify-center gap-3">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57C20.565 21.795 24 17.31 24 12c0-6.63-5.37-12-12-12z"/></svg>
              {t('btn_signin_github')}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-on-surface-variant">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              {t('nav_login')}
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

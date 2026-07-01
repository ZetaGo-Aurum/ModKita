import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, googleProvider, db } from '../firebase/config';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email.endsWith('.mod')) {
      toast.error('Only .mod email domains are allowed for members.', { icon: '🚫' });
      return;
    }
    
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // If first time admin login (or you can restrict to specific email here)
        if (user.email === 'admin@modkita.com') { // Replace with actual admin email check if needed
          await setDoc(userRef, {
            email: user.email,
            role: 'admin',
            status: 'approved',
            createdAt: new Date().toISOString()
          });
          toast.success('Admin initialized.');
          navigate('/admin');
        } else {
          // If not predefined admin, block it
          await auth.signOut();
          toast.error('Access Denied. Only authorized admins can use Google Sign-In.');
        }
      } else {
        const userData = userSnap.data();
        if (userData.role === 'admin') {
          toast.success('Welcome, Admin.');
          navigate('/admin');
        } else {
          await auth.signOut();
          toast.error('Access Denied. Your account does not have admin privileges.');
        }
      }
    } catch (error) {
      toast.error(error.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <div className="bg-surface-variant/30 backdrop-blur-xl p-8 rounded-[32px] w-full max-w-md border border-outline-variant/30 shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-primary mb-2">Welcome Back</h2>
        <p className="text-center text-on-surface-variant mb-8 text-sm">Sign in to access exclusive mods</p>

        <form onSubmit={handleEmailLogin} className="space-y-5">
          <div className="relative">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="peer w-full bg-surface/50 border border-outline text-on-surface rounded-2xl px-4 pt-6 pb-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              placeholder=" "
              required
            />
            <label
              htmlFor="email"
              className="absolute text-sm text-on-surface-variant duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-primary"
            >
              Email Address (must end in .mod)
            </label>
          </div>

          <div className="relative">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="peer w-full bg-surface/50 border border-outline text-on-surface rounded-2xl px-4 pt-6 pb-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              placeholder=" "
              required
            />
            <label
              htmlFor="password"
              className="absolute text-sm text-on-surface-variant duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-primary"
            >
              Password
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary font-semibold py-3.5 rounded-full ripple shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
          >
            {loading ? 'Signing In...' : 'Sign In as Member'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-outline-variant/30">
          <button
            onClick={handleAdminGoogleLogin}
            disabled={loading}
            className="w-full bg-surface flex items-center justify-center gap-3 text-on-surface font-medium py-3 rounded-full border border-outline ripple hover:bg-surface-variant/50 transition-colors disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
              </g>
            </svg>
            Sign In as Admin
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-on-surface-variant">
          Don't have a member account?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

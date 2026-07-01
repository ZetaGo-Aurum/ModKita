import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!email.endsWith('.mod')) {
      toast.error('Registration requires a .mod email address (e.g., username@example.mod)', {
        icon: '🚫',
        duration: 5000
      });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Add user to Firestore with pending status
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

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <div className="bg-surface-variant/30 backdrop-blur-xl p-8 rounded-[32px] w-full max-w-md border border-outline-variant/30 shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-primary mb-2">Apply for Access</h2>
        <p className="text-center text-on-surface-variant mb-8 text-sm">Join the exclusive ModKita community</p>

        <form onSubmit={handleRegister} className="space-y-5">
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
              minLength={6}
            />
            <label
              htmlFor="password"
              className="absolute text-sm text-on-surface-variant duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-primary"
            >
              Password (min 6 chars)
            </label>
          </div>

          <div className="relative">
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="peer w-full bg-surface/50 border border-outline text-on-surface rounded-2xl px-4 pt-6 pb-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              placeholder=" "
              required
            />
            <label
              htmlFor="confirmPassword"
              className="absolute text-sm text-on-surface-variant duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-primary"
            >
              Confirm Password
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary font-semibold py-3.5 rounded-full ripple shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all mt-6"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-on-surface-variant">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}

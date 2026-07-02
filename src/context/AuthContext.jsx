import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userDataLoading, setUserDataLoading] = useState(true);

  // Helper to check if email is whitelisted as admin (Only called for new registrations)
  const checkAdminWhitelist = async (email) => {
    try {
      const whitelistDoc = await getDoc(doc(db, 'admin_whitelist', email.toLowerCase()));
      return whitelistDoc.exists();
    } catch (e) {
      console.error("Whitelist check failed:", e);
      return false;
    }
  };

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const user = result.user;
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          const isWhitelisted = await checkAdminWhitelist(user.email);
          const isDev = user.email === 'deltaastra24@gmail.com';

          if (!userSnap.exists()) {
            await setDoc(userRef, {
              email: user.email,
              role: isDev ? 'dev' : (isWhitelisted ? 'admin' : 'member'),
              status: (isDev || isWhitelisted) ? 'approved' : 'pending',
              createdAt: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error("Redirect Auth Error:", error);
      }
    };

    handleRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false); // Instantly resolve main auth loading

      if (user) {
        setUserDataLoading(true);
        let resolved = false;

        // 1.5 second timeout to prevent page loading hanging on slow network (e.g. Telkomsel blocks)
        const timeout = setTimeout(() => {
          if (!resolved) {
            console.warn("Firestore fetch timed out. Falling back to local/static verification.");
            const isDev = user.email === 'deltaastra24@gmail.com';
            setUserData({ 
              role: isDev ? 'dev' : 'member', 
              status: isDev ? 'approved' : 'pending' 
            });
            setUserDataLoading(false);
          }
        }, 1500);

        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          resolved = true;
          clearTimeout(timeout);

          const isDev = user.email === 'deltaastra24@gmail.com';

          if (userDoc.exists()) {
            // Already registered, read role instantly without querying admin_whitelist
            setUserData(userDoc.data());
          } else {
            // New user registration - check whitelist here only
            const isWhitelisted = await checkAdminWhitelist(user.email);
            const newData = {
              email: user.email,
              role: isDev ? 'dev' : (isWhitelisted ? 'admin' : 'member'),
              status: (isDev || isWhitelisted) ? 'approved' : 'pending',
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, newData);
            setUserData(newData);
          }
        } catch (error) {
          resolved = true;
          clearTimeout(timeout);
          console.error("Error fetching user data:", error);
          
          // Graceful static fallback
          const isDev = user.email === 'deltaastra24@gmail.com';
          setUserData({ 
            role: isDev ? 'dev' : 'member', 
            status: isDev ? 'approved' : 'pending' 
          });
        } finally {
          setUserDataLoading(false);
        }
      } else {
        setUserData(null);
        setUserDataLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    loading: loading || userDataLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

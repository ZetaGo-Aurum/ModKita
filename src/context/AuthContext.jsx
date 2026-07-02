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

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
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
            } else {
              await setDoc(userRef, {
                email: user.email || user.providerData[0]?.email || 'social-user',
                role: 'member',
                status: 'pending',
                createdAt: new Date().toISOString()
              });
            }
          }
        }
      } catch (error) {
        console.error("Redirect Auth Error:", error);
      }
    };

    handleRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false); // Instantly resolve auth loading to make site feel fast

      if (user) {
        setUserDataLoading(true);
        let resolved = false;

        // Set a 2.5 second timeout to prevent Firestore hanging on slow/blocked connections (e.g. Telkomsel blocks)
        const timeout = setTimeout(() => {
          if (!resolved) {
            console.warn("Firestore fetch timed out. Falling back to local role verification.");
            if (user.email === 'deltaastra24@gmail.com') {
              setUserData({ role: 'dev', status: 'approved' });
            } else {
              setUserData({ role: 'member', status: 'pending' });
            }
            setUserDataLoading(false);
          }
        }, 2500);

        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          resolved = true;
          clearTimeout(timeout);

          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            if (user.email === 'deltaastra24@gmail.com') {
              setUserData({ role: 'dev', status: 'approved' });
            } else {
              setUserData({ role: 'member', status: 'pending' });
            }
          }
        } catch (error) {
          resolved = true;
          clearTimeout(timeout);
          console.error("Error fetching user data:", error);
          
          // Graceful fallback: Offline/Error shouldn't block the user
          if (user.email === 'deltaastra24@gmail.com') {
            setUserData({ role: 'dev', status: 'approved' });
          } else {
            setUserData({ role: 'member', status: 'pending' });
          }
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
    loading: loading || userDataLoading // Combined loading state
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

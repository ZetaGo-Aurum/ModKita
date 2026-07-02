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
      if (user) {
        // Fetch user data from firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            // Check if predefined Dev admin
            if (user.email === 'deltaastra24@gmail.com') {
              setUserData({ role: 'dev', status: 'approved' });
            } else {
              setUserData({ role: 'member', status: 'pending' });
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

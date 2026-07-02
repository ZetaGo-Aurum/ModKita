import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCnYzWpxFTBcpXTDE9D31HhBILPV0ZhYs4",
  authDomain: "mods-7c70d.firebaseapp.com",
  databaseURL: "https://mods-7c70d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mods-7c70d",
  storageBucket: "mods-7c70d.firebasestorage.app",
  messagingSenderId: "884157337235",
  appId: "1:884157337235:web:cc8269c61597fd0e178766",
  measurementId: "G-RFFPD91WNZ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with multi-tab offline persistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const storage = getStorage(app);
export const rtdb = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import ModCard from '../components/ModCard';
import ModModal from '../components/ModModal';
import { Layers } from 'lucide-react';

export default function Home() {
  const [mods, setMods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMod, setSelectedMod] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'mods'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const modsData = [];
      snapshot.forEach((doc) => {
        modsData.push({ id: doc.id, ...doc.data() });
      });
      setMods(modsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="pb-16">
      {/* Hero Section */}
      <section className="relative py-20 px-6 sm:px-12 mb-12 bg-surface-variant/30 rounded-[40px] overflow-hidden border border-outline-variant/30">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface text-primary border border-outline-variant/50 mb-6 text-sm font-bold shadow-sm">
            <Layers size={16} /> Exclusive Mod Distribution
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-on-surface mb-6 tracking-tight leading-tight">
            Elevate Your Experience with <span className="text-primary">Premium Mods</span>
          </h1>
          <p className="text-lg sm:text-xl text-on-surface-variant max-w-2xl leading-relaxed">
            Welcome to the exclusive hub for high-quality game modifications. Discover, download, and enhance your gameplay with our curated selection of verified mods.
          </p>
        </div>
      </section>

      {/* Mods Grid */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-on-surface">Available Mods</h2>
          <div className="text-sm font-medium text-outline">
            {mods.length} {mods.length === 1 ? 'Mod' : 'Mods'} Found
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse bg-surface-variant/20 h-96 rounded-[28px] border border-outline-variant/30">
                <div className="h-48 bg-surface-variant/50 rounded-t-[28px]"></div>
                <div className="p-5 space-y-4">
                  <div className="h-6 bg-surface-variant/50 rounded w-3/4"></div>
                  <div className="h-4 bg-surface-variant/50 rounded w-full"></div>
                  <div className="h-4 bg-surface-variant/50 rounded w-5/6"></div>
                  <div className="h-10 bg-surface-variant/50 rounded-full w-full mt-6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : mods.length === 0 ? (
          <div className="text-center py-20 bg-surface-variant/20 rounded-[32px] border border-outline-variant/30">
            <Layers size={48} className="mx-auto text-outline mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-on-surface mb-2">No Mods Available</h3>
            <p className="text-on-surface-variant">Check back later for exciting new uploads.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mods.map((mod) => (
              <ModCard key={mod.id} mod={mod} onOpenModal={setSelectedMod} />
            ))}
          </div>
        )}
      </section>

      <ModModal 
        mod={selectedMod} 
        isOpen={!!selectedMod} 
        onClose={() => setSelectedMod(null)} 
      />
    </div>
  );
}

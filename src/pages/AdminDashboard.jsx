import { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { uploadFileToB2, deleteFileFromB2 } from '../lib/b2Storage';
import toast from 'react-hot-toast';
import { Upload, Trash2, CheckCircle, XCircle, Users, Box, PlusCircle, Shield, Inbox } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  const { userData } = useAuth();
  const isDev = userData?.role === 'dev';
  const [activeTab, setActiveTab] = useState('mods'); // 'mods', 'users', 'requests', 'admins'
  
  const [users, setUsers] = useState([]);
  const [mods, setMods] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: '', slug: '', version: '', description: '', category: '', tags: '', changelog: '', accessType: 'restricted', videoUrl: ''
  });
  const [coverFile, setCoverFile] = useState(null);
  const [modFile, setModFile] = useState(null);
  const coverInputRef = useRef();
  const modInputRef = useRef();

  // Fetch Users, Mods, Requests
  useEffect(() => {
    const unsubUsers = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      const data = [];
      snapshot.forEach(d => data.push({ id: d.id, ...d.data() }));
      setUsers(data);
    });

    const unsubMods = onSnapshot(query(collection(db, 'mods')), (snapshot) => {
      const data = [];
      snapshot.forEach(d => data.push({ id: d.id, ...d.data() }));
      setMods(data);
    });

    const unsubReqs = onSnapshot(query(collection(db, 'requests')), (snapshot) => {
      const data = [];
      snapshot.forEach(d => data.push({ id: d.id, ...d.data() }));
      setRequests(data);
    });

    setLoading(false);
    return () => { unsubUsers(); unsubMods(); unsubReqs(); };
  }, []);

  const handleTitleChange = (val) => {
    const slugified = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setFormData({ ...formData, title: val, slug: slugified });
  };

  const handleUserStatusToggle = async (userId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: currentStatus === 'approved' ? 'pending' : 'approved'
      });
      toast.success(`User status updated`);
    } catch (error) { toast.error('Failed to update status'); }
  };

  const handleAdminToggle = async (userId, currentRole) => {
    if (!isDev) return;
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: currentRole === 'admin' ? 'member' : 'admin',
        status: 'approved' // admins must be approved
      });
      toast.success(`Admin role updated`);
    } catch (error) { toast.error('Failed to update role'); }
  };

  const handleDeleteMod = async (mod) => {
    if (!window.confirm('Delete this mod? Cannot be undone.')) return;
    try {
      // Delete cover from Firebase Storage
      try { await deleteObject(ref(storage, mod.coverStoragePath)); } catch(e){}
      // Delete mod from B2
      try { await deleteFileFromB2(mod.fileStorageName); } catch(e){}
      
      await deleteDoc(doc(db, 'mods', mod.id));
      toast.success('Mod deleted');
    } catch (error) { toast.error('Error deleting mod'); }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!coverFile || !modFile) return toast.error('Cover image and mod file required.');
    
    // Check if B2 Key is set
    if (import.meta.env.VITE_B2_APPLICATION_KEY === "isi_dengan_secret_application_key_anda" || !import.meta.env.VITE_B2_APPLICATION_KEY) {
      toast.error('B2 Application Key not set in .env! Cannot upload mod to B2.');
      return;
    }

    setIsUploading(true);
    try {
      const timestamp = Date.now();
      
      // Upload Cover to Firebase Storage
      const coverStoragePath = `covers/${timestamp}_${coverFile.name}`;
      const coverRef = ref(storage, coverStoragePath);
      const coverTask = uploadBytesResumable(coverRef, coverFile);
      await new Promise((resolve, reject) => {
        coverTask.on('state_changed', () => setUploadProgress(5), reject, resolve);
      });
      const coverUrl = await getDownloadURL(coverRef);

      // Upload Mod to B2
      const b2FileName = `${timestamp}_${modFile.name}`;
      setUploadProgress(10); // Indicate start of B2
      
      const fileUrl = await uploadFileToB2(modFile, b2FileName);
      setUploadProgress(90);

      // Parse tags
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

      await addDoc(collection(db, 'mods'), {
        ...formData,
        tags: tagsArray,
        coverUrl, fileUrl, coverStoragePath, fileStorageName: b2FileName,
        fileSize: modFile.size, downloads: 0, createdAt: new Date().toISOString()
      });

      toast.success('Upload complete!');
      setFormData({ title: '', slug: '', version: '', description: '', category: '', tags: '', changelog: '', accessType: 'restricted', videoUrl: '' });
      setCoverFile(null); setModFile(null);
      if (coverInputRef.current) coverInputRef.current.value = '';
      if (modInputRef.current) modInputRef.current.value = '';
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Upload failed.');
    } finally {
      setIsUploading(false); setUploadProgress(0);
    }
  };

  const handleRequestStatus = async (reqId, status) => {
    try {
      await updateDoc(doc(db, 'requests', reqId), { status });
      toast.success(`Request marked as ${status}`);
    } catch (error) { toast.error('Failed to update request'); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-on-surface mb-2 tracking-tight">Admin Control Panel</h1>
        <p className="text-on-surface-variant text-sm">Manage system content and members.</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-8 bg-surface-variant/30 p-2 rounded-3xl w-fit border border-outline-variant/30 backdrop-blur-md">
        <button onClick={() => setActiveTab('mods')} className={`px-5 py-2.5 rounded-2xl font-semibold text-sm flex items-center gap-2 transition-all ${activeTab === 'mods' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface hover:bg-surface-variant'}`}><Box size={18} /> Mods</button>
        <button onClick={() => setActiveTab('users')} className={`px-5 py-2.5 rounded-2xl font-semibold text-sm flex items-center gap-2 transition-all ${activeTab === 'users' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface hover:bg-surface-variant'}`}><Users size={18} /> Members</button>
        <button onClick={() => setActiveTab('requests')} className={`px-5 py-2.5 rounded-2xl font-semibold text-sm flex items-center gap-2 transition-all ${activeTab === 'requests' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface hover:bg-surface-variant'}`}><Inbox size={18} /> Requests</button>
        {isDev && (
          <button onClick={() => setActiveTab('admins')} className={`px-5 py-2.5 rounded-2xl font-semibold text-sm flex items-center gap-2 transition-all ${activeTab === 'admins' ? 'bg-tertiary text-on-tertiary shadow-md' : 'text-on-surface hover:bg-surface-variant'}`}><Shield size={18} /> Admins</button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'mods' && (
          <motion.div key="mods" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
            {/* Upload Form */}
            <div className="bg-surface border border-outline-variant/30 p-6 md:p-8 rounded-[32px] shadow-sm">
              <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center gap-2"><PlusCircle className="text-primary"/> Upload Mod</h2>
              <form onSubmit={handleUploadSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-on-surface-variant mb-1">Title</label>
                    <input required value={formData.title} onChange={e => handleTitleChange(e.target.value)} className="w-full bg-surface-variant/50 border border-outline rounded-xl px-4 py-2.5 focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-on-surface-variant mb-1">Slug</label>
                    <input required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full bg-surface-variant/50 border border-outline rounded-xl px-4 py-2.5 focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-on-surface-variant mb-1">Version</label>
                    <input required value={formData.version} onChange={e => setFormData({...formData, version: e.target.value})} className="w-full bg-surface-variant/50 border border-outline rounded-xl px-4 py-2.5 focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-on-surface-variant mb-1">Category</label>
                    <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-surface-variant/50 border border-outline rounded-xl px-4 py-2.5 focus:border-primary outline-none">
                      <option value="" disabled>Select</option>
                      <option value="Tools">Tools</option>
                      <option value="Visuals">Visuals</option>
                      <option value="Gameplay">Gameplay</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-on-surface-variant mb-1">Access Type</label>
                    <select required value={formData.accessType} onChange={e => setFormData({...formData, accessType: e.target.value})} className="w-full bg-surface-variant/50 border border-outline rounded-xl px-4 py-2.5 focus:border-primary outline-none">
                      <option value="restricted">Restricted (Members Only)</option>
                      <option value="free">Free (Public/Guests)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-on-surface-variant mb-1">Video Preview (YouTube URL or Direct Link)</label>
                    <input value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} className="w-full bg-surface-variant/50 border border-outline rounded-xl px-4 py-2.5 focus:border-primary outline-none" placeholder="e.g. https://www.youtube.com/watch?v=..." />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-on-surface-variant mb-1">Tags (Comma-separated)</label>
                  <input value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className="w-full bg-surface-variant/50 border border-outline rounded-xl px-4 py-2.5 focus:border-primary outline-none" placeholder="e.g. gta, graphics, hd" />
                </div>

                <div>
                  <label className="block text-sm text-on-surface-variant mb-1">Description</label>
                  <textarea required rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-surface-variant/50 border border-outline rounded-xl px-4 py-2.5 focus:border-primary outline-none" />
                </div>

                <div>
                  <label className="block text-sm text-on-surface-variant mb-1">Changelog</label>
                  <textarea rows={3} value={formData.changelog} onChange={e => setFormData({...formData, changelog: e.target.value})} className="w-full bg-surface-variant/50 border border-outline rounded-xl px-4 py-2.5 focus:border-primary outline-none" placeholder="What is new in this version?" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-on-surface-variant mb-1">Cover Image (Firebase)</label>
                    <input ref={coverInputRef} required type="file" accept="image/*" onChange={e => setCoverFile(e.target.files[0])} className="w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary-container file:text-on-primary-container" />
                  </div>
                  <div>
                    <label className="block text-sm text-on-surface-variant mb-1">Mod Archive (Backblaze B2)</label>
                    <input ref={modInputRef} required type="file" accept=".zip,.rar,.7z" onChange={e => setModFile(e.target.files[0])} className="w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-secondary-container file:text-on-secondary-container" />
                  </div>
                </div>
                {isUploading && <div className="w-full bg-surface-variant rounded-full h-2 mt-2"><div className="bg-primary h-2 rounded-full" style={{ width: `${uploadProgress}%` }}></div></div>}
                <button type="submit" disabled={isUploading} className="bg-primary text-on-primary py-3 px-8 rounded-full font-bold flex items-center gap-2 hover:bg-primary-container">{isUploading ? 'Uploading...' : 'Upload Mod'}</button>
              </form>
            </div>

            {/* Mod List */}
            <div className="bg-surface border border-outline-variant/30 p-6 rounded-[32px]">
              <h2 className="text-xl font-bold mb-4">Uploaded Mods</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-outline-variant/50 text-sm text-outline"><tr><th className="pb-3">Mod</th><th className="pb-3">Slug</th><th className="pb-3">Access</th><th className="pb-3 text-right">Actions</th></tr></thead>
                  <tbody>
                    {mods.map(mod => (
                      <tr key={mod.id} className="border-b border-outline-variant/20">
                        <td className="py-3 flex items-center gap-3"><img src={mod.coverUrl} className="w-10 h-10 rounded-lg object-cover" /><div><p className="font-bold">{mod.title}</p><p className="text-xs text-on-surface-variant">v{mod.version}</p></div></td>
                        <td className="py-3 font-mono text-xs">{mod.slug}</td>
                        <td className="py-3"><span className={`px-2 py-1 rounded-md text-xs ${mod.accessType === 'free' ? 'bg-primary/20 text-primary' : 'bg-error/20 text-error'}`}>{mod.accessType}</span></td>
                        <td className="py-3 text-right"><button onClick={() => handleDeleteMod(mod)} className="p-2 text-error hover:bg-error/10 rounded-full"><Trash2 size={18} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div key="users" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-surface border border-outline-variant/30 p-6 rounded-[32px]">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Users className="text-primary"/> Member Approvals</h2>
            <table className="w-full text-left">
              <thead className="border-b border-outline-variant/50 text-sm text-outline"><tr><th className="pb-3 pl-4">Email</th><th className="pb-3">Role</th><th className="pb-3">Status</th><th className="pb-3 text-right pr-4">Action</th></tr></thead>
              <tbody className="text-sm">
                {users.filter(u => u.role === 'member').map(user => (
                  <tr key={user.id} className="border-b border-outline-variant/20 hover:bg-surface-variant/20">
                    <td className="py-4 pl-4">{user.email}</td>
                    <td className="py-4">Member</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.status === 'approved' ? 'bg-tertiary/20 text-tertiary' : 'bg-error/20 text-error'}`}>{user.status}</span>
                    </td>
                    <td className="py-4 text-right pr-4">
                      <button onClick={() => handleUserStatusToggle(user.id, user.status)} className="bg-primary/10 text-primary px-4 py-1.5 rounded-full hover:bg-primary/20 text-xs font-bold">
                        {user.status === 'approved' ? 'Revoke' : 'Approve'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {activeTab === 'requests' && (
          <motion.div key="reqs" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-surface border border-outline-variant/30 p-6 rounded-[32px]">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Inbox className="text-primary"/> Mod Requests</h2>
            <div className="space-y-4">
              {requests.map(req => (
                <div key={req.id} className="bg-surface-variant/20 p-5 rounded-2xl border border-outline-variant/30 flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-on-surface text-lg">{req.title}</h3>
                    <p className="text-on-surface-variant text-sm mt-1">{req.detail}</p>
                    <p className="text-xs text-outline mt-3">From: {req.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {req.status === 'pending' ? (
                      <>
                        <button onClick={() => handleRequestStatus(req.id, 'fulfilled')} className="bg-primary/20 text-primary px-3 py-1.5 rounded-full text-xs font-bold hover:bg-primary/30">Mark Fulfilled</button>
                        <button onClick={() => handleRequestStatus(req.id, 'rejected')} className="bg-error/20 text-error px-3 py-1.5 rounded-full text-xs font-bold hover:bg-error/30">Reject</button>
                      </>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${req.status === 'fulfilled' ? 'bg-tertiary/20 text-tertiary' : 'bg-error/20 text-error'}`}>{req.status.toUpperCase()}</span>
                    )}
                  </div>
                </div>
              ))}
              {requests.length === 0 && <p className="text-on-surface-variant">No requests yet.</p>}
            </div>
          </motion.div>
        )}

        {activeTab === 'admins' && isDev && (
          <motion.div key="admins" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-surface border border-outline-variant/30 p-6 rounded-[32px]">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Shield className="text-tertiary"/> Admin Management (Dev Only)</h2>
            <table className="w-full text-left">
              <thead className="border-b border-outline-variant/50 text-sm text-outline"><tr><th className="pb-3 pl-4">Email</th><th className="pb-3">Role</th><th className="pb-3 text-right pr-4">Action</th></tr></thead>
              <tbody className="text-sm">
                {users.filter(u => u.role !== 'dev').map(user => (
                  <tr key={user.id} className="border-b border-outline-variant/20">
                    <td className="py-4 pl-4">{user.email}</td>
                    <td className="py-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-tertiary/20 text-tertiary' : 'bg-surface-variant text-on-surface-variant'}`}>{user.role}</span></td>
                    <td className="py-4 text-right pr-4">
                      <button onClick={() => handleAdminToggle(user.id, user.role)} className="bg-outline/20 text-on-surface px-4 py-1.5 rounded-full text-xs font-bold hover:bg-outline/40">
                        {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

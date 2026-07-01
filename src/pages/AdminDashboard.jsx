import { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import toast from 'react-hot-toast';
import { Upload, Trash2, Edit, CheckCircle, XCircle, Users, Box, PlusCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('mods'); // 'mods' or 'users'
  
  // Users state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Mods state
  const [mods, setMods] = useState([]);
  const [loadingMods, setLoadingMods] = useState(true);
  
  // Upload Form state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    version: '',
    description: '',
    category: '',
    tags: '',
    changelog: ''
  });
  const [coverFile, setCoverFile] = useState(null);
  const [modFile, setModFile] = useState(null);
  
  const coverInputRef = useRef();
  const modInputRef = useRef();

  // Fetch Users
  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = [];
      snapshot.forEach((doc) => {
        // Exclude admin from member list for safety or keep them to see all.
        if (doc.data().role !== 'admin') {
          usersData.push({ id: doc.id, ...doc.data() });
        }
      });
      setUsers(usersData);
      setLoadingUsers(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Mods
  useEffect(() => {
    const q = query(collection(db, 'mods'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const modsData = [];
      snapshot.forEach((doc) => {
        modsData.push({ id: doc.id, ...doc.data() });
      });
      setMods(modsData);
      setLoadingMods(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUserStatusToggle = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: newStatus
      });
      toast.success(`User status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteMod = async (mod) => {
    if (!window.confirm('Are you sure you want to delete this mod? This cannot be undone.')) return;
    
    try {
      // Delete files from storage
      const coverRef = ref(storage, mod.coverStoragePath);
      const fileRef = ref(storage, mod.fileStoragePath);
      
      try { await deleteObject(coverRef); } catch (e) { console.log('Cover not found', e); }
      try { await deleteObject(fileRef); } catch (e) { console.log('File not found', e); }
      
      // Delete document from firestore
      await deleteDoc(doc(db, 'mods', mod.id));
      toast.success('Mod deleted successfully');
    } catch (error) {
      toast.error('Error deleting mod');
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!coverFile || !modFile) {
      toast.error('Please select both a cover image and the mod file.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const timestamp = Date.now();
      const coverStoragePath = `covers/${timestamp}_${coverFile.name}`;
      const fileStoragePath = `mods/${timestamp}_${modFile.name}`;
      
      const coverRef = ref(storage, coverStoragePath);
      const fileRef = ref(storage, fileStoragePath);

      // Upload Cover
      const coverUploadTask = uploadBytesResumable(coverRef, coverFile);
      await new Promise((resolve, reject) => {
        coverUploadTask.on('state_changed', 
          (snapshot) => { setUploadProgress(10); }, 
          (error) => reject(error), 
          () => resolve()
        );
      });
      const coverUrl = await getDownloadURL(coverRef);

      // Upload Mod File
      const fileUploadTask = uploadBytesResumable(fileRef, modFile);
      await new Promise((resolve, reject) => {
        fileUploadTask.on('state_changed', 
          (snapshot) => { 
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 90;
            setUploadProgress(10 + progress);
          }, 
          (error) => reject(error), 
          () => resolve()
        );
      });
      const fileUrl = await getDownloadURL(fileRef);

      // Save to Firestore
      await addDoc(collection(db, 'mods'), {
        ...formData,
        coverUrl,
        fileUrl,
        coverStoragePath,
        fileStoragePath,
        fileSize: modFile.size,
        downloads: 0,
        createdAt: new Date().toISOString()
      });

      toast.success('Mod uploaded successfully!');
      
      // Reset form
      setFormData({ title: '', version: '', description: '', category: '', tags: '', changelog: '' });
      setCoverFile(null);
      setModFile(null);
      if (coverInputRef.current) coverInputRef.current.value = '';
      if (modInputRef.current) modInputRef.current.value = '';
      
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload mod. See console for details.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-on-surface mb-2 tracking-tight">Admin Control Panel</h1>
        <p className="text-on-surface-variant text-sm">Manage users, content, and system settings.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 bg-surface-variant/30 p-2 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('mods')}
          className={`px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${activeTab === 'mods' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface hover:bg-surface-variant'}`}
        >
          <Box size={18} /> Mod Management
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${activeTab === 'users' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface hover:bg-surface-variant'}`}
        >
          <Users size={18} /> User Access
        </button>
      </div>

      {/* Content */}
      {activeTab === 'mods' && (
        <div className="space-y-8">
          {/* Upload Form */}
          <div className="bg-surface border border-outline-variant/30 p-6 md:p-8 rounded-[32px] shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <PlusCircle className="text-primary" size={24} />
              <h2 className="text-2xl font-bold text-on-surface">Upload New Mod</h2>
            </div>
            
            <form onSubmit={handleUploadSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Title</label>
                  <input required name="title" value={formData.title} onChange={handleFormChange} className="w-full bg-surface-variant/50 border border-outline rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="Mod Title" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Version</label>
                  <input required name="version" value={formData.version} onChange={handleFormChange} className="w-full bg-surface-variant/50 border border-outline rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. 1.0.4" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Category</label>
                  <select required name="category" value={formData.category} onChange={handleFormChange} className="w-full bg-surface-variant/50 border border-outline rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none">
                    <option value="" disabled>Select Category</option>
                    <option value="Tools">Tools</option>
                    <option value="Visuals">Visuals</option>
                    <option value="Gameplay">Gameplay</option>
                    <option value="Performance">Performance</option>
                    <option value="Audio">Audio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Tags (comma separated)</label>
                  <input name="tags" value={formData.tags} onChange={handleFormChange} className="w-full bg-surface-variant/50 border border-outline rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="hd, textures, overhaul" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Description</label>
                <textarea required name="description" value={formData.description} onChange={handleFormChange} rows={3} className="w-full bg-surface-variant/50 border border-outline rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none custom-scrollbar" placeholder="Detailed description of the mod..."></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Changelog (Optional)</label>
                <textarea name="changelog" value={formData.changelog} onChange={handleFormChange} rows={2} className="w-full bg-surface-variant/50 border border-outline rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none custom-scrollbar" placeholder="Version history..."></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Cover Image (JPG/PNG)</label>
                  <input ref={coverInputRef} required type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files[0])} className="w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-container file:text-on-primary-container hover:file:bg-primary/20 file:cursor-pointer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Mod Archive (ZIP/RAR)</label>
                  <input ref={modInputRef} required type="file" accept=".zip,.rar,.7z" onChange={(e) => setModFile(e.target.files[0])} className="w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-secondary-container file:text-on-secondary-container hover:file:bg-secondary/20 file:cursor-pointer" />
                </div>
              </div>

              {isUploading && (
                <div className="w-full bg-surface-variant rounded-full h-2.5 mt-4 overflow-hidden">
                  <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}

              <div className="pt-2">
                <button type="submit" disabled={isUploading} className="bg-primary text-on-primary font-bold py-3 px-8 rounded-full shadow-md hover:shadow-lg hover:bg-primary-container hover:text-on-primary-container transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Upload size={18} /> {isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : 'Upload Mod to Server'}
                </button>
              </div>
            </form>
          </div>

          {/* Existing Mods List */}
          <div className="bg-surface border border-outline-variant/30 p-6 rounded-[32px] shadow-sm">
            <h2 className="text-xl font-bold text-on-surface mb-6">Uploaded Mods</h2>
            {loadingMods ? (
              <p className="text-on-surface-variant">Loading mods...</p>
            ) : mods.length === 0 ? (
              <p className="text-on-surface-variant text-sm bg-surface-variant/20 p-4 rounded-xl">No mods uploaded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/50 text-sm text-outline">
                      <th className="pb-3 font-medium">Mod</th>
                      <th className="pb-3 font-medium">Category</th>
                      <th className="pb-3 font-medium">Downloads</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {mods.map((mod) => (
                      <tr key={mod.id} className="border-b border-outline-variant/20 hover:bg-surface-variant/20 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <img src={mod.coverUrl} alt="cover" className="w-12 h-12 rounded-lg object-cover" />
                            <div>
                              <p className="font-bold text-on-surface">{mod.title}</p>
                              <p className="text-xs text-on-surface-variant">v{mod.version}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-on-surface-variant">{mod.category}</td>
                        <td className="py-4 text-on-surface-variant font-mono">{mod.downloads || 0}</td>
                        <td className="py-4 text-right">
                          <button onClick={() => handleDeleteMod(mod)} className="p-2 text-error hover:bg-error/10 rounded-full transition-colors" title="Delete Mod">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-surface border border-outline-variant/30 p-6 rounded-[32px] shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Users className="text-primary" size={24} />
            <h2 className="text-2xl font-bold text-on-surface">Member Access Control</h2>
          </div>
          
          <div className="bg-surface-variant/20 p-4 rounded-2xl mb-6 border border-outline-variant/30 flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-full text-primary">
              <CheckCircle size={20} />
            </div>
            <p className="text-sm text-on-surface-variant">
              Approve users to grant them access to view and download mods. Pending users can only see restricted mod cards.
            </p>
          </div>

          {loadingUsers ? (
            <p className="text-on-surface-variant">Loading members...</p>
          ) : users.length === 0 ? (
            <p className="text-on-surface-variant text-sm bg-surface-variant/20 p-4 rounded-xl">No member applications yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/50 text-sm text-outline">
                    <th className="pb-3 font-medium pl-4">Email Address (.mod)</th>
                    <th className="pb-3 font-medium">Applied Date</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right pr-4">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-outline-variant/20 hover:bg-surface-variant/20 transition-colors">
                      <td className="py-4 pl-4 font-medium text-on-surface">{user.email}</td>
                      <td className="py-4 text-on-surface-variant">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4">
                        {user.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-tertiary-container text-on-tertiary-container">
                            <CheckCircle size={12} /> Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-error-container text-on-error-container">
                            <XCircle size={12} /> Pending
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-right pr-4">
                        <button
                          onClick={() => handleUserStatusToggle(user.id, user.status)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                            user.status === 'approved' 
                            ? 'bg-surface-variant text-on-surface-variant hover:bg-outline-variant' 
                            : 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container'
                          }`}
                        >
                          {user.status === 'approved' ? 'Revoke Access' : 'Approve Member'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

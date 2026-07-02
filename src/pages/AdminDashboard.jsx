import { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { uploadFileToB2, deleteFileFromB2 } from '../lib/b2Storage';
import { uploadFileToCloudinary } from '../lib/cloudinaryStorage';
import toast from 'react-hot-toast';
import { Upload, Trash2, CheckCircle, XCircle, Users, Box, PlusCircle, Shield, Inbox, Link as LinkIcon, HardDrive, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
  const { currentUser, userData } = useAuth();
  const { t } = useTranslation();
  const isDev = currentUser?.email === 'deltaastra24@gmail.com';
  const [activeTab, setActiveTab] = useState('mods'); // 'mods', 'users', 'requests', 'admins'
  
  const [users, setUsers] = useState([]);
  const [mods, setMods] = useState([]);
  const [requests, setRequests] = useState([]);
  const [whitelistedAdmins, setWhitelistedAdmins] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Storage settings selection
  const [coverStorageType, setCoverStorageType] = useState('firebase'); // 'firebase' | 'cloudinary'
  const [videoStorageType, setVideoStorageType] = useState('firebase'); // 'firebase' | 'cloudinary'
  const [modStorageType, setModStorageType] = useState('b2'); // 'b2' | 'cloudinary'

  const [formData, setFormData] = useState({
    title: '', slug: '', version: '', description: '', category: '', tags: '', changelog: '', accessType: 'restricted', videoUrl: '', externalDownloadUrl: ''
  });
  const [coverFile, setCoverFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [modFile, setModFile] = useState(null);
  const coverInputRef = useRef();
  const videoInputRef = useRef();
  const modInputRef = useRef();

  // Fetch Users, Mods, Requests, Whitelisted Admins
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

    const unsubWhitelist = onSnapshot(query(collection(db, 'admin_whitelist')), (snapshot) => {
      const data = [];
      snapshot.forEach(d => data.push({ id: d.id, ...d.data() }));
      setWhitelistedAdmins(data);
    });

    setLoading(false);
    return () => { unsubUsers(); unsubMods(); unsubReqs(); unsubWhitelist(); };
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

  const handleAddWhitelistAdmin = async (e) => {
    e.preventDefault();
    if (!isDev) return;
    if (!newAdminEmail) return;

    try {
      const emailLower = newAdminEmail.toLowerCase().trim();
      await setDoc(doc(db, 'admin_whitelist', emailLower), {
        email: emailLower,
        addedAt: new Date().toISOString()
      });
      toast.success(`Email ${emailLower} whitelisted as Admin`);
      setNewAdminEmail('');
    } catch (error) {
      toast.error('Failed to add admin to whitelist');
    }
  };

  const handleRemoveWhitelistAdmin = async (email) => {
    if (!isDev) return;
    if (!window.confirm(`Remove admin privileges for ${email}?`)) return;

    try {
      await deleteDoc(doc(db, 'admin_whitelist', email.toLowerCase()));
      toast.success(`Removed admin privileges`);
    } catch (error) {
      toast.error('Failed to remove admin');
    }
  };

  const handleDeleteMod = async (mod) => {
    if (!window.confirm('Delete this mod? Cannot be undone.')) return;
    try {
      // Delete cover from Firebase Storage (if stored there)
      if (mod.coverStoragePath) {
        try { await deleteObject(ref(storage, mod.coverStoragePath)); } catch(e){}
      }
      // Delete video from Firebase Storage (if stored there)
      if (mod.videoStoragePath) {
        try { await deleteObject(ref(storage, mod.videoStoragePath)); } catch(e){}
      }
      // Delete mod from B2 (if stored there)
      if (mod.fileStorageName) {
        try { await deleteFileFromB2(mod.fileStorageName); } catch(e){}
      }
      
      await deleteDoc(doc(db, 'mods', mod.id));
      toast.success('Mod deleted');
    } catch (error) { toast.error('Error deleting mod'); }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!coverFile) return toast.error('Cover image is required.');
    
    // Check if either mod file OR external URL is provided
    if (!modFile && !formData.externalDownloadUrl) {
      return toast.error('Please upload a mod file or provide an external download link.');
    }

    setIsUploading(true);
    setUploadProgress(5);
    try {
      const timestamp = Date.now();
      
      // 1. Upload Cover
      let coverUrl = '';
      let coverStoragePath = '';
      if (coverStorageType === 'cloudinary') {
        coverUrl = await uploadFileToCloudinary(coverFile, 'covers', 'image');
      } else {
        coverStoragePath = `covers/${timestamp}_${coverFile.name}`;
        const coverRef = ref(storage, coverStoragePath);
        await uploadBytes(coverRef, coverFile);
        coverUrl = await getDownloadURL(coverRef);
      }
      setUploadProgress(30);

      // 2. Upload Video Preview
      let videoUrl = formData.videoUrl || '';
      let videoStoragePath = '';
      if (videoFile) {
        if (videoStorageType === 'cloudinary') {
          videoUrl = await uploadFileToCloudinary(videoFile, 'videos', 'video');
        } else {
          videoStoragePath = `videos/${timestamp}_${videoFile.name}`;
          const videoRef = ref(storage, videoStoragePath);
          await uploadBytes(videoRef, videoFile);
          videoUrl = await getDownloadURL(videoRef);
        }
      }
      setUploadProgress(60);

      // 3. Upload Mod File
      let fileUrl = formData.externalDownloadUrl || '';
      let b2FileName = '';
      let fileSize = 0;

      if (modFile) {
        fileSize = modFile.size;
        if (modStorageType === 'cloudinary') {
          fileUrl = await uploadFileToCloudinary(modFile, 'archives', 'raw');
        } else {
          // Check if B2 Key is set
          if (import.meta.env.VITE_B2_APPLICATION_KEY === "isi_dengan_secret_application_key_anda" || !import.meta.env.VITE_B2_APPLICATION_KEY) {
            toast.error('B2 Application Key not set in .env! Cannot upload mod to B2. Try using Cloudinary or an external link.');
            setIsUploading(false);
            return;
          }

          b2FileName = `${timestamp}_${modFile.name}`;
          fileUrl = await uploadFileToB2(modFile, b2FileName);
        }
      }
      setUploadProgress(95);

      // Parse tags
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

      await addDoc(collection(db, 'mods'), {
        ...formData,
        tags: tagsArray,
        coverUrl,
        videoUrl,
        videoStoragePath,
        fileUrl,
        coverStoragePath,
        fileStorageName: b2FileName,
        fileSize,
        downloads: 0,
        createdAt: new Date().toISOString()
      });

      toast.success('Upload complete!');
      setFormData({ title: '', slug: '', version: '', description: '', category: '', tags: '', changelog: '', accessType: 'restricted', videoUrl: '', externalDownloadUrl: '' });
      setCoverFile(null); setVideoFile(null); setModFile(null);
      if (coverInputRef.current) coverInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
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
        <h1 className="text-3xl font-black text-on-surface mb-2 tracking-tight">{t('admin_panel')}</h1>
        <p className="text-on-surface-variant text-sm">{t('admin_panel_desc')}</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-8 bg-surface-variant/30 p-2 rounded-3xl w-fit border border-outline-variant/30 backdrop-blur-md">
        <button onClick={() => setActiveTab('mods')} className={`px-5 py-2.5 rounded-2xl font-semibold text-sm flex items-center gap-2 transition-all ${activeTab === 'mods' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface hover:bg-surface-variant'}`}><Box size={18} /> {t('tab_mods')}</button>
        <button onClick={() => setActiveTab('users')} className={`px-5 py-2.5 rounded-2xl font-semibold text-sm flex items-center gap-2 transition-all ${activeTab === 'users' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface hover:bg-surface-variant'}`}><Users size={18} /> {t('tab_members')}</button>
        <button onClick={() => setActiveTab('requests')} className={`px-5 py-2.5 rounded-2xl font-semibold text-sm flex items-center gap-2 transition-all ${activeTab === 'requests' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface hover:bg-surface-variant'}`}><Inbox size={18} /> {t('tab_requests')}</button>
        {isDev && (
          <button onClick={() => setActiveTab('admins')} className={`px-5 py-2.5 rounded-2xl font-semibold text-sm flex items-center gap-2 transition-all ${activeTab === 'admins' ? 'bg-tertiary text-on-tertiary shadow-md' : 'text-on-surface hover:bg-surface-variant'}`}><Shield size={18} /> {t('tab_admins')}</button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'mods' && (
          <motion.div key="mods" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
            {/* Upload Form */}
            <div className="bg-surface border border-outline-variant/30 p-6 md:p-8 rounded-[32px] shadow-sm">
              <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center gap-2"><PlusCircle className="text-primary"/> {t('upload_mod')}</h2>
              <form onSubmit={handleUploadSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-on-surface-variant mb-1">{t('mod_title')}</label>
                    <input required value={formData.title} onChange={e => handleTitleChange(e.target.value)} className="w-full bg-surface-variant/50 border border-outline rounded-xl px-4 py-2.5 focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-on-surface-variant mb-1">{t('mod_slug')}</label>
                    <input required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full bg-surface-variant/50 border border-outline rounded-xl px-4 py-2.5 focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-on-surface-variant mb-1">{t('mod_version')}</label>
                    <input required value={formData.version} onChange={e => setFormData({...formData, version: e.target.value})} className="w-full bg-surface-variant/50 border border-outline rounded-xl px-4 py-2.5 focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-on-surface-variant mb-1">{t('mod_category')}</label>
                    <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-surface-variant/50 border border-outline rounded-xl px-4 py-2.5 focus:border-primary outline-none">
                      <option value="" disabled>Select</option>
                      <option value="Tools">Tools</option>
                      <option value="Visuals">Visuals</option>
                      <option value="Gameplay">Gameplay</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-on-surface-variant mb-1">{t('mod_access_type')}</label>
                    <select required value={formData.accessType} onChange={e => setFormData({...formData, accessType: e.target.value})} className="w-full bg-surface-variant/50 border border-outline rounded-xl px-4 py-2.5 focus:border-primary outline-none">
                      <option value="restricted">{t('mod_access_restricted')}</option>
                      <option value="free">{t('mod_access_free')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-on-surface-variant mb-1">{t('mod_video_preview')}</label>
                    <input value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} className="w-full bg-surface-variant/50 border border-outline rounded-xl px-4 py-2.5 focus:border-primary outline-none" placeholder="e.g. YouTube, Catbox, Uguu, Top4top URL" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-on-surface-variant mb-1">{t('mod_ext_link')} ({t('mod_ext_link_desc')})</label>
                  <div className="relative">
                    <input value={formData.externalDownloadUrl} onChange={e => setFormData({...formData, externalDownloadUrl: e.target.value})} className="w-full bg-surface-variant/50 border border-outline rounded-xl pl-10 pr-4 py-2.5 focus:border-primary outline-none" placeholder="e.g. Google Drive, Mega, MediaFire, Catbox link" />
                    <LinkIcon size={18} className="absolute left-3.5 top-3.5 text-outline" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-on-surface-variant mb-1">{t('mod_tags')}</label>
                  <input value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className="w-full bg-surface-variant/50 border border-outline rounded-xl px-4 py-2.5 focus:border-primary outline-none" placeholder="e.g. gta, graphics, hd" />
                </div>

                <div>
                  <label className="block text-sm text-on-surface-variant mb-1">{t('mod_desc')}</label>
                  <textarea required rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-surface-variant/50 border border-outline rounded-xl px-4 py-2.5 focus:border-primary outline-none" />
                </div>

                <div>
                  <label className="block text-sm text-on-surface-variant mb-1">{t('mod_changelog_input')}</label>
                  <textarea rows={3} value={formData.changelog} onChange={e => setFormData({...formData, changelog: e.target.value})} className="w-full bg-surface-variant/50 border border-outline rounded-xl px-4 py-2.5 focus:border-primary outline-none" placeholder="What is new in this version?" />
                </div>

                {/* Storage Target Option Selectors */}
                <div className="p-6 bg-surface-variant/10 rounded-3xl border border-outline-variant/30 space-y-4">
                  <h3 className="text-sm font-bold text-outline uppercase tracking-wider flex items-center gap-2"><HardDrive size={16}/> Storage Provider Config</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-on-surface-variant mb-1">Cover Image Destination</label>
                      <select value={coverStorageType} onChange={e => setCoverStorageType(e.target.value)} className="w-full bg-surface/50 border border-outline-variant rounded-xl px-3 py-2 outline-none text-sm">
                        <option value="firebase">Firebase Storage</option>
                        <option value="cloudinary">Cloudinary</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-on-surface-variant mb-1">Video File Destination</label>
                      <select value={videoStorageType} onChange={e => setVideoStorageType(e.target.value)} className="w-full bg-surface/50 border border-outline-variant rounded-xl px-3 py-2 outline-none text-sm">
                        <option value="firebase">Firebase Storage</option>
                        <option value="cloudinary">Cloudinary</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-on-surface-variant mb-1">Mod Archive Destination</label>
                      <select value={modStorageType} onChange={e => setModStorageType(e.target.value)} className="w-full bg-surface/50 border border-outline-variant rounded-xl px-3 py-2 outline-none text-sm">
                        <option value="b2">Backblaze B2 (Main-Cluster)</option>
                        <option value="cloudinary">Cloudinary</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm text-on-surface-variant mb-1 flex items-center gap-1"><ImageIcon size={16} /> {t('mod_cover_img')}</label>
                    <input ref={coverInputRef} required type="file" accept="image/*" onChange={e => setCoverFile(e.target.files[0])} className="w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary-container file:text-on-primary-container" />
                  </div>
                  <div>
                    <label className="block text-sm text-on-surface-variant mb-1 flex items-center gap-1"><VideoIcon size={16} /> {t('mod_video_file')}</label>
                    <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/ogg" onChange={e => setVideoFile(e.target.files[0])} className="w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-secondary-container file:text-on-secondary-container" />
                  </div>
                  <div>
                    <label className="block text-sm text-on-surface-variant mb-1 flex items-center gap-1"><Box size={16} /> {t('mod_file_archive')}</label>
                    <input ref={modInputRef} type="file" accept=".zip,.rar,.7z,.apk" onChange={e => setModFile(e.target.files[0])} className="w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-secondary-container file:text-on-secondary-container" />
                  </div>
                </div>
                {isUploading && <div className="w-full bg-surface-variant rounded-full h-2 mt-2"><div className="bg-primary h-2 rounded-full" style={{ width: `${uploadProgress}%` }}></div></div>}
                <button type="submit" disabled={isUploading} className="bg-primary text-on-primary py-3 px-8 rounded-full font-bold flex items-center gap-2 hover:bg-primary-container">{isUploading ? t('uploading') : t('btn_upload_mod')}</button>
              </form>
            </div>

            {/* Mod List */}
            <div className="bg-surface border border-outline-variant/30 p-6 rounded-[32px]">
              <h2 className="text-xl font-bold mb-4">{t('uploaded_mods')}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-outline-variant/50 text-sm text-outline"><tr><th className="pb-3">Mod</th><th className="pb-3">{t('mod_slug')}</th><th className="pb-3">{t('mod_access_type')}</th><th className="pb-3 text-right">{t('actions')}</th></tr></thead>
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
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Users className="text-primary"/> {t('member_approvals')}</h2>
            <table className="w-full text-left">
              <thead className="border-b border-outline-variant/50 text-sm text-outline"><tr><th className="pb-3 pl-4">{t('member_email')}</th><th className="pb-3">{t('member_role')}</th><th className="pb-3">{t('member_status')}</th><th className="pb-3 text-right pr-4">{t('actions')}</th></tr></thead>
              <tbody className="text-sm">
                {users.filter(u => u.role === 'member').map(user => (
                  <tr key={user.id} className="border-b border-outline-variant/20 hover:bg-surface-variant/20">
                    <td className="py-4 pl-4">{user.email}</td>
                    <td className="py-4">{t('status_pending')}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-error/20 text-error'}`}>{user.status}</span>
                    </td>
                    <td className="py-4 text-right pr-4">
                      <button onClick={() => handleUserStatusToggle(user.id, user.status)} className="bg-primary/10 text-primary px-4 py-1.5 rounded-full hover:bg-primary/20 text-xs font-bold transition-all">
                        {user.status === 'approved' ? t('btn_revoke') : t('btn_approve')}
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
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Inbox className="text-primary"/> {t('mod_requests')}</h2>
            <div className="space-y-4">
              {requests.map(req => (
                <div key={req.id} className="bg-surface-variant/20 p-5 rounded-2xl border border-outline-variant/30 flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-on-surface text-lg">{req.title}</h3>
                    <p className="text-on-surface-variant text-sm mt-1">{req.detail}</p>
                    <p className="text-xs text-outline mt-3">{t('req_from')}: {req.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {req.status === 'pending' ? (
                      <>
                        <button onClick={() => handleRequestStatus(req.id, 'fulfilled')} className="bg-primary/20 text-primary px-4 py-2 rounded-full text-xs font-bold hover:bg-primary/30 transition-all">{t('btn_fulfill')}</button>
                        <button onClick={() => handleRequestStatus(req.id, 'rejected')} className="bg-error/20 text-error px-4 py-2 rounded-full text-xs font-bold hover:bg-error/30 transition-all">{t('btn_reject')}</button>
                      </>
                    ) : (
                      <span className={`px-4 py-2 rounded-full text-xs font-bold ${req.status === 'fulfilled' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-error/20 text-error'}`}>{req.status.toUpperCase()}</span>
                    )}
                  </div>
                </div>
              ))}
              {requests.length === 0 && <p className="text-on-surface-variant">{t('no_requests')}</p>}
            </div>
          </motion.div>
        )}

        {activeTab === 'admins' && isDev && (
          <motion.div key="admins" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
            {/* Add Whitelist Admin */}
            <div className="bg-surface border border-outline-variant/30 p-6 rounded-[32px] shadow-sm">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-tertiary"><Shield size={20}/> {t('whitelist_admin')}</h2>
              <form onSubmit={handleAddWhitelistAdmin} className="flex gap-3 max-w-lg">
                <input 
                  type="email" 
                  required 
                  value={newAdminEmail} 
                  onChange={e => setNewAdminEmail(e.target.value)} 
                  placeholder="e.g. administrator@gmail.com" 
                  className="grow bg-surface-variant/50 border border-outline rounded-xl px-4 py-2.5 focus:border-primary outline-none"
                />
                <button type="submit" className="bg-tertiary text-on-tertiary font-bold px-6 py-2.5 rounded-xl hover:bg-tertiary/80 transition-all flex items-center gap-2"><PlusCircle size={18}/> {t('btn_whitelist')}</button>
              </form>
            </div>

            {/* List Whitelisted Admins */}
            <div className="bg-surface border border-outline-variant/30 p-6 rounded-[32px]">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Shield className="text-tertiary"/> {t('whitelisted_admins')}</h2>
              <table className="w-full text-left">
                <thead className="border-b border-outline-variant/50 text-sm text-outline"><tr><th className="pb-3 pl-4">{t('member_email')}</th><th className="pb-3">{t('added_date')}</th><th className="pb-3 text-right pr-4">{t('actions')}</th></tr></thead>
                <tbody className="text-sm">
                  {whitelistedAdmins.map(admin => (
                    <tr key={admin.id} className="border-b border-outline-variant/20 hover:bg-surface-variant/10">
                      <td className="py-4 pl-4 font-mono font-bold">{admin.email}</td>
                      <td className="py-4 text-outline text-xs">{admin.addedAt ? new Date(admin.addedAt).toLocaleDateString() : 'Unknown'}</td>
                      <td className="py-4 text-right pr-4">
                        <button onClick={() => handleRemoveWhitelistAdmin(admin.email)} className="bg-error/10 text-error px-4 py-1.5 rounded-full text-xs font-bold hover:bg-error/20 transition-all flex items-center gap-1.5 ml-auto">
                          <Trash2 size={12}/> {t('btn_remove_whitelist')}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {whitelistedAdmins.length === 0 && (
                    <tr><td colSpan={3} className="py-6 pl-4 text-on-surface-variant">{t('no_whitelisted_admins')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

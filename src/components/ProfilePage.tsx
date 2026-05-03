import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Film, Image as ImageIcon, User as UserIcon, Trash2, Play, Coins, Calendar, Award, Sparkles, Zap, ChevronRight, Check } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const AdminDashboard = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const qs = await getDocs(collection(db, 'users'));
      const us: any[] = [];
      qs.forEach(docSnap => {
         us.push({ id: docSnap.id, ...docSnap.data() });
      });
      setUsers(us);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const addCredits = async (userId: string, currentCredits: number, amount: number) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
         credits: (currentCredits || 0) + amount
      });
      fetchUsers();
    } catch(e) {
      console.error("Error adding credits", e);
      alert("Error adding credits: " + e);
    }
  };

  return (
    <div className="bg-white border border-black/5 p-12">
      <h3 className="text-3xl font-black uppercase mb-8 flex items-center gap-4">Admin Dashboard <Zap size={24} /></h3>
      {loading ? <p className="mono text-xs uppercase opacity-40">Loading users...</p> : (
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b border-black/10">
                     <th className="py-4 mono text-[10px] uppercase opacity-40">User Email / ID</th>
                     <th className="py-4 mono text-[10px] uppercase opacity-40">Credits</th>
                     <th className="py-4 mono text-[10px] uppercase opacity-40">Action</th>
                  </tr>
               </thead>
               <tbody>
                  {users.map(u => (
                     <tr key={u.id} className="border-b border-black/5 last:border-0 hover:bg-ivory transition-colors">
                        <td className="py-4 px-2">{u.email || u.uid || u.id}</td>
                        <td className="py-4 px-2 font-black text-xl">{u.credits || 0}</td>
                        <td className="py-4 px-2 flex gap-2">
                           <button onClick={() => addCredits(u.id, u.credits, 10)} className="btn-outline py-2 px-4 text-[10px] font-bold">+10 Credits</button>
                           <button onClick={() => addCredits(u.id, u.credits, 50)} className="btn-outline py-2 px-4 text-[10px] font-bold">+50 Credits</button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      )}
    </div>
  );
};

interface ProfilePageProps {
  user: any;
  credits: number;
  libraryAssets: any[];
  userTrailers: any[];
  onLoadProject: (project: any) => void;
  onDeleteProject: (id: string) => void;
  onDeleteAsset: (e: React.MouseEvent, asset: any) => void;
  onUseAssetInProject: (assets: any[]) => void;
  notifications: string[];
  onShowPricing: () => void;
}

type ProfileTab = 'videos' | 'assets' | 'account' | 'admin';

export default function ProfilePage({
  user,
  credits,
  libraryAssets,
  userTrailers,
  onLoadProject,
  onDeleteProject,
  onDeleteAsset,
  onUseAssetInProject,
  notifications,
  onShowPricing,
}: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('videos');
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

  const isAdmin = user?.email?.toLowerCase() === 'philipsimmons67@gmail.com';

  const tabs: { id: ProfileTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'videos', label: 'Videos', icon: <Film size={16} />, count: userTrailers.length },
    { id: 'assets', label: 'Assets', icon: <ImageIcon size={16} />, count: libraryAssets.length },
    { id: 'account', label: 'Settings', icon: <UserIcon size={16} /> },
  ];

  if (isAdmin) {
    tabs.push({ id: 'admin', label: 'Admin Dashboard', icon: <Zap size={16} /> });
  }

  const toggleAssetSelection = (id: string) => {
    setSelectedAssets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-cream text-ink font-sans selection:bg-ink selection:text-cream">
      <div className="max-w-7xl mx-auto px-6 py-24">
        
        {/* Profile Header Block */}
        <div className="bg-white border border-black/5 p-10 mb-16 flex flex-col md:flex-row items-center gap-12 relative shadow-sm">
          <div className="relative group shrink-0">
            <div className="w-32 h-32 rounded-none border border-black/10 overflow-hidden bg-ivory group-hover:scale-105 transition-transform duration-500 p-1">
              <img
                src={user?.photoURL || ''}
                className="w-full h-full object-cover"
                alt="Profile"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-ink flex items-center justify-center text-cream">
              <Award size={18} />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="mono text-[10px] font-bold uppercase tracking-widest text-muted mb-4">
              VibeTrailer Verified Artist
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none mb-4">
              {user?.displayName || 'Creative Visionary'}
            </h1>
            <p className="mono text-xs opacity-40">
              {user?.email}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 w-full md:w-auto">
            {[
              { icon: <Coins size={14} />, val: credits, label: 'Credits' },
              { icon: <Film size={14} />, val: userTrailers.length, label: 'Projects' },
              { icon: <ImageIcon size={14} />, val: libraryAssets.length, label: 'Library' }
            ].map((stat, i) => (
              <div key={i} className="bg-ivory p-6 text-center min-w-[120px] border border-black/5">
                <div className="flex items-center justify-center mb-2">
                  {stat.icon}
                </div>
                <p className="text-3xl font-black uppercase leading-none mb-1">{stat.val}</p>
                <p className="mono text-[9px] uppercase tracking-widest opacity-40">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 mb-12">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-10 py-4 font-mono text-[10px] uppercase font-bold flex items-center gap-4 transition-all ${
                activeTab === tab.id
                  ? 'bg-ink text-cream'
                  : 'bg-white border border-black/5 text-ink/40 hover:text-ink hover:bg-ivory'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`opacity-40`}>
                  ({tab.count})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'videos' && (
            <motion.div
              key="videos"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1"
            >
              {userTrailers.length === 0 ? (
                <div className="col-span-full bg-white border border-black/5 p-32 text-center">
                  <Film size={48} className="mx-auto mb-8 opacity-10" />
                  <p className="text-2xl font-black uppercase opacity-20 mb-12">
                    Studio empty. Select your first vision.
                  </p>
                  <button className="btn-primary py-4 px-12">
                     Create New Project
                  </button>
                </div>
              ) : (
                userTrailers.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white border border-black/5 p-1 group transition-all hover:bg-ivory"
                  >
                    <div className="aspect-video bg-ivory relative overflow-hidden mb-8">
                      {project.media?.[0]?.url ? (
                        <img
                          src={project.media[0].url}
                          alt="Thumbnail"
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 grayscale hover:grayscale-0 opacity-80"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film size={48} className="opacity-5" />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                           onClick={() => onLoadProject(project)}
                           className="w-16 h-16 bg-ink text-cream flex items-center justify-center shadow-2xl transform hover:scale-110 active:scale-95 transition-all"
                         >
                           <Play size={24} className="fill-cream ml-1" />
                         </button>
                      </div>
                    </div>
                    
                    <div className="px-6 pb-6">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex-1 cursor-pointer" onClick={() => onLoadProject(project)}>
                           <h4 className="text-xl font-black uppercase leading-tight mb-2 truncate">
                             {project.name}
                           </h4>
                           <div className="flex items-center gap-4 text-muted mono text-[10px] uppercase">
                             <span>{project.media?.length || 0} Scenes</span>
                             <span>•</span>
                             <span>{project.createdAt?.seconds
                                ? new Date(project.createdAt.seconds * 1000).toLocaleDateString()
                                : 'Unknown'}</span>
                           </div>
                        </div>
                        <button
                          onClick={() => onDeleteProject(project.id)}
                          className="p-3 text-ink/20 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      
                      <button 
                         onClick={() => onLoadProject(project)}
                         className="btn-outline w-full py-4 text-[10px]"
                      >
                         Open in Studio <ChevronRight size={14} className="ml-2" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'assets' && (
            <motion.div
              key="assets"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              {selectedAssets.size > 0 && (
                <div className="mb-8 p-6 bg-ivory border border-ink/10 flex items-center justify-between">
                  <p className="mono text-xs font-bold uppercase">
                    {selectedAssets.size} selected assets
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setSelectedAssets(new Set())}
                      className="mono text-[10px] uppercase hover:underline"
                    >
                      Deselect
                    </button>
                    <button
                      onClick={() => {
                        const assets = libraryAssets.filter((a) => selectedAssets.has(a.id));
                        onUseAssetInProject(assets);
                        setSelectedAssets(new Set());
                      }}
                      className="bg-ink text-cream px-8 py-3 mono text-[10px] uppercase"
                    >
                      Use in Studio
                    </button>
                  </div>
                </div>
              )}

              {libraryAssets.length === 0 ? (
                <div className="bg-white border border-black/5 p-32 text-center">
                  <ImageIcon size={48} className="mx-auto mb-8 opacity-10" />
                  <p className="text-2xl font-black uppercase opacity-20">
                    Collection Empty. Use 'Add Asset' in Create Mode.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1">
                  {libraryAssets.map((asset) => {
                    const isSelected = selectedAssets.has(asset.id);
                    return (
                      <div
                        key={asset.id}
                        onClick={() => toggleAssetSelection(asset.id)}
                        className={`relative aspect-square overflow-hidden group cursor-pointer border transition-all ${
                          isSelected
                            ? 'border-ink p-1'
                            : 'border-black/5 grayscale hover:grayscale-0'
                        }`}
                      >
                        {asset.type === 'video' ? (
                          <video src={asset.url} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={asset.url} className="w-full h-full object-cover" alt={asset.name} />
                        )}
                        
                        <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <p className="text-[9px] mono text-cream truncate w-full">
                            {asset.name}
                          </p>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteAsset(e, asset);
                          }}
                          className="absolute top-4 right-4 text-cream opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid lg:grid-cols-3 gap-1"
            >
              <div className="lg:col-span-2 space-y-1">
                <div className="bg-white border border-black/5 p-12 relative overflow-hidden">
                   <h3 className="text-3xl font-black uppercase mb-12 flex items-center gap-4">
                      Identity Profile
                   </h3>
                   <div className="grid sm:grid-cols-2 gap-8">
                      {[
                        { label: 'Name', val: user?.displayName },
                        { label: 'Email', val: user?.email },
                        { label: 'Platform', val: 'VibeTrailer Artist' },
                        { label: 'License', val: 'Commercial Elite' }
                      ].map((field, i) => (
                        <div key={i} className="border-b border-black/5 pb-4">
                           <p className="mono text-[10px] uppercase opacity-40 mb-2">{field.label}</p>
                           <p className="text-xl font-bold truncate">{field.val || '—'}</p>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="bg-ivory border border-black/5 p-12">
                   <h3 className="text-3xl font-black uppercase mb-12 flex items-center gap-4">
                      Credit Economy
                   </h3>
                   <div className="grid md:grid-cols-3 gap-8">
                      {[
                        { title: 'AI Synthesis', cost: '3 Credits', desc: 'SDF Morphing & Depth Analysis' },
                        { title: 'Project Build', cost: '1 Credit', desc: 'Choreography Mapping' },
                        { title: 'Elite Export', cost: '2 Credits', desc: '4K Pro-Res Simulation' }
                      ].map((item, i) => (
                        <div key={i} className="space-y-4">
                           <div className="border-b border-ink pb-4">
                              <p className="mono text-[10px] font-bold uppercase mb-1">{item.title}</p>
                              <p className="text-lg font-black uppercase">{item.cost}</p>
                           </div>
                           <p className="text-[10px] opacity-60 leading-relaxed font-sans">{item.desc}</p>
                        </div>
                      ))}
                   </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="bg-ivory p-12 text-center flex flex-col items-center border border-black/5">
                   <div className="w-20 h-20 bg-ink text-cream flex items-center justify-center mb-8">
                      <Coins size={32} />
                   </div>
                   <h3 className="mono text-[10px] font-bold uppercase opacity-40 mb-2">Available Credits</h3>
                   <p className="text-7xl font-black mb-12">{credits}</p>
                   <button 
                     onClick={onShowPricing}
                     className="btn-primary w-full py-5"
                   >
                     Buy More Credits
                   </button>
                </div>

                <div className="bg-white border border-black/5 p-12">
                   <h3 className="text-xl font-black uppercase mb-8">Recent Logs</h3>
                   <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-4">
                      {notifications.length === 0 ? (
                        <p className="mono text-[10px] opacity-20 uppercase">No internal notifications.</p>
                      ) : (
                        notifications.map((msg, idx) => (
                           <div key={idx} className="pb-4 border-b border-black/5 last:border-0">
                              <p className="mono text-[9px] font-bold uppercase text-ink leading-tight">{msg}</p>
                           </div>
                        ))
                      )}
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'admin' && isAdmin && (
             <motion.div
               key="admin"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 20 }}
             >
                <AdminDashboard />
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

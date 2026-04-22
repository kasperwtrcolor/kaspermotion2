import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Film, Image as ImageIcon, User as UserIcon, Trash2, Play, Coins, Calendar, Award, CreditCard, Sparkles, Zap, ChevronRight, Check } from 'lucide-react';

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

type ProfileTab = 'videos' | 'assets' | 'account';

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

  const tabs: { id: ProfileTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'videos', label: 'My Videos', icon: <Film size={16} />, count: userTrailers.length },
    { id: 'assets', label: 'My Assets', icon: <ImageIcon size={16} />, count: libraryAssets.length },
    { id: 'account', label: 'Account', icon: <UserIcon size={16} /> },
  ];

  const toggleAssetSelection = (id: string) => {
    setSelectedAssets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-mesh-gradient bg-dot-grid text-white font-sans selection:bg-indigo-500/30 pt-4">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        
        {/* Profile Header Block */}
        <div className="glass-panel p-8 rounded-3xl mb-12 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none" />
          
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-full border-2 border-indigo-500/30 overflow-hidden bg-gray-900 group-hover:scale-110 transition-transform duration-500">
              <img
                src={user?.photoURL || ''}
                className="w-full h-full object-cover"
                alt="Profile"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-indigo-500 border-2 border-[#09090b] flex items-center justify-center">
              <Award size={14} className="text-white" />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[10px] font-bold uppercase tracking-wider mb-3">
              Certified Designer
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
              {user?.displayName || 'Creative Visionary'}
            </h1>
            <p className="font-mono text-xs text-white/40 mt-2">
              {user?.email}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
            {[
              { icon: <Coins size={16} />, val: credits, label: 'Credits', color: 'text-indigo-400' },
              { icon: <Film size={16} />, val: userTrailers.length, label: 'Videos', color: 'text-purple-400' },
              { icon: <ImageIcon size={16} />, val: libraryAssets.length, label: 'Assets', color: 'text-pink-400' }
            ].map((stat, i) => (
              <div key={i} className="glass-panel-light p-4 rounded-2xl text-center min-w-[100px] border border-white/5">
                <div className={`flex items-center justify-center mb-1 ${stat.color}`}>
                  {stat.icon}
                </div>
                <p className="font-display text-2xl font-bold">{stat.val}</p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-3 mb-10 border-b border-white/5 pb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-full font-sans text-sm font-semibold flex items-center gap-3 transition-all active:scale-95 ${
                activeTab === tab.id
                  ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/20'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.id ? 'bg-white/20' : 'bg-white/5'}`}>
                  {tab.count}
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
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {userTrailers.length === 0 ? (
                <div className="col-span-full glass-panel p-20 text-center rounded-3xl">
                  <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                    <Film size={32} className="text-white/20" />
                  </div>
                  <p className="text-xl font-display font-medium text-white/40 mb-8">
                    Your studio is empty. Ready to craft your first trailer?
                  </p>
                  <button className="elite-button px-8 py-3 rounded-full font-bold">
                     Create New Project
                  </button>
                </div>
              ) : (
                userTrailers.map((project) => (
                  <div
                    key={project.id}
                    className="glass-panel group rounded-3xl overflow-hidden hover:border-indigo-500/30 transition-all duration-300 shadow-xl"
                  >
                    <div className="aspect-video bg-[#0c0c0e] relative overflow-hidden">
                      {project.media?.[0]?.url ? (
                        <img
                          src={project.media[0].url}
                          alt="Trailer thumbnail"
                          className="w-full h-full object-cover opacity-50 group-hover:scale-105 group-hover:opacity-60 transition-all duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film size={48} className="text-white/5" />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                           onClick={() => onLoadProject(project)}
                           className="w-14 h-14 rounded-full bg-indigo-500 flex items-center justify-center shadow-2xl text-white transform hover:scale-110 active:scale-95 transition-all"
                         >
                           <Play size={24} className="fill-white ml-1" />
                         </button>
                      </div>
                      
                      <div className="absolute top-4 right-4 glass-panel-light px-3 py-1 rounded-full font-mono text-[9px] font-bold tracking-widest text-white/60">
                        {project.media?.length || 0} SCENES
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 cursor-pointer" onClick={() => onLoadProject(project)}>
                           <h4 className="font-display font-bold text-lg tracking-tight mb-1 group-hover:text-indigo-400 transition-colors truncate">
                             {project.name}
                           </h4>
                           <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest flex items-center gap-2">
                             <Calendar size={12} className="text-white/20" />
                             {project.createdAt?.seconds
                               ? new Date(project.createdAt.seconds * 1000).toLocaleDateString()
                               : 'Unknown'}
                           </p>
                        </div>
                        <button
                          onClick={() => onDeleteProject(project.id)}
                          className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-white/30 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <button 
                         onClick={() => onLoadProject(project)}
                         className="w-full py-3 rounded-xl bg-white/5 border border-white/10 font-bold text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                      >
                         Open in Studio <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* MY ASSETS */}
          {activeTab === 'assets' && (
            <motion.div
              key="assets"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              {selectedAssets.size > 0 && (
                <motion.div 
                  initial={{ y: -20, opacity: 0 }} 
                  animate={{ y: 0, opacity: 1 }}
                  className="mb-8 p-4 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-between"
                >
                  <p className="font-sans text-sm font-bold text-white">
                    {selectedAssets.size} asset{selectedAssets.size > 1 ? 's' : ''} selected for export
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedAssets(new Set())}
                      className="px-4 py-2 rounded-xl bg-white/5 text-white/60 text-xs font-bold hover:bg-white/10"
                    >
                      Deselect
                    </button>
                    <button
                      onClick={() => {
                        const assets = libraryAssets.filter((a) => selectedAssets.has(a.id));
                        onUseAssetInProject(assets);
                        setSelectedAssets(new Set());
                      }}
                      className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-gray-100"
                    >
                      Use in Studio
                    </button>
                  </div>
                </motion.div>
              )}

              {libraryAssets.length === 0 ? (
                <div className="glass-panel p-20 text-center rounded-3xl">
                  <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                    <ImageIcon size={32} className="text-white/20" />
                  </div>
                  <p className="text-xl font-display font-medium text-white/40">
                    No assets found in your collection.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {libraryAssets.map((asset) => {
                    const isSelected = selectedAssets.has(asset.id);
                    return (
                      <div
                        key={asset.id}
                        onClick={() => toggleAssetSelection(asset.id)}
                        className={`relative aspect-square rounded-2xl overflow-hidden group cursor-pointer border transition-all duration-300 ${
                          isSelected
                            ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 scale-[0.98]'
                            : 'border-white/5 hover:border-white/20'
                        }`}
                      >
                        {asset.type === 'video' ? (
                          <video src={asset.url} className="w-full h-full object-cover opacity-80" muted />
                        ) : (
                          <img src={asset.url} className="w-full h-full object-cover opacity-80" alt={asset.name} />
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <p className="text-[10px] truncate w-full font-sans font-bold text-white/70">
                            {asset.name}
                          </p>
                        </div>
                        
                        <div className={`absolute top-3 left-3 w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                          isSelected ? 'bg-indigo-500 border-indigo-400' : 'bg-black/30 border-white/10 backdrop-blur-md'
                        }`}>
                          {isSelected && <Check size={14} className="text-white" />}
                        </div>
                        
                        <button
                          onClick={(e) => onDeleteAsset(e, asset)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:border-red-500/40 transition-all"
                        >
                          <Trash2 size={12} className="text-white" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ACCOUNT */}
          {activeTab === 'account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2 space-y-8">
                {/* Account Details */}
                <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-5">
                      <UserIcon size={120} />
                   </div>
                   <h3 className="text-xl font-display font-bold uppercase mb-8 flex items-center gap-3 text-white">
                      <UserIcon size={20} className="text-indigo-400" /> Account Identity
                   </h3>
                   <div className="grid sm:grid-cols-2 gap-6 relative z-10">
                      {[
                        { label: 'Display Name', val: user?.displayName },
                        { label: 'Email Address', val: user?.email },
                        { label: 'Login Provider', val: user?.providerData?.[0]?.providerId === 'google.com' ? 'Google' : user?.providerData?.[0]?.providerId },
                        { label: 'Account Created', val: 'May 12, 2025' }
                      ].map((field, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                           <p className="text-[10px] font-bold uppercase text-white/30 tracking-widest mb-1">{field.label}</p>
                           <p className="font-sans font-bold text-white truncate">{field.val || '—'}</p>
                        </div>
                      ))}
                   </div>
                </div>

                {/* Credit Economy Guide */}
                <div className="glass-panel p-8 rounded-3xl bg-indigo-600/5 border border-indigo-500/10">
                   <h3 className="text-xl font-display font-bold uppercase mb-8 flex items-center gap-3">
                      <Zap size={20} className="text-indigo-400" /> Credit Intelligence
                   </h3>
                   <div className="grid md:grid-cols-3 gap-6">
                      {[
                        { title: 'AI Synthesis', cost: '3 Pts', color: 'bg-blue-500/10 text-blue-400', desc: 'Craft high-fidelity cinematic assets from text.' },
                        { title: 'Project Build', cost: '1 Pt', color: 'bg-purple-500/10 text-purple-400', desc: 'Compile scenes and scripts into a master layout.' },
                        { title: 'Premium Render', cost: '2 Pts', color: 'bg-pink-500/10 text-pink-400', desc: 'High-bitrate 4K production export.' }
                      ].map((item, i) => (
                        <div key={i} className="space-y-3">
                           <div className={`flex justify-between items-center ${item.color} px-4 py-2 rounded-xl font-bold border border-white/5`}>
                              <span className="text-[10px] uppercase font-bold">{item.title}</span>
                              <span className="text-sm">{item.cost}</span>
                           </div>
                           <p className="text-[10px] text-white/40 font-medium leading-relaxed">{item.desc}</p>
                        </div>
                      ))}
                   </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* Balance Card */}
                <div className="glass-panel p-8 rounded-3xl text-center flex flex-col items-center border border-indigo-500/30 shadow-2xl shadow-indigo-500/10">
                   <div className="w-16 h-16 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-6">
                      <Coins size={32} className="text-indigo-400" />
                   </div>
                   <h3 className="text-lg font-display font-bold uppercase mb-1 tracking-tight">Available Balance</h3>
                   <p className="text-5xl font-display font-bold text-white mb-8">{credits}</p>
                   <button 
                     onClick={onShowPricing}
                     className="elite-button w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 group"
                   >
                     Get More Credits <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
                   </button>
                </div>

                {/* Daily Reward Notification */}
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <Zap size={20} className="text-indigo-400" />
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Active Reward</p>
                      <p className="font-sans font-bold text-sm text-white">+5 Credits Applied Today</p>
                   </div>
                </div>

                {/* Notifications List */}
                <div className="glass-panel p-8 rounded-3xl max-h-[400px] overflow-hidden flex flex-col">
                   <h3 className="text-lg font-display font-bold uppercase mb-6">Activity</h3>
                   <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 flex-1">
                      {notifications.length === 0 ? (
                        <p className="text-[10px] uppercase font-bold text-white/20">No recent activity logs.</p>
                      ) : (
                        notifications.map((msg, idx) => (
                           <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3">
                              <span className="text-indigo-500 font-bold mt-[-2px]">→</span>
                              <p className="text-[10px] font-bold uppercase text-white/60 leading-tight">{msg}</p>
                           </div>
                        ))
                      )}
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

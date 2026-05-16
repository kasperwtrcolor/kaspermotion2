import React, { useState } from 'react';
import { Play, Code, Layout, Settings, Share2, Download, Maximize2, Trash2, Wand2 } from 'lucide-react';

interface ArtifactWindowProps {
  children: React.ReactNode;
  title: string;
  compositions: any[];
  onExport?: () => void;
  onShare?: () => void;
  onAnimateScene?: (index: number) => void;
  onRemoveScene?: (index: number) => void;
}

export const ArtifactWindow: React.FC<ArtifactWindowProps> = ({ 
  children, 
  title, 
  compositions,
  onExport, 
  onShare,
  onAnimateScene,
  onRemoveScene
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'timeline'>('preview');

  return (
    <div className="flex flex-col h-full bg-[#f9fafb]">
      {/* Header */}
      <div className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{title}</h1>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeTab === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              Preview
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeTab === 'timeline' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              Timeline
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeTab === 'code' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              JSON
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onShare}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'preview' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-8">
             <div className="w-full max-w-4xl aspect-video bg-black rounded-2xl shadow-2xl overflow-hidden relative group">
                {children}
             </div>
          </div>
        )}
        
        {activeTab === 'timeline' && (
          <div className="p-6 h-full overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {compositions.map((comp, idx) => (
                 <div key={comp.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden group shadow-sm hover:shadow-md transition-all">
                    <div className="aspect-video bg-gray-100 relative">
                       {comp.url ? (
                         comp.isAnimated ? (
                           <video src={comp.url} className="w-full h-full object-cover" muted loop autoPlay />
                         ) : (
                           <img src={comp.url} className="w-full h-full object-cover" />
                         )
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-gray-300">
                           <Play className="w-12 h-12 opacity-10" />
                         </div>
                       )}
                       <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] text-white font-bold uppercase">
                         Scene {idx + 1}
                       </div>
                    </div>
                    <div className="p-4 space-y-3">
                       <p className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[40px]">{comp.caption || "No caption"}</p>
                       <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                          <div className="flex items-center gap-2">
                             <button 
                               onClick={() => onAnimateScene?.(idx)}
                               className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                               title="Animate with Veo"
                             >
                               <Wand2 className="w-4 h-4" />
                             </button>
                             <button 
                               onClick={() => onRemoveScene?.(idx)}
                               className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                               title="Delete Scene"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">5.0s</span>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'code' && (
          <div className="h-full bg-[#1e1e1e] p-4 font-mono text-sm text-gray-300 overflow-y-auto custom-scrollbar">
            <pre>{JSON.stringify(compositions, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

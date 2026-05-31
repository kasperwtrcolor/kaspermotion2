import React, { useState, useEffect } from 'react';
import { Save, Check, Bell, Sparkles } from 'lucide-react';

interface NotificationStackItem {
  app: string;
  title: string;
  desc: string;
}

interface NotificationStackEditorProps {
  composition: {
    id: string;
    caption?: string;
    notificationStack?: NotificationStackItem[];
  };
  onSave: (stack: NotificationStackItem[]) => void;
}

export const NotificationStackEditor: React.FC<NotificationStackEditorProps> = ({
  composition,
  onSave
}) => {
  const defaultTemplates = [
    { app: 'Stripe', title: 'Payment Received', desc: composition.caption ? `New customer: ${composition.caption} (+$49.00)` : 'New customer subscribed: Pro Plan' },
    { app: 'Product Hunt', title: 'Trending #1 Product', desc: '🚀 KasperMotion 2.0 reached 1,500+ upvotes!' },
    { app: 'Figma', title: 'Design Template Saved', desc: '💬 "The smooth 3D overlays are absolute fire!"' },
    { app: 'Discord', title: 'New Member Joined', desc: '✨ 250+ motion creators joined your Discord lounge!' },
  ];

  // Initialize local state with either existing stack or pre-populated default templates (No blanks!)
  const [localStack, setLocalStack] = useState<NotificationStackItem[]>(() => {
    if (composition.notificationStack && composition.notificationStack.length === 4) {
      // Ensure we don't have empty strings from previous saves
      return composition.notificationStack.map((item, idx) => ({
        app: item.app || defaultTemplates[idx].app,
        title: item.title || defaultTemplates[idx].title,
        desc: item.desc || defaultTemplates[idx].desc
      }));
    }
    return defaultTemplates;
  });

  const [isSaved, setIsSaved] = useState(false);

  // Sync state if composition ID or existing notificationStack changes externally
  useEffect(() => {
    if (composition.notificationStack && composition.notificationStack.length === 4) {
      setLocalStack(composition.notificationStack.map((item, idx) => ({
        app: item.app || defaultTemplates[idx].app,
        title: item.title || defaultTemplates[idx].title,
        desc: item.desc || defaultTemplates[idx].desc
      })));
    } else {
      setLocalStack(defaultTemplates);
    }
    setIsSaved(false);
  }, [composition.id, composition.notificationStack]);

  const updateCardField = (cardIdx: number, field: keyof NotificationStackItem, val: string) => {
    setLocalStack(prev => {
      const next = [...prev];
      next[cardIdx] = {
        ...next[cardIdx],
        [field]: val
      };
      return next;
    });
    setIsSaved(false); // Reset saved status on modification
  };

  const handleSave = () => {
    onSave(localStack);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2500);
  };

  return (
    <div className="w-full border-t border-black/5 pt-6 mt-2 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="mono text-[10px] uppercase font-black tracking-wider text-ink/40">Notification Stack Editor</span>
          <div className="h-[1px] w-24 bg-black/5" />
          <span className="mono text-[8px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded font-bold uppercase">Pre-populated</span>
        </div>
        
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 rounded text-xs font-black mono uppercase transition-all duration-300 transform active:scale-95 cursor-pointer ${
            isSaved 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
              : 'bg-ink text-white hover:bg-ink/80 hover:shadow-lg shadow-black/10'
          }`}
        >
          {isSaved ? (
            <>
              <Check size={14} className="animate-bounce" />
              Saved & Applied!
            </>
          ) : (
            <>
              <Save size={14} />
              Save & Apply Notifications
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {localStack.map((cardData, cardIdx) => {
          return (
            <div key={cardIdx} className="bg-white p-5 border border-black/5 rounded-xl space-y-4 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex justify-between items-center pb-2 border-b border-black/5">
                <span className="mono text-[9px] font-black uppercase text-ink/70 flex items-center gap-2">
                  <span className="w-4 h-4 bg-ink/5 rounded-full flex items-center justify-center text-[8px]">{cardIdx + 1}</span>
                  Notification Card #{cardIdx + 1}
                </span>
                <span className="mono text-[8px] opacity-40 font-bold uppercase">{cardData.app || 'Custom'} preset</span>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                  <label className="mono text-[8px] font-bold text-ink/40 uppercase mb-1 block">App Preset</label>
                  <select
                    value={['stripe', 'product hunt', 'figma', 'discord', 'facebook', 'twitter', 'instagram', 'youtube', 'slack', 'linkedin'].includes((cardData.app || '').toLowerCase()) ? cardData.app : 'Custom'}
                    onChange={(e) => {
                      if (e.target.value !== 'Custom') {
                        updateCardField(cardIdx, 'app', e.target.value);
                      }
                    }}
                    className="bg-white border border-black/10 rounded px-2 py-2 text-xs font-semibold outline-none focus:border-ink w-full transition-colors"
                  >
                    <option value="Stripe">Stripe Presets</option>
                    <option value="Product Hunt">Product Hunt Presets</option>
                    <option value="Figma">Figma Presets</option>
                    <option value="Discord">Discord Presets</option>
                    <option value="Facebook">Facebook Presets</option>
                    <option value="Twitter">X / Twitter Presets</option>
                    <option value="Instagram">Instagram Presets</option>
                    <option value="YouTube">YouTube Presets</option>
                    <option value="Slack">Slack Presets</option>
                    <option value="LinkedIn">LinkedIn Presets</option>
                    <option value="Custom">Custom / Other</option>
                  </select>
                </div>

                <div className="flex-1 min-w-0">
                  <label className="mono text-[8px] font-bold text-ink/40 uppercase mb-1 block">App Name</label>
                  <input
                    type="text"
                    value={cardData.app}
                    placeholder="e.g. Stripe, Custom"
                    onChange={(e) => updateCardField(cardIdx, 'app', e.target.value)}
                    className="bg-white border border-black/10 rounded px-2.5 py-2 text-xs font-semibold outline-none focus:border-ink w-full transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="mono text-[8px] font-bold text-ink/40 uppercase">Title</label>
                <input
                  type="text"
                  value={cardData.title}
                  placeholder="Notification Header"
                  onChange={(e) => updateCardField(cardIdx, 'title', e.target.value)}
                  className="bg-white border border-black/10 rounded px-3 py-2 text-xs font-semibold outline-none focus:border-ink w-full transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="mono text-[8px] font-bold text-ink/40 uppercase">Description Message</label>
                <input
                  type="text"
                  value={cardData.desc}
                  placeholder="Notification content message"
                  onChange={(e) => updateCardField(cardIdx, 'desc', e.target.value)}
                  className="bg-white border border-black/10 rounded px-3 py-2 text-xs font-semibold outline-none focus:border-ink w-full transition-colors"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg text-xs font-black mono uppercase transition-all duration-300 transform active:scale-95 cursor-pointer shadow-md ${
            isSaved 
              ? 'bg-emerald-600 text-white shadow-emerald-500/20' 
              : 'bg-ink text-white hover:bg-ink/90 hover:shadow-lg'
          }`}
        >
          {isSaved ? (
            <>
              <Check size={14} className="animate-bounce" />
              Changes Saved & Applied Successfully!
            </>
          ) : (
            <>
              <Save size={14} />
              Save & Apply Notifications
            </>
          )}
        </button>
      </div>
    </div>
  );
};

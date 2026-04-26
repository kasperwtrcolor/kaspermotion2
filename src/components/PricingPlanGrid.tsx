import React from 'react';
import { Check, Zap, Sparkles, TrendingUp } from 'lucide-react';

interface PricingPlanGridProps {
  onPurchase?: (tier: string) => void;
}

const PricingPlanGrid: React.FC<PricingPlanGridProps> = ({ onPurchase }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Basic */}
      <div className="bg-ivory border border-transparent hover:border-ink transition-all p-8 flex flex-col group hover:-translate-y-2">
        <h4 className="text-xl font-bold uppercase mb-1">Basic</h4>
        <p className="mono text-[10px] text-muted mb-8">Perfect for exploring</p>
        <div className="text-5xl font-black mb-2 uppercase">$5</div>
        <p className="mono text-[10px] text-muted mb-8">/ one-time</p>
        
        <ul className="flex-1 space-y-3 mb-10">
          {['50 Generator Credits', 'HD Quality Export', 'Standard AI Queue', 'All Text Effects'].map(f => (
            <li key={f} className="flex items-center gap-2 text-xs font-medium uppercase tracking-tight">
              <Check size={14} className="text-ink opacity-40" /> {f}
            </li>
          ))}
        </ul>

        <button 
          onClick={() => onPurchase?.('basic')}
          className="btn-outline w-full"
        >
          Select Plan
        </button>
      </div>

      {/* Elite */}
      <div className="bg-ink text-cream p-8 flex flex-col relative group hover:-translate-y-2 transition-transform">
        <div className="absolute top-0 right-0 bg-white text-ink px-3 py-1 text-[8px] font-bold uppercase">Popular</div>
        <h4 className="text-xl font-bold uppercase mb-1">Elite Choice</h4>
        <p className="mono text-[10px] opacity-60 mb-8">Standard Choice</p>
        <div className="text-5xl font-black mb-2 uppercase">$12</div>
        <p className="mono text-[10px] opacity-60 mb-8">/ one-time</p>
        
        <ul className="flex-1 space-y-3 mb-10">
          {['150 Generator Credits', '4K Quality Export', 'Priority AI Queue', 'Cinematic Presets'].map(f => (
            <li key={f} className="flex items-center gap-2 text-xs font-medium uppercase tracking-tight">
              <Sparkles size={14} className="text-cream opacity-40" /> {f}
            </li>
          ))}
        </ul>

        <button 
          onClick={() => onPurchase?.('elite')}
          className="bg-cream text-ink border border-transparent font-bold uppercase py-3 transition-all hover:bg-white"
        >
          Select Plan
        </button>
      </div>

      {/* Pro */}
      <div className="bg-ivory border border-transparent hover:border-ink transition-all p-8 flex flex-col group hover:-translate-y-2">
        <h4 className="text-xl font-bold uppercase mb-1">Pro</h4>
        <p className="mono text-[10px] text-muted mb-8">Elite tier for full production</p>
        <div className="text-5xl font-black mb-2 uppercase">$30</div>
        <p className="mono text-[10px] text-muted mb-8">/ one-time</p>
        
        <ul className="flex-1 space-y-3 mb-10">
          {['500 Generator Credits', 'Unlimited 4K Exports', 'Instant AI Generation', 'Commercial License'].map(f => (
            <li key={f} className="flex items-center gap-2 text-xs font-medium uppercase tracking-tight">
              <Zap size={14} className="text-ink opacity-40" /> {f}
            </li>
          ))}
        </ul>

        <button 
          onClick={() => onPurchase?.('pro')}
          className="btn-outline w-full"
        >
          Select Plan
        </button>
      </div>

      {/* Agency */}
      <div className="bg-ivory border border-transparent border-dashed p-8 flex flex-col items-center justify-center text-center hover:border-solid hover:border-ink transition-all">
        <TrendingUp size={32} className="mb-4 opacity-40" />
        <h4 className="text-xl font-bold uppercase mb-2">Agency Solutions</h4>
        <p className="mono text-[10px] text-muted mb-6">Order 1,000+ credits for your team.</p>
        <button 
          className="btn-outline w-full"
        >
          Buy Bulk Credits
        </button>
      </div>
    </div>
  );
};

export default PricingPlanGrid;

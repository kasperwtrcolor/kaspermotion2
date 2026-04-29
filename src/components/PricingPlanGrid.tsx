import React, { useState } from 'react';
import { Check, Zap } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

const getApiUrl = (path: string) => {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  return `${baseUrl}${path}`;
};

interface PricingPlanGridProps {
  onPurchase?: (tier: string) => void;
  user?: any;
}

const PricingPlanGrid: React.FC<PricingPlanGridProps> = ({ onPurchase, user }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      onPurchase?.('credits');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/create-checkout-session'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          credits: 30,
          amount: 5,
        }),
      });
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received from server.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-ink text-cream p-10 hover:-translate-y-1 transition-transform">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <div className="text-6xl font-black">$5</div>
            <p className="mono text-[10px] opacity-60 mt-1">one-time payment</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black">30</div>
            <p className="mono text-[10px] opacity-60 mt-1">credits</p>
          </div>
        </div>
        
        <ul className="space-y-3 mb-10 border-t border-white/10 pt-8">
          {[
            'HD & 4K Quality Export',
            'All Text Effects & Transitions',
            'AI Director & Script Generation',
            'Cinematic Presets & Backgrounds',
            'Commercial License Included',
            'No Monthly Recurring Fees'
          ].map(f => (
            <li key={f} className="flex items-center gap-3 text-xs font-medium uppercase tracking-tight">
              <Check size={14} className="text-cream opacity-40" /> {f}
            </li>
          ))}
        </ul>

        <button 
          onClick={handleCheckout}
          disabled={isLoading}
          className="w-full bg-cream text-ink border border-transparent font-black uppercase py-4 transition-all hover:bg-white disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
          ) : (
            <><Zap size={18} fill="currentColor" /> Get 30 Credits</>
          )}
        </button>
      </div>
    </div>
  );
};

export default PricingPlanGrid;

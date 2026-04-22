import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, CreditCard, Zap, Award, Check } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const pricingTiers = [
  { 
    id: 'Basic', 
    credits: 50, 
    amount: 5, 
    color: 'from-blue-500/10 to-indigo-500/10', 
    accent: 'text-blue-400',
    description: 'Perfect for exploring cinematic styles.',
    features: ['50 Generator Credits', 'HD Quality Export', 'All Text Effects', 'Community Support']
  },
  { 
    id: 'Standard', 
    credits: 150, 
    amount: 12, 
    color: 'from-indigo-500/20 to-purple-500/20', 
    accent: 'text-indigo-400',
    popular: true, 
    description: 'Most popular for serious vibe coders.',
    features: ['150 Generator Credits', '4K Quality Export', 'Priority AI Queue', 'Discord Access', 'Custom Branding']
  },
  { 
    id: 'Pro', 
    credits: 500, 
    amount: 30, 
    color: 'from-purple-500/20 to-pink-500/20', 
    accent: 'text-purple-400',
    description: 'Elite tier for full production trailers.',
    features: ['500 Generator Credits', 'Unlimited 4K Exports', 'Early Feature Access', '1-on-1 Support', 'Commercial License']
  }
];

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export default function PricingModal({ isOpen, onClose, user }: PricingModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBuyCredits = async (tier: typeof pricingTiers[0]) => {
    if (!user) return;
    
    setIsProcessing(true);
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          credits: tier.credits,
          amount: tier.amount
        }),
      });

      const session = await response.json();
      if (session.error) throw new Error(session.error);

      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (result.error) throw new Error(result.error.message);
    } catch (err: any) {
      console.error('Payment Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className="glass-panel w-full max-w-5xl p-6 md:p-10 relative mt-auto mb-auto overflow-hidden rounded-3xl"
          >
            <div className="absolute inset-0 bg-mesh-gradient opacity-30 pointer-events-none" />
            
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all z-10"
              disabled={isProcessing}
            >
              <X size={20} />
            </button>

            <div className="text-center mb-12 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                <Sparkles size={12} />
                Refill Your Stash
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">Upgrade Your Status</h2>
              <p className="font-sans text-sm font-medium text-white/50 max-w-md mx-auto">Choose a high-performance package to keep the cinematic vibes flowing.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              {pricingTiers.map((tier) => (
                <div 
                  key={tier.id}
                  className={`glass-panel p-8 flex flex-col relative transition-all rounded-3xl ${tier.popular ? 'border-indigo-500/50 shadow-2xl shadow-indigo-500/10' : ''}`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-widest">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-6">
                    <h4 className="font-display text-2xl font-bold">{tier.id}</h4>
                    <p className="text-[10px] uppercase font-bold text-white/40 leading-tight mt-1">{tier.description}</p>
                  </div>
                  
                  <div className={`bg-gradient-to-br ${tier.color} rounded-2xl py-8 text-center mb-6 border border-white/5`}>
                    <p className={`font-display text-6xl font-bold ${tier.accent}`}>{tier.credits}</p>
                    <p className="font-mono text-xs font-bold uppercase tracking-widest opacity-40">Credits</p>
                  </div>

                  <div className="text-center mb-8">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="font-display text-4xl font-bold">${tier.amount}</span>
                      <span className="text-white/40 text-xs font-bold uppercase tracking-widest">one-time</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleBuyCredits(tier)}
                    disabled={isProcessing}
                    className={`elite-button w-full py-4 text-sm font-bold flex items-center justify-center gap-2 rounded-xl transition-all ${tier.popular ? 'bg-indigo-500' : 'bg-white/10 hover:bg-white/20 border border-white/10'} disabled:opacity-50`}
                  >
                    {isProcessing ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>Get Now <Sparkles size={16} /></>
                    )}
                  </button>

                  <div className="mt-8 space-y-3 border-t border-white/5 pt-6">
                     <p className="text-[10px] font-bold uppercase flex items-center gap-2 text-white/60">
                       <Zap size={12} className="text-indigo-400" /> Instant Activation
                     </p>
                     <p className="text-[10px] font-bold uppercase flex items-center gap-2 text-white/60">
                       <Award size={12} className="text-purple-400" /> Priority Queue
                     </p>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-center mt-12 font-mono text-[10px] uppercase text-white/40 font-bold max-w-md mx-auto leading-relaxed relative z-10">
              Secure payments powered by Stripe. Your credits never expire and are tied to your account.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PricingPlans({ onSelect, isProcessing }: { onSelect: (tier: any) => void, isProcessing?: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {pricingTiers.map((tier) => (
        <div 
          key={tier.id}
          className={`glass-panel p-10 flex flex-col relative transition-all rounded-3xl hover:scale-[1.02] ${tier.popular ? 'border-indigo-500/50 shadow-2xl shadow-indigo-500/10' : ''}`}
        >
          {tier.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-4 py-1.5 rounded-full font-mono text-xs font-bold uppercase tracking-widest whitespace-nowrap">
              Elite Choice
            </div>
          )}
          
          <div className="mb-8">
            <h4 className="font-display text-3xl font-bold tracking-tight">{tier.id}</h4>
            <p className="text-[11px] uppercase font-bold text-white/40 leading-tight mt-1">{tier.description}</p>
          </div>
          
          <div className={`bg-gradient-to-br ${tier.color} rounded-2xl py-10 text-center mb-8 border border-white/5`}>
            <p className={`font-display text-7xl font-bold tracking-tighter ${tier.accent}`}>{tier.credits}</p>
            <p className="font-mono text-sm font-bold uppercase tracking-widest opacity-40">Credits</p>
          </div>

          <div className="mb-10">
            <div className="flex items-baseline gap-1 mb-10">
              <span className="font-display text-5xl font-bold">${tier.amount}</span>
              <span className="text-white/40 text-xs font-bold uppercase tracking-[0.2em]">/ one-time</span>
            </div>
            
            <ul className="space-y-4">
              {tier.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-4 text-[11px] font-bold uppercase text-white/70">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
                    <Check size={12} className="text-indigo-400" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <button 
            onClick={() => onSelect(tier)}
            disabled={isProcessing}
            className={`elite-button w-full mt-auto py-5 text-xl font-bold flex items-center justify-center gap-3 rounded-2xl transition-all ${tier.popular ? 'bg-indigo-500' : 'bg-white/10 hover:bg-white/20 border border-white/10'} disabled:opacity-50`}
          >
            {isProcessing ? (
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Select Plan <Sparkles size={24} /></>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

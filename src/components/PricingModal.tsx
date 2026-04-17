import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, CreditCard, Zap, Award } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const pricingTiers = [
  { 
    id: 'Basic', 
    credits: 50, 
    amount: 5, 
    color: 'bg-brutal-blue', 
    description: 'Perfect for exploring cinematic styles.',
    features: ['50 Generator Credits', 'HD Quality Export', 'All Text Effects', 'Community Support']
  },
  { 
    id: 'Standard', 
    credits: 150, 
    amount: 12, 
    color: 'bg-brutal-green', 
    popular: true, 
    description: 'Most popular for serious vibe coders.',
    features: ['150 Generator Credits', '4K Quality Export', 'Priority AI Queue', 'Discord Access', 'Custom Branding']
  },
  { 
    id: 'Pro', 
    credits: 500, 
    amount: 30, 
    color: 'bg-brutal-orange', 
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
    if (!user) return; // Should be handled by parent or shown sign-in
    
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
          className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className="bg-isometric-grid brutal-border w-full max-w-5xl p-6 md:p-10 relative mt-auto mb-auto"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 brutal-border bg-white hover:bg-brutal-pink transition-colors z-10"
              disabled={isProcessing}
            >
              <X size={20} />
            </button>

            <div className="text-center mb-12">
              <div className="inline-block bg-brutal-orange brutal-border px-3 py-1 mb-4 font-mono text-xs font-bold uppercase transform -rotate-1">
                Refill Your Stash
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tighter mb-2">Upgrade Your Status</h2>
              <p className="font-mono text-sm font-bold uppercase text-black/60">Choose a package to keep the cinematic vibes flowing</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pricingTiers.map((tier) => (
                <div 
                  key={tier.id}
                  className={`bg-white brutal-border p-6 flex flex-col relative transition-transform hover:-translate-y-1 ${tier.popular ? 'ring-4 ring-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]' : 'shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'}`}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black text-white px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-4">
                    <h4 className="font-display text-2xl font-bold uppercase">{tier.id}</h4>
                    <p className="font-mono text-[10px] uppercase font-bold text-black/50 leading-tight mt-1">{tier.description}</p>
                  </div>
                  
                  <div className={`${tier.color} brutal-border py-8 text-center mb-6`}>
                    <p className="font-display text-6xl font-bold">{tier.credits}</p>
                    <p className="font-mono text-xs font-bold uppercase tracking-widest opacity-60">Credits</p>
                  </div>

                  <div className="text-center mb-8">
                    <p className="font-display text-4xl font-bold">${tier.amount}</p>
                    <p className="font-mono text-[10px] uppercase font-bold text-black/40">One-time payment</p>
                  </div>

                  <button 
                    onClick={() => handleBuyCredits(tier)}
                    disabled={isProcessing}
                    className={`brutal-button w-full py-4 font-display font-bold text-xl flex items-center justify-center gap-3 ${tier.color} disabled:opacity-50`}
                  >
                    {isProcessing ? (
                      <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>Get Now <Sparkles size={20} /></>
                    )}
                  </button>

                  <div className="mt-6 space-y-3 border-t-2 border-black/10 pt-4">
                     <p className="font-mono text-[10px] font-bold uppercase flex items-center gap-2">
                       <Zap size={12} className="text-brutal-orange" /> Instant Activation
                     </p>
                     <p className="font-mono text-[10px] font-bold uppercase flex items-center gap-2">
                       <Award size={12} className="text-brutal-green" /> Priority Support
                     </p>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-center mt-12 font-mono text-[10px] uppercase text-black/60 font-bold max-w-md mx-auto leading-relaxed">
              Secure payments powered by Stripe. Your credits don't expire and are tied to your VibeTrailer account.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Also export just the tiers for use in LandingPage
export function PricingPlans({ onSelect, isProcessing }: { onSelect: (tier: any) => void, isProcessing?: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {pricingTiers.map((tier) => (
        <div 
          key={tier.id}
          className={`bg-white brutal-border p-8 flex flex-col relative transition-all hover:shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 ${tier.popular ? 'ring-4 ring-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] z-10' : 'shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]'}`}
        >
          {tier.popular && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-widest whitespace-nowrap">
              Vibe Choice
            </div>
          )}
          
          <div className="mb-6">
            <h4 className="font-display text-3xl font-bold uppercase tracking-tighter">{tier.id}</h4>
            <p className="font-mono text-[10px] uppercase font-bold text-black/50 leading-tight mt-1">{tier.description}</p>
          </div>
          
          <div className={`${tier.color} brutal-border py-8 text-center mb-6`}>
            <p className="font-display text-7xl font-bold tracking-tighter">{tier.credits}</p>
            <p className="font-mono text-sm font-bold uppercase tracking-widest opacity-60">Credits</p>
          </div>

          <div className="mb-8">
            <div className="flex items-baseline gap-1 mb-8">
              <span className="font-display text-5xl font-bold">${tier.amount}</span>
              <span className="font-mono text-xs font-bold text-black/40 uppercase">/ one-time</span>
            </div>
            
            <ul className="space-y-3">
              {tier.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 font-mono text-[11px] font-bold uppercase">
                  <div className="w-4 h-4 bg-brutal-green brutal-border flex items-center justify-center shrink-0">
                    <span className="text-[10px]">✓</span>
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <button 
            onClick={() => onSelect(tier)}
            disabled={isProcessing}
            className={`brutal-button w-full mt-auto py-5 font-display font-bold text-2xl flex items-center justify-center gap-3 ${tier.color} disabled:opacity-50`}
          >
            {isProcessing ? (
              <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Select {tier.id} <Sparkles size={24} /></>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

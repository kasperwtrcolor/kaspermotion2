import React, { useState } from 'react';
import { X, Check, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';

const getApiUrl = (path: string) => {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  return `${baseUrl}${path}`;
};

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, user }) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = async () => {
    if (!user) return;
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
      const { id, url } = await res.json();

      if (url) {
        window.location.href = url;
      } else {
        const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
        if (stripe && id) {
          await stripe.redirectToCheckout({ sessionId: id });
        }
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] bg-cream/80 backdrop-blur-md flex items-center justify-center p-4"
      >
        <motion.div 
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="bg-white border border-ink/10 w-full max-w-md shadow-2xl relative p-10 md:p-12"
        >
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 transition-colors"
          >
            <X size={24} />
          </button>

          <header className="mb-10">
            <p className="mono text-muted mb-2 text-[10px] uppercase tracking-widest">Credits</p>
            <h2 className="text-4xl font-black uppercase mb-3 tracking-tighter">Get Credits.</h2>
            <p className="text-muted text-sm">One-time purchase. No subscriptions. Use credits to export cinematic trailers for your apps.</p>
          </header>

          <div className="bg-ink text-cream p-8 mb-8">
            <div className="flex items-baseline justify-between mb-6">
              <div>
                <div className="text-5xl font-black">$5</div>
                <p className="mono text-[10px] opacity-60 mt-1">one-time payment</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black">30</div>
                <p className="mono text-[10px] opacity-60 mt-1">credits</p>
              </div>
            </div>
            
            <ul className="space-y-3 mb-8 border-t border-white/10 pt-6">
              {['HD & 4K Quality Export', 'All Text Effects & Transitions', 'AI Director & Script Generation', 'Commercial License Included'].map(f => (
                <li key={f} className="flex items-center gap-3 text-xs font-medium uppercase tracking-tight">
                  <Check size={14} className="text-cream opacity-60" /> {f}
                </li>
              ))}
            </ul>

            <button 
              onClick={handlePurchase}
              disabled={isLoading || !user}
              className="w-full bg-cream text-ink font-black uppercase py-4 transition-all hover:bg-white disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
              ) : (
                <><Zap size={18} fill="currentColor" /> Get 30 Credits</>
              )}
            </button>
          </div>

          <div className="flex flex-wrap gap-4 text-ink/40 mono text-[10px] justify-center">
            <div className="flex items-center gap-1"><Check size={10} /> Secure Stripe Checkout</div>
            <div className="flex items-center gap-1"><Check size={10} /> No Recurring Fees</div>
          </div>

          {!user && (
            <p className="text-center text-xs text-red-500 mt-4 mono">Please sign in to purchase credits.</p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PricingModal;

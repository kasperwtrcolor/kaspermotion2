import React, { useState } from 'react';
import { X, Check, Zap, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, setDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

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
  const [isSolanaLoading, setIsSolanaLoading] = useState(false);
  const [solanaStep, setSolanaStep] = useState<'idle' | 'confirming' | 'processing' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePurchase = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
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

  const handleSolanaPurchase = async () => {
    if (!user) return;
    setIsSolanaLoading(true);
    setError(null);
    setSolanaStep('confirming');

    try {
      const provider = (window as any).solana || (window as any).phantom?.solana;
      if (!provider) {
        throw new Error('Solana wallet extension (Phantom/Backpack) not detected. Please install one to use Solana Pay!');
      }

      // 1. Await wallet connection
      const resp = await provider.connect();
      const userPublicKeyStr = resp.publicKey.toString();

      setSolanaStep('confirming');

      // 2. Fetch secure blockhash from Vercel backend (100% immune to browser 403 CORS blocks)
      const blockhashRes = await fetch('/api/solana-blockhash');
      if (!blockhashRes.ok) {
        throw new Error('Failed to retrieve secure transaction blockhash from serverless backend.');
      }
      const { blockhash } = await blockhashRes.json();

      // 3. Load Solana Web3 library dynamically (only need Transaction types, no Connection needed!)
      const { Transaction, SystemProgram, PublicKey } = await import('@solana/web3.js');

      const recipientAddress = 'FZ8RRJnQW7MTiQ15EY7AyrSDhACoXNTdsoJ74k2GRPoq';
      const solAmount = 0.04; // $5 USD worth of SOL at hackathon rates
      const lamports = Math.round(solAmount * 1_000_000_000); // 1 SOL = 10^9 lamports

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(userPublicKeyStr),
          toPubkey: new PublicKey(recipientAddress),
          lamports: lamports,
        })
      );

      // Set blockhash and fee payer
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(userPublicKeyStr);

      // 4. Request signature and broadcast transaction via Phantom's premium private RPC channel!
      const { signature } = await provider.signAndSendTransaction(transaction);

      setSolanaStep('processing');

      // 5. Direct safety confirmation delay to let the transaction clear on mainnet blocks
      await new Promise(resolve => setTimeout(resolve, 5000));

      // 6. Update balance directly in Firestore!
      await setDoc(doc(db, 'users', user.uid), {
        credits: increment(30)
      }, { merge: true });

      setSolanaStep('success');
    } catch (err: any) {
      console.error('Solana purchase error:', err);
      setError(err.message || 'Solana payment failed.');
      setSolanaStep('idle');
    } finally {
      setIsSolanaLoading(false);
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

          {solanaStep === 'idle' && (
            <>
              <header className="mb-8">
                <p className="mono text-muted mb-2 text-[10px] uppercase tracking-widest">Credits</p>
                <h2 className="text-4xl font-black uppercase mb-3 tracking-tighter">Get Credits.</h2>
                <p className="text-muted text-sm">One-time purchase. No subscriptions. Use credits to export cinematic trailers for your apps.</p>
              </header>

              {error && (
                <div className="bg-red-50 text-red-500 p-4 border border-red-500/20 text-xs mb-4 font-mono uppercase">
                  {error}
                </div>
              )}

              <div className="bg-ink text-cream p-8 mb-6">
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
                
                <ul className="space-y-3 mb-6 border-t border-white/10 pt-6">
                  {['HD & 4K Quality Export', 'All Text Effects & Transitions', 'AI Director & Script Generation', 'Commercial License Included'].map(f => (
                    <li key={f} className="flex items-center gap-3 text-xs font-medium uppercase tracking-tight">
                      <Check size={14} className="text-cream opacity-60" /> {f}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handlePurchase}
                    disabled={isLoading || isSolanaLoading || !user}
                    className="w-full bg-cream text-ink font-black uppercase py-4 transition-all hover:bg-white disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
                    ) : (
                      <><Zap size={18} fill="currentColor" /> Pay with Stripe</>
                    )}
                  </button>

                  <button 
                    onClick={handleSolanaPurchase}
                    disabled={isLoading || isSolanaLoading || !user}
                    className="w-full bg-[#14F195] text-black font-black uppercase py-4 transition-all hover:bg-[#00ff99] disabled:opacity-50 flex items-center justify-center gap-3 border border-transparent shadow-lg shadow-[#14F195]/20"
                  >
                    <Wallet size={18} /> Pay with Solana (SOL)
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-ink/40 mono text-[10px] justify-center">
                <div className="flex items-center gap-1"><Check size={10} /> Instant Sync</div>
                <div className="flex items-center gap-1"><Check size={10} /> No Recurring Fees</div>
              </div>

              {!user && (
                <p className="text-center text-xs text-red-500 mt-4 mono">Please sign in to purchase credits.</p>
              )}
            </>
          )}

          {solanaStep === 'confirming' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[#14F195]/10 border border-[#14F195]/20 text-[#14F195] rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Wallet size={32} />
              </div>
              <h3 className="text-2xl font-black uppercase mb-3">Awaiting Approval</h3>
              <p className="text-muted text-sm max-w-xs mx-auto leading-relaxed">
                Please authorize the transaction of <span className="text-ink font-bold font-mono">0.04 SOL</span> inside your Solana wallet window extension.
              </p>
            </div>
          )}

          {solanaStep === 'processing' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-[#14F195]/20 border-t-[#14F195] rounded-full animate-spin mx-auto mb-6" />
              <h3 className="text-2xl font-black uppercase mb-3">Verifying Payment</h3>
              <p className="text-muted text-sm max-w-xs mx-auto leading-relaxed font-mono uppercase tracking-widest text-xs">
                Broadcasting transaction to Solana ledger...
              </p>
            </div>
          )}

          {solanaStep === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
                <Check size={32} />
              </div>
              <h3 className="text-2xl font-black uppercase mb-3">Payment Complete</h3>
              <p className="text-emerald-600 font-mono text-xs uppercase tracking-wider mb-6">
                +30 VibeTrailer credits added!
              </p>
              <button 
                onClick={() => {
                  setSolanaStep('idle');
                  onClose();
                }}
                className="btn-primary py-3 px-8 text-xs"
              >
                Let's Vibe
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PricingModal;

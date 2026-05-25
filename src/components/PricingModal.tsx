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
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    
    const checkConnection = async () => {
      try {
        const provider = (window as any).solana || (window as any).phantom?.solana;
        if (provider) {
          // Check if already connected (eager connection)
          if (provider.publicKey) {
            setConnectedWallet(provider.publicKey.toString());
          }
          
          // Listen to account changes
          provider.on('accountChanged', (publicKey: any) => {
            if (publicKey) {
              setConnectedWallet(publicKey.toString());
            } else {
              setConnectedWallet(null);
            }
          });
        }
      } catch (e) {
        console.warn('Failed to check eager wallet connection:', e);
      }
    };
    
    checkConnection();
    
    return () => {
      const provider = (window as any).solana || (window as any).phantom?.solana;
      if (provider) {
        provider.removeAllListeners?.('accountChanged');
      }
    };
  }, [isOpen]);

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

  const handleDisconnectWallet = async () => {
    setError(null);
    try {
      const provider = (window as any).solana || (window as any).phantom?.solana;
      if (provider) {
        await provider.disconnect();
      }
      setConnectedWallet(null);
    } catch (err: any) {
      console.error('Disconnect error:', err);
      setConnectedWallet(null);
    }
  };

  const handleConnectWallet = async () => {
    setError(null);
    setIsSolanaLoading(true);
    try {
      const provider = (window as any).solana || (window as any).phantom?.solana;
      if (!provider) {
        throw new Error('Solana wallet extension (Phantom/Backpack) not detected. Please install one!');
      }
      const resp = await provider.connect();
      setConnectedWallet(resp.publicKey.toString());
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet.');
    } finally {
      setIsSolanaLoading(false);
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

      // 1. Always retrieve the absolute latest active public key from the provider to support extension-level account switching
      let activeWallet = provider.publicKey ? provider.publicKey.toString() : null;
      if (!activeWallet) {
        const resp = await provider.connect();
        activeWallet = resp.publicKey.toString();
      }
      if (activeWallet !== connectedWallet) {
        setConnectedWallet(activeWallet);
      }
      const userPublicKeyStr = activeWallet;

      setSolanaStep('confirming');

      // 2. Load Solana Web3 library dynamically first
      const { Transaction, TransactionInstruction, PublicKey } = await import('@solana/web3.js');

      const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
      const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
      const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5AcWH25jdwGsxAuGs');

      const senderKey = new PublicKey(userPublicKeyStr);
      const recipientOwnerKey = new PublicKey('FZ8RRJnQW7MTiQ15EY7AyrSDhACoXNTdsoJ74k2GRPoq');

      // Derive Associated Token Accounts (ATA)
      const getAssociatedTokenAddress = (mint: any, owner: any) => {
        const [address] = PublicKey.findProgramAddressSync(
          [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
          ASSOCIATED_TOKEN_PROGRAM_ID
        );
        return address;
      };

      const recipientATA = getAssociatedTokenAddress(USDC_MINT, recipientOwnerKey);
      const senderATA = getAssociatedTokenAddress(USDC_MINT, senderKey);

      // 3. Fetch secure blockhash, check USDC balance, and check recipient ATA existence server-side (100% immune to browser 403 CORS blocks!)
      let blockhash = '';
      let balance = 0;
      let balanceExists = false;
      let recipientAtaExists = false;

      try {
        console.log(`[PricingModal] Fetching blockhash, balance, and recipient ATA existence for Wallet: ${userPublicKeyStr}`);
        const blockhashRes = await fetch(`/api/solana-blockhash?ata=${senderATA.toString()}&recipientAta=${recipientATA.toString()}`);
        if (blockhashRes.ok) {
          const data = await blockhashRes.json();
          blockhash = data.blockhash;
          balance = Number(data.balance || 0);
          balanceExists = !!data.balanceExists;
          recipientAtaExists = !!data.recipientAtaExists;
          console.log(`[PricingModal] Backend reported: balance = ${balance} USDC, exists = ${balanceExists}, recipientExists = ${recipientAtaExists}`);
        } else {
          console.warn('Backend blockhash fetch returned non-ok status.');
        }
      } catch (err) {
        console.warn('Backend blockhash fetch failed:', err);
      }

      if (!blockhash) {
        throw new Error('Failed to retrieve secure transaction blockhash from serverless backend.');
      }

      // Check balance - allow proceeding if balance is verified, or fail if we proved balance < 5
      if (balanceExists && balance < 5) {
        throw new Error(`Insufficient USDC balance. Your wallet has ${balance.toFixed(2)} USDC, but 5.00 USDC is required.`);
      }

      const transaction = new Transaction();

      // Prepend instruction to create the recipient's ATA if it doesn't exist
      if (!recipientAtaExists) {
        console.log('Recipient USDC Associated Token Account does not exist. Prepending ATA creation instruction...');
        const SYSTEM_PROGRAM_ID = new PublicKey('11111111111111111111111111111111');
        const RENT_SYSVAR_ID = new PublicKey('SysvarRent111111111111111111111111111111111');

        const createAtaInstruction = new TransactionInstruction({
          keys: [
            { pubkey: senderKey, isSigner: true, isWritable: true },
            { pubkey: recipientATA, isSigner: false, isWritable: true },
            { pubkey: recipientOwnerKey, isSigner: false, isWritable: false },
            { pubkey: USDC_MINT, isSigner: false, isWritable: false },
            { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: RENT_SYSVAR_ID, isSigner: false, isWritable: false }
          ],
          programId: ASSOCIATED_TOKEN_PROGRAM_ID,
          data: new Uint8Array(0)
        });
        transaction.add(createAtaInstruction);
      }

      // Build browser-safe little-endian 64-bit integer buffer for 5 USDC (5,000,000 units, 6 decimals)
      const amount = 5000000;
      const data = new Uint8Array(10);
      data[0] = 12; // SPL TransferChecked instruction index
      
      let temp = BigInt(amount);
      for (let i = 1; i <= 8; i++) {
        data[i] = Number(temp & BigInt(0xff));
        temp = temp >> BigInt(8);
      }
      data[9] = 6; // Decimals for USDC (6)

      const transferInstruction = new TransactionInstruction({
        keys: [
          { pubkey: senderATA, isSigner: false, isWritable: true },
          { pubkey: USDC_MINT, isSigner: false, isWritable: false },
          { pubkey: recipientATA, isSigner: false, isWritable: true },
          { pubkey: senderKey, isSigner: true, isWritable: false }
        ],
        programId: TOKEN_PROGRAM_ID,
        data: data
      });

      transaction.add(transferInstruction);

      // Set blockhash and fee payer
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = senderKey;

      // 6. Request signature and broadcast transaction via Phantom's premium private RPC channel
      const { signature } = await provider.signAndSendTransaction(transaction);

      setSolanaStep('processing');

      // 7. Securely verify signature status on the Solana ledger before applying credits (100% server-side via Helius!)
      console.log(`[PricingModal] Polling backend to confirm transaction: ${signature}`);
      let txConfirmed = false;
      let checkAttempts = 0;
      const maxAttempts = 20; // 20 attempts * 2 seconds = 40 seconds max timeout
      let txErrorDetail = '';

      while (checkAttempts < maxAttempts && !txConfirmed) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        checkAttempts++;
        
        try {
          console.log(`[PricingModal] Checking signature status on backend (Attempt ${checkAttempts}/${maxAttempts})...`);
          const response = await fetch(`/api/solana-confirm?signature=${signature}`);
          if (response.ok) {
            const data = await response.json();
            if (data.error) {
              txErrorDetail = typeof data.error === 'object' ? JSON.stringify(data.error) : String(data.error);
              throw new Error(`Transaction failed on-chain: ${txErrorDetail}`);
            }
            if (data.confirmed) {
              txConfirmed = true;
              break;
            }
          } else {
            console.warn(`[PricingModal] Backend signature confirmation returned non-ok status: ${response.status}`);
          }
        } catch (e: any) {
          console.warn('[PricingModal] Failed to verify signature status via backend:', e);
          if (e.message && e.message.includes('Transaction failed on-chain')) {
            throw e;
          }
        }
      }

      if (!txConfirmed) {
        throw new Error('Transaction confirmation timed out. Please check your wallet history to verify if the payment succeeded.');
      }

      // 8. Update balance directly in Firestore (Only after 100% verified on-chain confirmation!)
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

                  {connectedWallet ? (
                    <>
                      <div className="flex flex-col gap-2 p-4 bg-white/5 border border-white/10 text-xs rounded-sm mb-1 text-left">
                        <div className="flex items-center justify-between text-cream/70">
                          <span className="mono uppercase tracking-widest text-[9px] opacity-60">Connected Solana Wallet</span>
                          <button 
                            type="button"
                            onClick={handleDisconnectWallet}
                            className="text-red-400 hover:text-red-300 font-bold uppercase text-[9px] tracking-wider transition-colors cursor-pointer"
                          >
                            Disconnect
                          </button>
                        </div>
                        <div className="font-mono text-cream font-bold truncate text-xs select-all" title={connectedWallet}>
                          {connectedWallet.substring(0, 8)}...{connectedWallet.substring(connectedWallet.length - 8)}
                        </div>
                      </div>

                      <button 
                        type="button"
                        onClick={handleSolanaPurchase}
                        disabled={isLoading || isSolanaLoading || !user}
                        className="w-full bg-[#14F195] text-black font-black uppercase py-4 transition-all hover:bg-[#00ff99] disabled:opacity-50 flex items-center justify-center gap-3 border border-transparent shadow-lg shadow-[#14F195]/20 cursor-pointer"
                      >
                        <Zap size={18} fill="currentColor" /> Confirm & Pay 5 USDC
                      </button>
                    </>
                  ) : (
                    <button 
                      type="button"
                      onClick={handleConnectWallet}
                      disabled={isLoading || isSolanaLoading || !user}
                      className="w-full bg-[#14F195]/20 hover:bg-[#14F195]/30 text-[#14F195] border border-[#14F195]/30 font-black uppercase py-4 transition-all disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
                    >
                      <Wallet size={18} /> Connect Solana Wallet
                    </button>
                  )}
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
                Please authorize the transaction of <span className="text-ink font-bold font-mono">5 USDC</span> inside your Solana wallet window extension.
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

import React, { useState, useEffect, useCallback } from 'react';
import { X, Check, Zap, Wallet, RefreshCw, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, setDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

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

  // Helper to get the Phantom/Backpack provider
  const getProvider = useCallback(() => {
    return (window as any).phantom?.solana || (window as any).solana || null;
  }, []);

  // Sync wallet state with the actual provider on modal open and account changes
  useEffect(() => {
    if (!isOpen) return;

    const provider = getProvider();
    if (!provider) return;

    // Read the current public key if already connected
    if (provider.isConnected && provider.publicKey) {
      setConnectedWallet(provider.publicKey.toString());
    }

    // Listen for account switches inside the wallet extension
    const onAccountChanged = (pubkey: any) => {
      if (pubkey) {
        setConnectedWallet(pubkey.toString());
      } else {
        // User switched to an account that hasn't approved this site
        setConnectedWallet(null);
      }
    };

    const onDisconnect = () => {
      setConnectedWallet(null);
    };

    provider.on('accountChanged', onAccountChanged);
    provider.on('disconnect', onDisconnect);

    return () => {
      try {
        provider.removeListener('accountChanged', onAccountChanged);
        provider.removeListener('disconnect', onDisconnect);
      } catch (_) { /* ignore */ }
    };
  }, [isOpen, getProvider]);

  if (!isOpen) return null;

  // ─── Stripe purchase ──────────────────────────────────────────────
  const handlePurchase = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, credits: 30, amount: 5 }),
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

  // ─── Wallet connect / disconnect / change ─────────────────────────
  const handleConnectWallet = async () => {
    setError(null);
    setIsSolanaLoading(true);
    try {
      const provider = getProvider();
      if (!provider) {
        throw new Error('Solana wallet not found. Please install Phantom or Backpack.');
      }
      const resp = await provider.connect();
      setConnectedWallet(resp.publicKey.toString());
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet.');
    } finally {
      setIsSolanaLoading(false);
    }
  };

  const handleDisconnectWallet = async () => {
    setError(null);
    try {
      const provider = getProvider();
      if (provider) {
        await provider.disconnect();
      }
    } catch (_) { /* ignore */ }
    setConnectedWallet(null);
  };

  const handleChangeWallet = async () => {
    setError(null);
    setIsSolanaLoading(true);
    try {
      const provider = getProvider();
      if (!provider) {
        throw new Error('Solana wallet not found.');
      }
      // Disconnect first, then reconnect to force the wallet selection popup
      await provider.disconnect();
      setConnectedWallet(null);
      const resp = await provider.connect();
      setConnectedWallet(resp.publicKey.toString());
    } catch (err: any) {
      setError(err.message || 'Failed to change wallet.');
    } finally {
      setIsSolanaLoading(false);
    }
  };

  // ─── Solana USDC purchase ─────────────────────────────────────────
  const handleSolanaPurchase = async () => {
    if (!user) return;
    setIsSolanaLoading(true);
    setError(null);
    setSolanaStep('confirming');

    try {
      const provider = getProvider();
      if (!provider) {
        throw new Error('Solana wallet not found. Please install Phantom or Backpack.');
      }

      // 1. Get the live public key from the provider (not from React state)
      let walletPubkey: string;
      if (provider.isConnected && provider.publicKey) {
        walletPubkey = provider.publicKey.toString();
      } else {
        const resp = await provider.connect();
        walletPubkey = resp.publicKey.toString();
      }

      // Sync React state
      if (walletPubkey !== connectedWallet) {
        setConnectedWallet(walletPubkey);
      }

      console.log(`[PricingModal] Using wallet: ${walletPubkey}`);

      // 2. Load Solana Web3 library
      const { Transaction, TransactionInstruction, PublicKey } = await import('@solana/web3.js');

      const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
      const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
      const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5AcWH25jdwGsxAuGs');

      const senderKey = new PublicKey(walletPubkey);
      const recipientOwnerKey = new PublicKey('FZ8RRJnQW7MTiQ15EY7AyrSDhACoXNTdsoJ74k2GRPoq');

      // Derive recipient ATA (deterministic, always correct)
      const [recipientATA] = PublicKey.findProgramAddressSync(
        [recipientOwnerKey.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), USDC_MINT.toBuffer()],
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // 3. Ask the backend to: get blockhash, discover sender's actual USDC account, check recipient ATA
      //    We send the WALLET ADDRESS, and the backend uses getTokenAccountsByOwner to find the real USDC account
      console.log(`[PricingModal] Calling backend with wallet=${walletPubkey}`);
      const blockhashRes = await fetch(`/api/solana-blockhash?wallet=${walletPubkey}&recipientAta=${recipientATA.toString()}`);

      if (!blockhashRes.ok) {
        const errData = await blockhashRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to connect to Solana network.');
      }

      const backendData = await blockhashRes.json();
      const { blockhash, balance, balanceExists, senderATA: backendSenderATA, recipientAtaExists } = backendData;

      console.log(`[PricingModal] Backend response: blockhash=${blockhash}, balance=${balance}, senderATA=${backendSenderATA}, recipientExists=${recipientAtaExists}`);

      if (!blockhash) {
        throw new Error('Failed to get blockhash from Solana network.');
      }

      // 4. Validate balance
      if (balanceExists && balance < 5) {
        throw new Error(`Insufficient USDC balance. Your wallet (${walletPubkey.slice(0, 4)}...${walletPubkey.slice(-4)}) has ${balance.toFixed(2)} USDC, but 5.00 USDC is required.`);
      }

      // 5. Determine the sender ATA to use in the transfer instruction
      //    Use the one the backend discovered, or fall back to the standard derived one
      let senderATAKey: InstanceType<typeof PublicKey>;
      if (backendSenderATA) {
        senderATAKey = new PublicKey(backendSenderATA);
      } else {
        // Derive the standard ATA as fallback
        const [derivedATA] = PublicKey.findProgramAddressSync(
          [senderKey.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), USDC_MINT.toBuffer()],
          ASSOCIATED_TOKEN_PROGRAM_ID
        );
        senderATAKey = derivedATA;
      }

      // 6. Build the transaction
      const transaction = new Transaction();

      // Create recipient ATA if needed
      if (!recipientAtaExists) {
        console.log('[PricingModal] Prepending CreateAssociatedTokenAccount for recipient');
        const SYSTEM_PROGRAM_ID = new PublicKey('11111111111111111111111111111111');
        const RENT_SYSVAR_ID = new PublicKey('SysvarRent111111111111111111111111111111111');
        transaction.add(new TransactionInstruction({
          keys: [
            { pubkey: senderKey, isSigner: true, isWritable: true },
            { pubkey: recipientATA, isSigner: false, isWritable: true },
            { pubkey: recipientOwnerKey, isSigner: false, isWritable: false },
            { pubkey: USDC_MINT, isSigner: false, isWritable: false },
            { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: RENT_SYSVAR_ID, isSigner: false, isWritable: false },
          ],
          programId: ASSOCIATED_TOKEN_PROGRAM_ID,
          data: new Uint8Array(0),
        }));
      }

      // SPL TransferChecked: 5 USDC = 5_000_000 (6 decimals)
      const amount = 5_000_000;
      const data = new Uint8Array(10);
      data[0] = 12; // TransferChecked instruction index
      let temp = BigInt(amount);
      for (let i = 1; i <= 8; i++) {
        data[i] = Number(temp & BigInt(0xff));
        temp = temp >> BigInt(8);
      }
      data[9] = 6; // USDC decimals

      transaction.add(new TransactionInstruction({
        keys: [
          { pubkey: senderATAKey, isSigner: false, isWritable: true },
          { pubkey: USDC_MINT, isSigner: false, isWritable: false },
          { pubkey: recipientATA, isSigner: false, isWritable: true },
          { pubkey: senderKey, isSigner: true, isWritable: false },
        ],
        programId: TOKEN_PROGRAM_ID,
        data,
      }));

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = senderKey;

      // 7. Sign and send via the wallet extension
      const { signature } = await provider.signAndSendTransaction(transaction);
      console.log(`[PricingModal] Transaction sent: ${signature}`);

      setSolanaStep('processing');

      // 8. Confirm via backend (server-side Helius RPC)
      let txConfirmed = false;
      for (let attempt = 1; attempt <= 25; attempt++) {
        await new Promise(r => setTimeout(r, 2000));
        try {
          const confirmRes = await fetch(`/api/solana-confirm?signature=${signature}`);
          if (confirmRes.ok) {
            const confirmData = await confirmRes.json();
            if (confirmData.error) {
              throw new Error(`Transaction failed on-chain: ${JSON.stringify(confirmData.error)}`);
            }
            if (confirmData.confirmed) {
              txConfirmed = true;
              break;
            }
          }
        } catch (e: any) {
          if (e.message?.includes('Transaction failed on-chain')) throw e;
          console.warn(`[PricingModal] Confirm attempt ${attempt} failed:`, e);
        }
      }

      if (!txConfirmed) {
        throw new Error('Transaction confirmation timed out. Please check your wallet history.');
      }

      // 9. Credit the user
      await setDoc(doc(db, 'users', user.uid), { credits: increment(30) }, { merge: true });

      setSolanaStep('success');
    } catch (err: any) {
      console.error('Solana purchase error:', err);
      setError(err.message || 'Solana payment failed.');
      setSolanaStep('idle');
    } finally {
      setIsSolanaLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────
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
                <div className="bg-red-50 text-red-500 p-4 border border-red-500/20 text-xs mb-4 font-mono">
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
                  {/* Stripe button */}
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

                  {/* Solana wallet section */}
                  {connectedWallet ? (
                    <>
                      {/* Connected wallet card */}
                      <div className="flex flex-col gap-2 p-4 bg-white/5 border border-white/10 text-xs rounded-sm mb-1 text-left">
                        <div className="flex items-center justify-between text-cream/70">
                          <span className="mono uppercase tracking-widest text-[9px] opacity-60">Connected Wallet</span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={handleChangeWallet}
                              disabled={isSolanaLoading}
                              className="text-[#14F195] hover:text-[#00ff99] font-bold uppercase text-[9px] tracking-wider transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                            >
                              <RefreshCw size={10} /> Change
                            </button>
                            <button
                              type="button"
                              onClick={handleDisconnectWallet}
                              className="text-red-400 hover:text-red-300 font-bold uppercase text-[9px] tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <LogOut size={10} /> Disconnect
                            </button>
                          </div>
                        </div>
                        <div className="font-mono text-cream font-bold truncate text-xs select-all" title={connectedWallet}>
                          {connectedWallet.substring(0, 6)}...{connectedWallet.substring(connectedWallet.length - 6)}
                        </div>
                      </div>

                      {/* Pay button */}
                      <button
                        type="button"
                        onClick={handleSolanaPurchase}
                        disabled={isLoading || isSolanaLoading || !user}
                        className="w-full bg-[#14F195] text-black font-black uppercase py-4 transition-all hover:bg-[#00ff99] disabled:opacity-50 flex items-center justify-center gap-3 border border-transparent shadow-lg shadow-[#14F195]/20 cursor-pointer"
                      >
                        {isSolanaLoading ? (
                          <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                          <><Zap size={18} fill="currentColor" /> Confirm & Pay 5 USDC</>
                        )}
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
                Please authorize the transaction of <span className="text-ink font-bold font-mono">5 USDC</span> inside your Solana wallet extension.
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

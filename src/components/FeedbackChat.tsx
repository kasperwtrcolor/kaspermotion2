import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface FeedbackChatProps {
  user?: { uid: string; email: string } | null;
}

type FeedbackType = 'bug' | 'feature' | 'feedback';

const feedbackTypes: { value: FeedbackType; label: string }[] = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'feedback', label: 'General Feedback' },
];

const FeedbackChat: React.FC<FeedbackChatProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('feedback');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'feedback'), {
        type,
        message: message.trim(),
        email: email.trim() || null,
        userId: user?.uid || null,
        userEmail: user?.email || null,
        status: 'new',
        createdAt: serverTimestamp(),
      });

      setShowThankYou(true);
      setMessage('');
      setEmail('');
      setType('feedback');

      setTimeout(() => {
        setShowThankYou(false);
        setIsOpen(false);
      }, 2200);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9998] w-14 h-14 rounded-full bg-ink text-cream flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
        aria-label={isOpen ? 'Close feedback' : 'Send feedback'}
        style={{
          opacity: isOpen ? 0 : 1,
          pointerEvents: isOpen ? 'none' : 'auto',
          transform: isOpen ? 'scale(0.8)' : 'scale(1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <MessageSquare size={22} />
      </button>

      {/* Chat Panel */}
      <div
        className="fixed bottom-6 right-6 z-[9998]"
        style={{
          width: '350px',
          maxHeight: '450px',
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(16px)',
          transformOrigin: 'bottom right',
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="bg-cream rounded-2xl shadow-2xl border border-black/5 overflow-hidden flex flex-col" style={{ maxHeight: '450px' }}>
          {/* Header */}
          <div className="bg-ink text-cream px-5 py-4 flex items-center justify-between">
            <div>
              <h3 className="font-black uppercase text-sm tracking-wide">Send Feedback</h3>
              <p className="mono text-[10px] text-cream/60 mt-0.5">We&apos;d love to hear from you</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-cream/60 hover:text-cream transition-colors p-1 rounded-lg hover:bg-white/10"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {showThankYou ? (
              /* Thank You State */
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="w-14 h-14 rounded-full bg-ink text-cream flex items-center justify-center mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h4 className="font-black uppercase text-sm">Thank You!</h4>
                <p className="mono text-xs text-black/50 mt-1 text-center">
                  Your feedback has been submitted.
                </p>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Type Selector */}
                <div>
                  <label className="font-black uppercase text-[10px] tracking-wider text-black/40 block mb-2">
                    Type
                  </label>
                  <div className="flex gap-2">
                    {feedbackTypes.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setType(value)}
                        className={`mono text-[11px] px-3 py-1.5 rounded-full border transition-all duration-200 ${
                          type === value
                            ? 'bg-ink text-cream border-ink'
                            : 'bg-transparent text-black/60 border-black/10 hover:border-black/30'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="font-black uppercase text-[10px] tracking-wider text-black/40 block mb-2">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what's on your mind..."
                    rows={4}
                    className="w-full bg-ivory border border-black/10 p-3 mono text-xs rounded-lg resize-none focus:outline-none focus:border-black/30 transition-colors placeholder:text-black/30"
                    required
                  />
                </div>

                {/* Email */}
                {!user && (
                  <div>
                    <label className="font-black uppercase text-[10px] tracking-wider text-black/40 block mb-2">
                      Email <span className="normal-case font-normal">(optional)</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full bg-ivory border border-black/10 p-3 mono text-xs rounded-lg focus:outline-none focus:border-black/30 transition-colors placeholder:text-black/30"
                    />
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!message.trim() || isSubmitting}
                  className="w-full bg-ink text-cream font-black uppercase py-3 px-6 rounded-lg text-xs tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="mono">Sending...</span>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Submit Feedback</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default FeedbackChat;

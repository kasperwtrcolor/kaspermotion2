import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'vibetrailer_cookie_consent';

const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      setVisible(true);
      // Trigger slide-up animation after mount
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimateIn(true);
        });
      });
    }
  }, []);

  const handleChoice = (choice: 'accepted' | 'declined') => {
    localStorage.setItem(STORAGE_KEY, choice);
    setAnimateIn(false);
    // Wait for slide-down animation to finish before unmounting
    setTimeout(() => setVisible(false), 400);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        padding: '16px',
        pointerEvents: 'none',
        transform: animateIn ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          background: 'rgba(18, 18, 18, 0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px 28px',
          pointerEvents: 'auto',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Header */}
        <p
          className="font-black uppercase"
          style={{
            fontSize: '11px',
            letterSpacing: '0.12em',
            color: 'rgba(255, 255, 255, 0.45)',
            marginBottom: '8px',
          }}
        >
          Cookies
        </p>

        {/* Body */}
        <p
          className="mono"
          style={{
            fontSize: '13px',
            lineHeight: 1.6,
            color: 'rgba(255, 255, 255, 0.65)',
            marginBottom: '20px',
          }}
        >
          We use cookies to analyse traffic and remember your preferences so
          vibetrailer.fun works better for you.
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => handleChoice('accepted')}
            className="font-black uppercase"
            style={{
              background: '#FAF5EF',
              color: '#121212',
              fontSize: '11px',
              letterSpacing: '0.08em',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Accept All
          </button>

          <button
            onClick={() => handleChoice('declined')}
            className="font-bold uppercase"
            style={{
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.55)',
              fontSize: '11px',
              letterSpacing: '0.08em',
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              cursor: 'pointer',
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.55)';
            }}
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;

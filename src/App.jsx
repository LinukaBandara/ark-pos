import React, { useState } from 'react';
import { LayoutGrid, ShoppingCart, ChevronRight, Delete } from 'lucide-react';
import ArkPosOwnerApp from './ArkPosOwnerApp';
import ArkPosCheckout from './ArkPosCheckout';

const C = {
  bg: '#151515',
  panel: '#1E1E1E',
  panelAlt: '#242424',
  cardBorder: 'rgba(255,255,255,0.08)',
  lime: '#EAFB5D',
  limeSoft: 'rgba(234,251,93,0.12)',
  ink: '#151515',
  text: '#FBFBFB',
  muted: '#9A9A9A',
  faint: '#6E6E6E',
  danger: '#E08A6B',
};

const SCREENS = [
  { key: 'dashboard', label: 'Dashboard', sub: 'Overview, inventory, purchasing, alerts — everything in one sidebar', icon: LayoutGrid },
  { key: 'pos', label: 'POS Checkout', sub: 'The register — barcode, cart, payment', icon: ShoppingCart },
];

// ---- PIN login: any 4 digits work for this prototype, same "any non-empty
// credential works" rule as before — but a PIN pad is what a real cashier
// register actually uses, not an email/password form.
function PinLogin({ onLogin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [exiting, setExiting] = useState(false);

  function press(key) {
    if (exiting) return;
    if (key === 'back') { setPin(p => p.slice(0, -1)); setError(''); return; }
    if (pin.length >= 4) return;
    const next = pin + key;
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => {
        setExiting(true);
        setTimeout(onLogin, 300);
      }, 150);
    }
  }

  // real physical keyboard support: digit keys type into the PIN,
  // Backspace deletes, matching what the on-screen pad already does
  React.useEffect(() => {
    function handleKey(e) {
      if (e.key >= '0' && e.key <= '9') press(e.key);
      else if (e.key === 'Backspace') press('back');
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [pin, exiting]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 font-sans transition-opacity duration-300"
      style={{ background: C.bg, color: C.text, minHeight: '100dvh', opacity: exiting ? 0 : 1 }}
    >
      <div className="w-full max-w-xs text-center transition-all duration-300" style={{ transform: exiting ? 'scale(0.96)' : 'scale(1)', opacity: exiting ? 0 : 1 }}>
        <div className="text-2xl font-extrabold mb-1">ARK <span style={{ color: C.lime }}>POS</span></div>
        <div className="text-xs mb-8" style={{ color: C.faint }}>Enter your 4-digit PIN — Nova Mart</div>

        <div className="flex justify-center gap-3 mb-8">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="rounded-full transition-all"
              style={{
                width: 14, height: 14,
                background: i < pin.length ? C.lime : 'transparent',
                border: `1.5px solid ${i < pin.length ? C.lime : C.cardBorder}`,
              }}
            />
          ))}
        </div>
        <div className="text-xs h-4 mb-4" style={{ color: C.danger }}>{error}</div>

        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'].map((k, i) => (
            k === '' ? <div key={i} /> : (
              <button
                key={i}
                onClick={() => press(k)}
                className="rounded-2xl font-bold text-xl flex items-center justify-center transition active:scale-95"
                style={{ height: 60, background: C.panel, border: `1px solid ${C.cardBorder}`, color: C.text }}
              >
                {k === 'back' ? <Delete size={19} /> : k}
              </button>
            )
          ))}
        </div>
        <a
          href="https://www.ark-ii.studio"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs font-semibold mt-6 pt-4 border-t"
          style={{ color: C.lime, borderColor: C.cardBorder }}
        >
          Built by ARK II
        </a>
      </div>
    </div>
  );
}

// This chooser exists because one build needs to preview two different
// apps. A real deployment skips it — after PIN login, an owner goes
// straight to the dashboard, a cashier goes straight to checkout, based on
// their actual role, not a manual pick.
function ScreenSelect({ onSelect }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 font-sans" style={{ background: C.bg, color: C.text, minHeight: '100dvh' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-2xl font-extrabold mb-1">ARK <span style={{ color: C.lime }}>POS</span></div>
          <div className="text-xs" style={{ color: C.faint }}>Where do you want to go?</div>
        </div>
        <div className="flex flex-col gap-3">
          {SCREENS.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                onClick={() => onSelect(s.key)}
                className="flex items-center gap-4 p-4 rounded-2xl text-left transition"
                style={{ background: C.panel, border: `1px solid ${C.cardBorder}` }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: C.limeSoft }}>
                  <Icon size={19} strokeWidth={1.7} style={{ color: C.lime }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold">{s.label}</div>
                  <div className="text-xs" style={{ color: C.faint }}>{s.sub}</div>
                </div>
                <ChevronRight size={16} style={{ color: C.faint }} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [screen, setScreen] = useState(null);

  function logout() {
    setLoggedIn(false);
    setScreen(null);
  }

  if (!loggedIn) return <PinLogin onLogin={() => setLoggedIn(true)} />;
  if (!screen) return <ScreenSelect onSelect={setScreen} />;

  const back = () => setScreen(null);

  if (screen === 'dashboard') return <ArkPosOwnerApp onSwitchRole={back} onLogout={logout} />;
  if (screen === 'pos') return <ArkPosCheckout onSwitchRole={back} onLogout={logout} />;
  return null;
}

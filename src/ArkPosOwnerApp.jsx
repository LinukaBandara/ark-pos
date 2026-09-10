import React, { useState, useEffect, useRef } from 'react';
import {
  Home, Boxes, ShoppingBag, Bell, UserRound, Building2, Sparkles,
  AlertTriangle, TrendingDown, PackageX, DollarSign, ChevronDown,
  LogOut, Users, CreditCard, Settings, Check
} from 'lucide-react';

/* ==========================================================
   All brand colors / blur radii / precise sizes live here and
   get applied via inline `style`, never via Tailwind bracket
   classes like bg-[#EAFB5D] — those need a JIT compiler this
   artifact runtime doesn't run, so they silently render as
   nothing. Every className below uses ONLY standard, pre-built
   Tailwind utilities (flex, grid, p-4, rounded-2xl, text-sm...).
   ========================================================== */
const C = {
  bg: '#0a0b0c',
  ink: '#141516',
  card: 'rgba(255,255,255,0.06)',
  cardHover: 'rgba(255,255,255,0.10)',
  cardBorder: 'rgba(255,255,255,0.12)',
  lime: '#EAFB5D',
  limeSoft: 'rgba(234,251,93,0.12)',
  limeBorder: 'rgba(234,251,93,0.28)',
  slate: '#6b7080',
  text: '#F5F6F3',
  muted: 'rgba(245,246,243,0.55)',
  faint: 'rgba(245,246,243,0.35)',
  danger: '#E08A6B',
  dangerSoft: 'rgba(224,138,107,0.14)',
};

const branchData = {
  Colombo: {
    sales: [62, 58, 71, 66, 80, 94, 88], avgBill: 747, margin: 19.2,
    revenue: 12842500, orderCount: 6482, goalPct: 71, goalTarget: 15000000,
    salesTrend: [310, 340, 298, 365, 402, 388, 420, 445, 410, 460, 452, 478, 495, 512],
    topProducts: [
      { name: 'Milk 1L', week: [3, 5, 4, 6, 8, 9, 7] },
      { name: 'Cola 1.5L', week: [2, 3, 5, 4, 7, 9, 8] },
      { name: 'Rice 5kg', week: [4, 4, 3, 5, 5, 6, 4] },
      { name: 'Noodles', week: [6, 7, 8, 6, 9, 9, 10] },
      { name: 'Sugar 1kg', week: [3, 2, 4, 3, 5, 4, 6] },
    ],
    aiFinding: "Beverage sales rose 23% today vs. yesterday.",
    aiDetail: "Consider increasing tomorrow's beverage order by roughly 15% — Cola 1.5L and Ginger Beer are both trending toward their reorder level.",
    expiring: [
      { name: 'Milk 1L', sub: 'Expires in 4 days', value: 'Rs. 6,120' },
      { name: 'Yoghurt Cup', sub: 'Expires in 3 days', value: 'Rs. 3,360' },
      { name: 'White Bread', sub: 'Expires in 2 days', value: 'Rs. 1,440' },
    ],
    dead: [
      { name: 'Shampoo Sachet', sub: 'Idle 52 days', value: 'Rs. 162' },
      { name: 'Talcum Powder', sub: 'Idle 61 days', value: 'Rs. 2,400' },
      { name: 'Specialty Herbal Tea', sub: 'Idle 73 days', value: 'Rs. 6,460' },
    ],
    attention: [
      { icon: 'expiry', title: '12 products expiring this week', sub: 'Rs. 10,920 at risk' },
      { icon: 'lowstock', title: '7 products below reorder level', sub: 'Restock recommended' },
      { icon: 'dead', title: 'Rs. 84,000 tied up in dead stock', sub: '31 idle products' },
      { icon: 'cash', title: "Cash variance on yesterday's close", sub: 'Balangoda register', value: 'Rs. 3,500' },
    ],
    orders: [
      { name: 'ABC Distributors', sub: 'Milk, Bread, Soft Drinks — 8 days coverage', cost: 'Rs. 74,500' },
      { name: 'Ceylon Fresh Supplies', sub: 'Dairy restock — 6 days coverage', cost: 'Rs. 21,300' },
    ],
    alerts: [
      { icon: 'expiry', title: '12 products expiring this week', time: 'Just now', unread: true },
      { icon: 'lowstock', title: '3 purchase orders pending approval', time: '2 hours ago', unread: true },
      { icon: 'cash', title: 'Cashier B flagged for review', time: 'Yesterday', unread: true },
      { icon: 'expiry', title: '5 unread owner messages', time: 'Yesterday', unread: true },
      { icon: 'check', title: 'Dead stock report generated', time: '2 days ago', unread: false },
    ],
  },
  Balangoda: {
    sales: [40, 44, 38, 52, 60, 58, 63], avgBill: 612, margin: 17.5,
    revenue: 4210000, orderCount: 2450, goalPct: 52, goalTarget: 6000000,
    salesTrend: [118, 130, 112, 140, 128, 135, 149, 152, 140, 158, 151, 162, 168, 175],
    topProducts: [
      { name: 'Rice 5kg', week: [4, 3, 5, 4, 6, 7, 5] },
      { name: 'Cooking Oil', week: [3, 4, 3, 5, 4, 5, 6] },
      { name: 'Sugar 1kg', week: [2, 3, 2, 4, 3, 4, 5] },
      { name: 'Bread', week: [5, 5, 6, 5, 7, 8, 6] },
      { name: 'Biscuits', week: [2, 2, 3, 2, 4, 4, 3] },
    ],
    aiFinding: "Household sales fell 9% today vs. yesterday.",
    aiDetail: "Check whether Rice 5kg or Cooking Oil went out of stock — this branch's household category usually holds steady on weekdays.",
    expiring: [{ name: 'Cream Biscuits', sub: 'Expires in 5 days', value: 'Rs. 1,650' }],
    dead: [{ name: 'Party-size Crackers', sub: 'Idle 49 days', value: 'Rs. 3,380' }],
    attention: [
      { icon: 'expiry', title: '1 product expiring this week', sub: 'Rs. 1,650 at risk' },
      { icon: 'lowstock', title: '3 products below reorder level', sub: 'Restock recommended' },
      { icon: 'dead', title: 'Rs. 12,400 tied up in dead stock', sub: '4 idle products' },
    ],
    orders: [{ name: 'ABC Distributors', sub: 'Rice, Oil, Sugar — 10 days coverage', cost: 'Rs. 38,900' }],
    alerts: [
      { icon: 'lowstock', title: '3 products below reorder level', time: '1 hour ago', unread: true },
      { icon: 'check', title: 'Cash session closed, no variance', time: 'Yesterday', unread: false },
    ],
  },
  Kandy: {
    sales: [70, 75, 69, 82, 90, 101, 96], avgBill: 812, margin: 20.4,
    revenue: 5120000, orderCount: 2890, goalPct: 68, goalTarget: 6500000,
    salesTrend: [142, 150, 138, 160, 155, 165, 172, 178, 168, 182, 176, 188, 195, 203],
    topProducts: [
      { name: 'Noodles', week: [5, 6, 7, 6, 8, 9, 8] },
      { name: 'Cola 1.5L', week: [4, 5, 4, 6, 7, 8, 7] },
      { name: 'Chips', week: [3, 4, 5, 4, 6, 7, 6] },
      { name: 'Milk 1L', week: [3, 3, 4, 3, 5, 5, 4] },
      { name: 'Chocolate', week: [2, 2, 3, 3, 4, 5, 4] },
    ],
    aiFinding: "Snacks sales rose 14% today vs. yesterday.",
    aiDetail: "Weekend foot traffic is driving snack sales — worth checking if Instant Noodles and Potato Chips need a top-up before the weekend.",
    expiring: [
      { name: 'Yoghurt Cup', sub: 'Expires in 2 days', value: 'Rs. 2,100' },
      { name: 'Milk 1L', sub: 'Expires in 6 days', value: 'Rs. 4,760' },
    ],
    dead: [{ name: 'Imported Chocolate Bar', sub: 'Idle 58 days', value: 'Rs. 6,720' }],
    attention: [
      { icon: 'expiry', title: '2 products expiring this week', sub: 'Rs. 6,860 at risk' },
      { icon: 'dead', title: 'Rs. 6,720 tied up in dead stock', sub: '1 idle product' },
    ],
    orders: [{ name: 'Kandy Beverage Co.', sub: 'Cola, Ginger Beer — 7 days coverage', cost: 'Rs. 29,800' }],
    alerts: [{ icon: 'expiry', title: '2 products expiring this week', time: '3 hours ago', unread: true }],
  },
};

const attentionIcon = { expiry: AlertTriangle, lowstock: TrendingDown, dead: PackageX, cash: DollarSign, check: Check };

function useCountUp(target, active, duration = 1100) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) { setVal(0); return; }
    let raf, start;
    function step(ts) {
      if (!start) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(target * eased);
      if (t < 1) raf = requestAnimationFrame(step);
      else setVal(target);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return val;
}

function CountUp({ value, active, prefix = '', suffix = '', decimals = 0 }) {
  const v = useCountUp(value, active);
  return <>{prefix}{v.toLocaleString('en-LK', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</>;
}

function Card({ children, className = '', style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl shadow-xl backdrop-blur-xl border ${className}`}
      style={{ background: C.card, borderColor: C.cardBorder, ...style }}
    >
      {children}
    </div>
  );
}

// Premium icon treatment: soft gradient depth + inset highlight instead of a
// flat gray box, and a refined 1.6 stroke instead of Lucide's default 2 —
// thinner strokes read as more considered, closer to Linear/Stripe-style UI.
function IconChip({ icon: Icon, size = 16, tone = 'lime' }) {
  const isLime = tone === 'lime';
  return (
    <div
      className="rounded-xl flex items-center justify-center flex-shrink-0"
      style={{
        width: 38,
        height: 38,
        background: isLime
          ? 'linear-gradient(135deg, rgba(234,251,93,0.22), rgba(234,251,93,0.03))'
          : 'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))',
        border: `1px solid ${isLime ? C.limeBorder : C.cardBorder}`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 3px 8px rgba(0,0,0,0.22)',
      }}
    >
      <Icon size={size} strokeWidth={1.6} style={{ color: isLime ? C.lime : C.text }} />
    </div>
  );
}

const STORAGE_KEY = 'arkpos-owner-app-state';

function money(n) {
  return 'Rs. ' + Math.round(n).toLocaleString('en-LK');
}

function limeShade(intensity) {
  const alpha = 0.12 + intensity * 0.75;
  return `rgba(234,251,93,${alpha.toFixed(2)})`;
}

function SalesChart({ trend, revealed }) {
  const [tooltipIdx, setTooltipIdx] = useState(trend.length - 1);
  const w = 560, h = 160;
  const max = Math.max(...trend), min = Math.min(...trend) * 0.85;
  const points = trend.map((v, i) => {
    const x = (i / (trend.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * (h - 16) - 8;
    return [x, y];
  });
  const linePath = 'M' + points.map(p => p.join(',')).join(' L');
  const fillPath = linePath + ` L${w},${h} L0,${h} Z`;
  const idx = Math.min(tooltipIdx, points.length - 1);

  return (
    <svg width="100%" height="170" viewBox={`0 0 ${w} ${h + 10}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="ownerAreaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.lime} stopOpacity="0.3" />
          <stop offset="100%" stopColor={C.lime} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#ownerAreaFill)" opacity={revealed ? 1 : 0} style={{ transition: 'opacity .8s ease .6s' }} />
      <path
        d={linePath} fill="none" stroke={C.lime} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ strokeDasharray: 1400, strokeDashoffset: revealed ? 0 : 1400, transition: 'stroke-dashoffset 1.3s cubic-bezier(.3,.8,.4,1)' }}
      />
      {points.map(([x, y], i) => (
        <circle
          key={i} cx={x} cy={y} r={i === idx ? 5 : 3}
          fill={i === idx ? C.lime : C.card} stroke={C.lime} strokeWidth="1.5"
          style={{ cursor: 'pointer', opacity: revealed ? 1 : 0, transition: 'opacity .4s ease .8s' }}
          onMouseEnter={() => setTooltipIdx(i)}
        />
      ))}
      {revealed && (() => {
        // clamp both edges so the tooltip never overflows the chart bounds —
        // the right edge was clipping when the highlighted point was the
        // last one, which it is by default
        const tx = Math.max(0, Math.min(w - 92, points[idx][0] - 46));
        const ty = Math.max(0, points[idx][1] - 36);
        return (
          <g>
            <rect x={tx} y={ty} width="92" height="28" rx="8" fill={C.lime} />
            <text x={tx + 46} y={ty + 18} textAnchor="middle" fontSize="11" fontWeight="700" fill={C.ink} fontFamily="monospace">
              {money(trend[idx] * 1000)}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}

function TopProductsHeatmap({ products, revealed }) {
  const maxCell = Math.max(...products.flatMap(p => p.week));
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div className="flex">
      <div className="flex flex-col justify-between mr-2" style={{ paddingTop: 2 }}>
        {products.map(p => (
          <div key={p.name} className="text-xs truncate" style={{ color: C.faint, height: 18, lineHeight: '18px', maxWidth: 62, fontSize: '10px' }}>{p.name}</div>
        ))}
      </div>
      <div className="flex-1">
        {products.map((p, ri) => (
          <div key={p.name} className="flex gap-1 mb-1">
            {p.week.map((v, ci) => (
              <div
                key={ci}
                className="flex-1 rounded"
                style={{ height: 14, background: revealed ? limeShade(v / maxCell) : C.cardHover, transition: `background .5s ease ${(ri * 7 + ci) * 25}ms` }}
              />
            ))}
          </div>
        ))}
        <div className="flex gap-1 mt-2">
          {days.map((d, i) => (
            <div key={i} className="flex-1 text-center" style={{ color: C.faint, fontSize: '9px' }}>{d}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ArkPosOwnerApp({ onSwitchRole, onLogout }) {
  const branches = Object.keys(branchData);
  const [branch, setBranch] = useState('Colombo');
  const [branchOpen, setBranchOpen] = useState(false);
  const branchMenuRef = useRef(null);

  // close the branch dropdown on an outside click, not just on selection
  useEffect(() => {
    if (!branchOpen) return;
    function onClick(e) {
      if (branchMenuRef.current && !branchMenuRef.current.contains(e.target)) setBranchOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [branchOpen]);
  const [view, setView] = useState('home');
  const [weekMode, setWeekMode] = useState('week');
  const [aiOpen, setAiOpen] = useState(false);
  const [invSeg, setInvSeg] = useState('expiring');
  const [alertSeg, setAlertSeg] = useState('all');

  const [attentionState, setAttentionState] = useState(() => {
    const init = {};
    branches.forEach(b => { init[b] = [...branchData[b].attention]; });
    return init;
  });
  const [alertsState, setAlertsState] = useState(() => {
    const init = {};
    branches.forEach(b => { init[b] = branchData[b].alerts.map(a => ({ ...a })); });
    return init;
  });
  const [approvedOrders, setApprovedOrders] = useState({});
  const [storageReady, setStorageReady] = useState(false);

  // Storage shim: use Claude's artifact-only window.storage when it exists
  // (inside claude.ai), otherwise fall back to plain localStorage (when this
  // runs as a normal webpage, e.g. on your laptop via `npm run dev`).
  const storage = {
    get: async (key) => {
      if (window.storage) return window.storage.get(key, false);
      const raw = localStorage.getItem(key);
      return raw ? { value: raw } : null;
    },
    set: async (key, value) => {
      if (window.storage) return window.storage.set(key, value, false);
      localStorage.setItem(key, value);
    },
  };

  // ---- load persisted state once, on first mount ----
  useEffect(() => {
    (async () => {
      try {
        const result = await storage.get(STORAGE_KEY);
        if (result && result.value) {
          const saved = JSON.parse(result.value);
          if (saved.attentionState) setAttentionState(saved.attentionState);
          if (saved.alertsState) setAlertsState(saved.alertsState);
          if (saved.approvedOrders) setApprovedOrders(saved.approvedOrders);
        }
      } catch (e) {
        // no saved state yet — that's fine, start fresh
      } finally {
        setStorageReady(true);
      }
    })();
  }, []);

  // ---- persist on every change, once initial load has happened ----
  useEffect(() => {
    if (!storageReady) return;
    (async () => {
      try {
        await storage.set(STORAGE_KEY, JSON.stringify({ attentionState, alertsState, approvedOrders }));
      } catch (e) {
        // best-effort — prototype still works without persistence
      }
    })();
  }, [attentionState, alertsState, approvedOrders, storageReady]);

  // ---- entrance sequence: skeleton veil -> cards fade up -> numbers count up ----
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    setRevealed(false);
    const t = setTimeout(() => setRevealed(true), 550);
    return () => clearTimeout(t);
  }, [branch]);

  const d = branchData[branch];

  const unreadCount = (alertsState[branch] || []).filter(a => a.unread).length;

  function dismissAttention(i) {
    setAttentionState(prev => ({ ...prev, [branch]: prev[branch].filter((_, idx) => idx !== i) }));
  }
  function markAlertRead(i) {
    setAlertsState(prev => ({
      ...prev,
      [branch]: prev[branch].map((a, idx) => idx === i ? { ...a, unread: false } : a),
    }));
  }
  function approveOrder(i) {
    setApprovedOrders(prev => ({ ...prev, [branch + i]: true }));
  }
  function resetDemoData() {
    const initA = {}; const initAl = {};
    branches.forEach(b => { initA[b] = [...branchData[b].attention]; initAl[b] = branchData[b].alerts.map(a => ({ ...a })); });
    setAttentionState(initA); setAlertsState(initAl); setApprovedOrders({});
  }

  const lowStockCount = d.expiring.length + d.dead.length;

  const navItems = [
    { key: 'home', label: 'Home', icon: Home },
    { key: 'inventory', label: 'Inventory', icon: Boxes, badge: lowStockCount },
    { key: 'purchasing', label: 'Purchase', icon: ShoppingBag },
    { key: 'alerts', label: 'Alerts', icon: Bell, badge: unreadCount },
    { key: 'more', label: 'More', icon: UserRound },
  ];

  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  const Background = () => (
    <div className="fixed inset-0 overflow-hidden" style={{ background: C.bg, zIndex: -10 }}>
      <div style={{ position: 'absolute', top: -160, left: -160, width: 500, height: 500, borderRadius: '9999px', background: C.lime, opacity: 0.14, filter: 'blur(120px)' }} />
      <div style={{ position: 'absolute', top: '30%', right: -160, width: 500, height: 500, borderRadius: '9999px', background: C.slate, opacity: 0.35, filter: 'blur(120px)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: '20%', width: 400, height: 400, borderRadius: '9999px', background: C.lime, opacity: 0.07, filter: 'blur(120px)' }} />
      {/* subtle grain so the flat dark surface doesn't read as pure-flat AI-gradient */}
      <div
        style={{
          position: 'absolute', inset: 0, opacity: 0.05, mixBlendMode: 'overlay',
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );

  const segStyle = (active) => ({
    background: active ? C.lime : 'transparent',
    color: active ? C.ink : C.muted,
  });

  const [toast, setToast] = useState(null);
  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  }

  return (
    <div className="min-h-screen relative font-sans pb-24 md:pb-0" style={{ color: C.text, minHeight: '100dvh' }}>
      <Background />

      <div
        className="fixed inset-0 flex items-center justify-center transition-opacity duration-300"
        style={{ background: C.bg, zIndex: 40, opacity: revealed ? 0 : 1, pointerEvents: revealed ? 'none' : 'auto' }}
      >
        <div className="text-xs animate-pulse" style={{ color: C.faint }}>Loading Nova Mart…</div>
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <div className="hidden md:flex md:flex-col md:w-60 md:h-screen md:sticky md:top-0 p-5 gap-1">
          <div className="text-lg font-extrabold mb-6 px-2">ARK <span style={{ color: C.lime }}>POS</span></div>
          {navItems.map(item => {
            const Icon = item.icon;
            const active = view === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition relative font-medium"
                style={active ? { background: C.lime, color: C.ink } : { color: C.muted }}
              >
                <Icon size={17} strokeWidth={1.7} />
                {item.label}
                {item.badge > 0 && (
                  <span className="ml-auto text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center" style={{ background: C.danger, fontSize: '10px' }}>{item.badge}</span>
                )}
              </button>
            );
          })}
          <div className="flex-1" />
          <button onClick={resetDemoData} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs" style={{ color: C.faint }}>
            Reset data
          </button>
          <button onClick={onLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm" style={{ color: C.danger }}>
            <LogOut size={16} strokeWidth={1.7} /> Log out
          </button>
          {onSwitchRole && (
            <button onClick={onSwitchRole} className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs" style={{ color: C.faint }}>
              Switch app
            </button>
          )}
          <a
            href="https://www.ark-ii.studio"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 pt-3 mt-1 text-xs font-semibold border-t"
            style={{ color: C.faint, borderColor: C.cardBorder }}
          >
            Built by ARK II
          </a>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 px-5 md:px-8 py-6 max-w-5xl mx-auto w-full">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">
                {view === 'home' ? `Good morning, Linuka` :
                 view === 'inventory' ? 'Inventory' :
                 view === 'purchasing' ? 'Smart Purchasing' :
                 view === 'alerts' ? 'Alerts' : 'More'}
              </h1>
              <p className="text-sm mt-1" style={{ color: C.muted }}>
                {view === 'home' ? `Here's how ${branch} is doing.` :
                 view === 'alerts' ? `${unreadCount} unread` : '\u00A0'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isOnline && (
                <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full" style={{ background: 'rgba(224,138,107,0.14)', color: C.danger }}>
                  <span style={{ width: 6, height: 6, borderRadius: '9999px', background: C.danger }} /> Offline
                </div>
              )}
              <div className="relative" ref={branchMenuRef}>
              <button
                onClick={() => setBranchOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={branchOpen}
                className="flex items-center gap-1.5 backdrop-blur-md border px-3 py-2 rounded-full text-xs font-semibold"
                style={{ background: C.card, borderColor: C.cardBorder }}
              >
                <Building2 size={13} strokeWidth={1.8} /> {branch} <ChevronDown size={13} strokeWidth={1.8} style={{ transform: branchOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
              </button>
              {branchOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-xl overflow-hidden shadow-2xl border backdrop-blur-xl" style={{ background: '#141516f2', borderColor: C.cardBorder, zIndex: 20 }}>
                  {branches.map(b => (
                    <button
                      key={b}
                      onClick={() => { setBranch(b); setBranchOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs"
                      style={{ color: b === branch ? C.lime : C.muted, background: b === branch ? C.card : 'transparent' }}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}
              </div>
            </div>
          </div>

          {/* ---------------- HOME ---------------- */}
          {view === 'home' && (
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-5">
                <div className="text-xs mb-2" style={{ color: C.faint }}>Total Revenue</div>
                <div className="text-xl font-bold" style={{ fontFamily: 'monospace' }}>
                  <CountUp value={d.revenue} active={revealed} prefix="Rs. " />
                </div>
                <div className="text-xs mt-2" style={{ color: C.lime }}>↑ from last month</div>
              </Card>
              <Card className="p-5">
                <div className="text-xs mb-2" style={{ color: C.faint }}>Total Orders</div>
                <div className="text-xl font-bold" style={{ fontFamily: 'monospace' }}>
                  <CountUp value={d.orderCount} active={revealed} />
                </div>
                <div className="text-xs mt-2" style={{ color: C.lime }}>↑ from last month</div>
              </Card>
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs mb-2" style={{ color: C.faint }}>Monthly Goal</div>
                    <div className="text-base font-bold" style={{ color: C.lime, fontFamily: 'monospace' }}>
                      <CountUp value={d.goalTarget * (d.goalPct / 100)} active={revealed} prefix="Rs. " />
                    </div>
                    <div className="text-xs mt-1" style={{ color: C.faint }}>of Rs. {(d.goalTarget / 1000000).toFixed(1)}M target</div>
                  </div>
                  <svg width={56} height={56} viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" stroke={C.cardHover} strokeWidth="7" fill="none" />
                    <circle
                      cx="28" cy="28" r="22" stroke={C.lime} strokeWidth="7" fill="none" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 22}
                      strokeDashoffset={revealed ? 2 * Math.PI * 22 * (1 - d.goalPct / 100) : 2 * Math.PI * 22}
                      style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.2,.9,.3,1)' }}
                      transform="rotate(-90 28 28)"
                    />
                    <text x="28" y="33" textAnchor="middle" fontSize="12" fontWeight="700" fill={C.text} fontFamily="monospace">{d.goalPct}%</text>
                  </svg>
                </div>
              </Card>

              <div className="md:col-span-2 flex flex-col gap-4">
                <Card className="p-4" style={{ background: C.limeSoft, borderColor: C.limeBorder }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs mb-1" style={{ color: C.muted }}>Average Bill</div>
                      <div className="text-lg font-bold" style={{ color: C.lime, fontFamily: 'monospace' }}>
                        <CountUp value={d.avgBill} active={revealed} prefix="Rs. " />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs mb-1" style={{ color: C.muted }}>Profit Margin</div>
                      <div className="text-lg font-bold" style={{ fontFamily: 'monospace' }}>
                        <CountUp value={d.margin} active={revealed} suffix="%" decimals={1} />
                      </div>
                    </div>
                  </div>
                </Card>
                <Card className="p-5 flex-1">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold">Sales Analytics</h3>
                    <button
                      onClick={() => setWeekMode(m => m === 'week' ? 'month' : 'week')}
                      className="text-xs px-2.5 py-1 rounded-lg flex items-center gap-1"
                      style={{ background: C.cardHover }}
                    >
                      {weekMode === 'week' ? 'Last 7 days' : 'Last 14 days'} <ChevronDown size={11} strokeWidth={1.8} />
                    </button>
                  </div>
                  <SalesChart trend={weekMode === 'week' ? d.salesTrend.slice(-7) : d.salesTrend} revealed={revealed} />
                </Card>
              </div>

              <Card className="p-5">
                <h3 className="text-sm font-semibold mb-4">Top Products</h3>
                <TopProductsHeatmap products={d.topProducts} revealed={revealed} />
              </Card>

              <Card
                onClick={() => setAiOpen(o => !o)}
                className="p-5 md:col-span-3 cursor-pointer transition"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold mb-2" style={{ color: C.lime }}>
                  <Sparkles size={12} strokeWidth={1.8} /> AI INSIGHT — TAP TO EXPAND
                </div>
                <div className="text-sm font-semibold">{d.aiFinding}</div>
                {aiOpen && <div className="text-xs mt-2 leading-relaxed" style={{ color: C.muted }}>{d.aiDetail}</div>}
              </Card>

              <div className="md:col-span-3">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold">Things Need Attention</h3>
                  <span className="text-xs" style={{ color: C.faint }}>{attentionState[branch].length} items</span>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {attentionState[branch].map((item, i) => {
                    const Icon = attentionIcon[item.icon];
                    return (
                      <Card key={i} className="p-4 flex items-center gap-3">
                        <IconChip icon={Icon} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{item.title}</div>
                          <div className="text-xs" style={{ color: C.faint }}>{item.sub}</div>
                        </div>
                        {item.value ? (
                          <div className="text-xs flex-shrink-0" style={{ color: C.muted, fontFamily: 'monospace' }}>{item.value}</div>
                        ) : (
                          <button
                            onClick={() => dismissAttention(i)}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg flex-shrink-0"
                            style={{ background: C.cardHover }}
                          >
                            Review
                          </button>
                        )}
                      </Card>
                    );
                  })}
                  {attentionState[branch].length === 0 && (
                    <div className="text-sm md:col-span-2" style={{ color: C.faint }}>All clear — nothing needs attention.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ---------------- INVENTORY ---------------- */}
          {view === 'inventory' && (
            <div>
              <div className="flex rounded-xl p-1 mb-4 w-full md:w-72 border backdrop-blur-md" style={{ background: C.card, borderColor: C.cardBorder }}>
                {['expiring', 'dead'].map(seg => (
                  <button
                    key={seg}
                    onClick={() => setInvSeg(seg)}
                    className="flex-1 py-2 text-xs font-semibold rounded-lg transition"
                    style={segStyle(invSeg === seg)}
                  >
                    {seg === 'expiring' ? 'Expiring' : 'Dead Stock'}
                  </button>
                ))}
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {(invSeg === 'expiring' ? d.expiring : d.dead).map((item, i) => (
                  <Card key={i} className="p-4 flex items-center gap-3">
                    <IconChip icon={invSeg === 'expiring' ? AlertTriangle : PackageX} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs" style={{ color: C.faint }}>{item.sub}</div>
                    </div>
                    <div className="text-xs" style={{ color: C.muted, fontFamily: 'monospace' }}>{item.value}</div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ---------------- PURCHASING ---------------- */}
          {view === 'purchasing' && (
            <div className="grid md:grid-cols-2 gap-3">
              {d.orders.map((o, i) => {
                const approved = approvedOrders[branch + i];
                return (
                  <Card key={i} className="p-5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold">{o.name}</span>
                      <span className="text-sm font-bold" style={{ fontFamily: 'monospace' }}>{o.cost}</span>
                    </div>
                    <div className="text-xs mb-4" style={{ color: C.faint }}>{o.sub}</div>
                    <button
                      onClick={() => approveOrder(i)}
                      disabled={approved}
                      className="w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                      style={approved ? { background: C.cardHover, color: C.faint } : { background: C.lime, color: C.ink }}
                    >
                      {approved ? (<><Check size={14} strokeWidth={2} /> Approved</>) : 'Approve Order'}
                    </button>
                  </Card>
                );
              })}
            </div>
          )}

          {/* ---------------- ALERTS ---------------- */}
          {view === 'alerts' && (
            <div>
              <div className="flex rounded-xl p-1 mb-4 w-full md:w-72 border backdrop-blur-md" style={{ background: C.card, borderColor: C.cardBorder }}>
                {['all', 'unread'].map(seg => (
                  <button
                    key={seg}
                    onClick={() => setAlertSeg(seg)}
                    className="flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition"
                    style={segStyle(alertSeg === seg)}
                  >
                    {seg}
                  </button>
                ))}
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {(alertsState[branch] || [])
                  .map((a, i) => ({ ...a, i }))
                  .filter(a => alertSeg === 'all' || a.unread)
                  .map((a) => {
                    const Icon = attentionIcon[a.icon] || Bell;
                    return (
                      <Card key={a.i} className="p-4 flex items-center gap-3">
                        <IconChip icon={Icon} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{a.title}</div>
                          <div className="text-xs" style={{ color: C.faint }}>{a.time}</div>
                        </div>
                        {a.unread ? (
                          <button
                            onClick={() => markAlertRead(a.i)}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg flex-shrink-0"
                            style={{ background: C.cardHover }}
                          >
                            Mark read
                          </button>
                        ) : (
                          <span className="flex-shrink-0" style={{ color: C.faint }}><Check size={15} strokeWidth={2} /></span>
                        )}
                      </Card>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ---------------- MORE ---------------- */}
          {view === 'more' && (
            <div className="max-w-md">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full" style={{ background: `linear-gradient(135deg, ${C.lime}, ${C.slate})` }} />
                <div>
                  <div className="font-bold">Linuka Bandara</div>
                  <div className="text-xs" style={{ color: C.faint }}>Owner — Nova Mart</div>
                </div>
              </div>
              <div className="flex flex-col gap-2 mb-6">
                {[
                  { icon: Building2, label: 'Branches', sub: '3 branches active', onClick: () => { setBranchOpen(true); showToast('Pick a branch from the top-right menu'); } },
                  { icon: Users, label: 'Team & Roles', sub: '8 employees', onClick: () => showToast('Team & Roles — coming soon') },
                  { icon: CreditCard, label: 'Billing', sub: 'Starter plan', onClick: () => showToast('Billing — coming soon') },
                  { icon: Settings, label: 'Settings', sub: 'Receipts, tax, integrations', onClick: () => showToast('Settings — coming soon') },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <Card key={i} onClick={item.onClick} className="p-4 flex items-center gap-3 cursor-pointer transition">
                      <IconChip icon={Icon} />
                      <div>
                        <div className="text-sm font-medium">{item.label}</div>
                        <div className="text-xs" style={{ color: C.faint }}>{item.sub}</div>
                      </div>
                    </Card>
                  );
                })}
              </div>
              <button
                onClick={resetDemoData}
                className="w-full py-3 rounded-xl border font-bold text-sm mb-3"
                style={{ borderColor: C.cardBorder, color: C.muted }}
              >
                Reset data
              </button>
              <button
                onClick={onLogout}
                className="w-full py-3 rounded-xl border font-bold text-sm md:hidden"
                style={{ borderColor: C.dangerSoft, color: C.danger }}
              >
                Log out
              </button>
              {onSwitchRole && (
                <button
                  onClick={onSwitchRole}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold mt-2"
                  style={{ color: C.faint }}
                >
                  Switch app
                </button>
              )}
              <a
                href="https://www.ark-ii.studio"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-xs font-semibold mt-6 pt-4 border-t"
                style={{ color: C.lime, borderColor: C.cardBorder }}
              >
                Built by ARK II
              </a>
            </div>
          )}

        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 flex px-2 pt-2 pb-6 border-t backdrop-blur-xl" style={{ background: '#141516e6', borderColor: C.cardBorder, zIndex: 20 }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const active = view === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className="flex-1 flex flex-col items-center gap-1 relative py-1"
            >
              <Icon size={19} strokeWidth={1.7} style={{ color: active ? C.lime : C.faint }} />
              <span className="text-xs" style={{ color: active ? C.lime : C.faint, fontSize: '10px' }}>{item.label}</span>
              {item.badge > 0 && (
                <span
                  className="absolute text-white font-bold rounded-full flex items-center justify-center"
                  style={{ background: C.danger, top: -2, right: '22%', minWidth: 14, height: 14, fontSize: '9px', padding: '0 2px' }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {toast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full text-sm font-semibold shadow-xl"
          style={{ background: C.lime, color: C.ink, bottom: 96, zIndex: 50 }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

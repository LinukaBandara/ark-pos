import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Barcode, Plus, Minus, X, Percent, PauseCircle, PlayCircle, Banknote,
  CreditCard, QrCode, Check, ArrowLeft, Delete, Receipt, RotateCcw, Clock,
  Search, ShoppingCart, AlertCircle,
} from 'lucide-react';
import { supabase, DEMO_TENANT_ID, DEMO_BRANCH_ID, DEMO_EMPLOYEE_ID } from './supabaseClient';

// ---- brand tokens (inline styles only — arbitrary Tailwind bracket classes
// don't render in this artifact runtime, see the owner-app bug earlier) ----
const C = {
  bg: '#151515',
  panel: '#1E1E1E',
  panelAlt: '#242424',
  cardBorder: 'rgba(255,255,255,0.08)',
  slate: '#484C5E',
  white: '#FBFBFB',
  lime: '#EAFB5D',
  ink: '#151515',
  text: '#FBFBFB',
  muted: '#9A9A9A',
  faint: '#6E6E6E',
  danger: '#E08A6B',
};

const CATEGORIES_FALLBACK = ['All'];

const STORAGE_KEY = 'arkpos-checkout-state';

// Same storage shim as the owner app: window.storage inside Claude's
// artifact viewer, localStorage everywhere else (your laptop, a real deploy).
const storage = {
  get: async (key) => {
    if (typeof window !== 'undefined' && window.storage) return window.storage.get(key, false);
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    return raw ? { value: raw } : null;
  },
  set: async (key, value) => {
    if (typeof window !== 'undefined' && window.storage) return window.storage.set(key, value, false);
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
  },
};

function money(n) {
  return 'Rs. ' + Math.round(n).toLocaleString('en-LK');
}

function Chip({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition"
      style={{
        background: active ? C.lime : C.panelAlt,
        color: active ? C.ink : C.muted,
        border: `1px solid ${active ? C.lime : C.cardBorder}`,
      }}
    >
      {children}
    </button>
  );
}

function KeypadButton({ children, onClick, wide, subtle }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl font-bold text-xl flex items-center justify-center transition active:scale-95"
      style={{
        gridColumn: wide ? 'span 2' : undefined,
        background: subtle ? C.panelAlt : C.panel,
        color: C.text,
        border: `1px solid ${C.cardBorder}`,
        height: 60,
      }}
    >
      {children}
    </button>
  );
}

export default function ArkPosCheckout({ onSwitchRole, onLogout }) {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState([]); // { id, name, price, costPrice, qty }
  const [heldCarts, setHeldCarts] = useState([]);
  const [discountPct, setDiscountPct] = useState(0);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashInput, setCashInput] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [todaysSales, setTodaysSales] = useState({ count: 0, total: 0 });
  const [toast, setToast] = useState(null);
  const [heldDrawerOpen, setHeldDrawerOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const [storageReady, setStorageReady] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [chargeError, setChargeError] = useState(null);
  const [charging, setCharging] = useState(false);
  const searchRef = useRef(null);

  // ---- load real products from Supabase on mount ----
  useEffect(() => {
    (async () => {
      setProductsLoading(true);
      setProductsError(null);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, selling_price, cost_price, categories(name)')
        .eq('tenant_id', DEMO_TENANT_ID)
        .is('deleted_at', null)
        .order('name');

      if (error) {
        setProductsError(error.message);
        setProductsLoading(false);
        return;
      }
      setProducts(
        (data || []).map(p => ({
          id: p.id,
          name: p.name,
          price: Number(p.selling_price),
          costPrice: Number(p.cost_price),
          category: p.categories?.name || 'Other',
        }))
      );
      setProductsLoading(false);
    })();
  }, []);

  const CATEGORIES = useMemo(() => {
    const unique = Array.from(new Set(products.map(p => p.category)));
    return ['All', ...unique.sort()];
  }, [products]);

  // ---- load persisted held carts + today's sales on mount ----
  useEffect(() => {
    (async () => {
      try {
        const result = await storage.get(STORAGE_KEY);
        if (result && result.value) {
          const saved = JSON.parse(result.value);
          if (saved.heldCarts) {
            setHeldCarts(saved.heldCarts.map(h => ({ ...h, time: new Date(h.time) })));
          }
          if (saved.todaysSales) setTodaysSales(saved.todaysSales);
        }
      } catch (e) {
        // nothing saved yet — start fresh
      } finally {
        setStorageReady(true);
      }
    })();
  }, []);

  // ---- persist held carts + today's sales on every change ----
  useEffect(() => {
    if (!storageReady) return;
    (async () => {
      try {
        await storage.set(STORAGE_KEY, JSON.stringify({ heldCarts, todaysSales }));
      } catch (e) {
        // best-effort
      }
    })();
  }, [heldCarts, todaysSales, storageReady]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);

  // keyboard shortcuts: F2 hold cart, F4 open payment, Esc close any open modal
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'F2') { e.preventDefault(); holdCart(); }
      else if (e.key === 'F4') { e.preventDefault(); openPayment(); }
      else if (e.key === 'Escape') {
        if (paymentOpen) setPaymentOpen(false);
        else if (heldDrawerOpen) setHeldDrawerOpen(false);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [cart, discountPct, paymentOpen, heldDrawerOpen]);

  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 1400);
  }

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const inCat = category === 'All' || p.category === category;
      const inSearch = query.trim() === '' || p.name.toLowerCase().includes(query.trim().toLowerCase());
      return inCat && inSearch;
    });
  }, [products, category, query]);

  function addToCart(product) {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, costPrice: product.costPrice, qty: 1 }];
    });
  }

  function changeQty(id, delta) {
    setCart(prev => prev
      .map(i => i.id === id ? { ...i, qty: i.qty + delta } : i)
      .filter(i => i.qty > 0));
  }

  function removeItem(id) {
    setCart(prev => prev.filter(i => i.id !== id));
  }

  function voidLastItem() {
    if (cart.length === 0) return;
    setCart(prev => prev.slice(0, -1));
    showToast('Last item voided');
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discountAmount = subtotal * (discountPct / 100);
  const total = subtotal - discountAmount;
  const cashTendered = parseFloat(cashInput || '0');
  const changeDue = Math.max(0, cashTendered - total);

  function holdCart() {
    if (cart.length === 0) return;
    setHeldCarts(prev => [...prev, { id: Date.now(), items: cart, discountPct, total, time: new Date() }]);
    setCart([]);
    setDiscountPct(0);
    showToast('Cart held');
  }

  function resumeCart(held) {
    if (cart.length > 0) { showToast('Clear or hold current cart first'); return; }
    setCart(held.items);
    setDiscountPct(held.discountPct);
    setHeldCarts(prev => prev.filter(h => h.id !== held.id));
    setHeldDrawerOpen(false);
    showToast('Cart resumed');
  }

  function openPayment() {
    if (cart.length === 0) return;
    setPaymentMethod('cash');
    setCashInput('');
    setPaymentOpen(true);
  }

  async function completeSale() {
    if (paymentMethod === 'cash' && cashTendered < total) return;
    setCharging(true);
    setChargeError(null);

    const receiptNumber = 'NM-' + Date.now();

    try {
      // 1) the sale header
      const { data: saleRow, error: saleErr } = await supabase
        .from('sales')
        .insert({
          tenant_id: DEMO_TENANT_ID,
          branch_id: DEMO_BRANCH_ID,
          employee_id: DEMO_EMPLOYEE_ID,
          receipt_number: receiptNumber,
          subtotal, discount_total: discountAmount, tax_total: 0, grand_total: total,
          status: 'completed',
        })
        .select()
        .single();
      if (saleErr) throw saleErr;

      // 2) line items
      const { error: itemsErr } = await supabase.from('sale_items').insert(
        cart.map(i => ({
          sale_id: saleRow.id,
          product_id: i.id,
          quantity: i.qty,
          unit_price: i.price,
          unit_cost: i.costPrice,
          line_total: i.price * i.qty,
        }))
      );
      if (itemsErr) throw itemsErr;

      // 3) payment
      const { error: payErr } = await supabase.from('payments').insert({
        sale_id: saleRow.id,
        method: paymentMethod,
        amount: total,
      });
      if (payErr) throw payErr;

      // 4) inventory ledger entries (append-only, per the schema's own design)
      const { error: moveErr } = await supabase.from('inventory_movements').insert(
        cart.map(i => ({
          tenant_id: DEMO_TENANT_ID,
          product_id: i.id,
          branch_id: DEMO_BRANCH_ID,
          movement_type: 'sale',
          quantity_delta: -i.qty,
          reference_type: 'sale',
          reference_id: saleRow.id,
        }))
      );
      if (moveErr) throw moveErr;

      // 5) decrement the cached on-hand snapshot. NOTE: this is a
      // read-then-write, not atomic — two cashiers selling the same product
      // at the same instant could race here. The real fix is a Postgres
      // function that does steps 1–5 in one transaction (the API contract
      // already specs this); this sequential version is the honest
      // "wired to a real database" step, not yet the production-safe one.
      for (const i of cart) {
        const { data: invRow } = await supabase
          .from('inventory')
          .select('quantity_on_hand')
          .eq('product_id', i.id)
          .eq('branch_id', DEMO_BRANCH_ID)
          .single();
        if (invRow) {
          await supabase
            .from('inventory')
            .update({ quantity_on_hand: Number(invRow.quantity_on_hand) - i.qty })
            .eq('product_id', i.id)
            .eq('branch_id', DEMO_BRANCH_ID);
        }
      }

      const saleReceipt = {
        items: cart,
        subtotal, discountPct, discountAmount, total,
        method: paymentMethod,
        tendered: paymentMethod === 'cash' ? cashTendered : total,
        change: paymentMethod === 'cash' ? changeDue : 0,
        time: new Date(),
        number: receiptNumber,
      };
      setReceipt(saleReceipt);
      setTodaysSales(prev => ({ count: prev.count + 1, total: prev.total + total }));
      setCart([]);
      setDiscountPct(0);
      setPaymentOpen(false);
    } catch (err) {
      // Real failure — the cart is deliberately NOT cleared, so the cashier
      // doesn't lose the sale and can retry instead of re-ringing everything.
      setChargeError(err.message || 'Could not save the sale. Check your connection and try again.');
    } finally {
      setCharging(false);
    }
  }

  function newSale() {
    setReceipt(null);
    setCashInput('');
    setChargeError(null);
    setTimeout(() => searchRef.current && searchRef.current.focus(), 50);
  }

  function keypadPress(key) {
    if (key === 'back') { setCashInput(prev => prev.slice(0, -1)); return; }
    if (key === 'clear') { setCashInput(''); return; }
    if (key === '.') { if (cashInput.includes('.')) return; setCashInput(prev => (prev === '' ? '0.' : prev + '.')); return; }
    setCashInput(prev => (prev === '0' ? key : prev + key));
  }

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: C.bg, color: C.text, minHeight: '100dvh' }}>

      {/* ---------- HEADER ---------- */}
      <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0" style={{ borderColor: C.cardBorder, background: C.panel }}>
        <div className="flex items-center gap-3">
          <button
            onClick={onSwitchRole}
            disabled={!onSwitchRole}
            className="p-2 rounded-lg"
            style={{ background: C.panelAlt, opacity: onSwitchRole ? 1 : 0.4 }}
            aria-label="Back"
          >
            <ArrowLeft size={18} strokeWidth={1.8} style={{ color: C.muted }} />
          </button>
          <div>
            <div className="text-sm font-bold">Nova Mart — Register 1</div>
            <div className="text-xs" style={{ color: C.faint }}>Priyantha Kumara • {now.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isOnline && (
            <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full" style={{ background: 'rgba(224,138,107,0.14)', color: C.danger }}>
              <span style={{ width: 6, height: 6, borderRadius: '9999px', background: C.danger }} /> Offline
            </div>
          )}
          <div className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: C.panelAlt, color: C.muted }}>
            Today: {todaysSales.count} sales • {money(todaysSales.total)}
          </div>
          <button
            onClick={() => setHeldDrawerOpen(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold relative"
            style={{ background: heldCarts.length ? C.lime : C.panelAlt, color: heldCarts.length ? C.ink : C.muted }}
            title="Held carts (F2 to hold current cart)"
          >
            <PauseCircle size={14} strokeWidth={1.8} /> Held ({heldCarts.length})
          </button>
        </div>
      </div>
      <div className="px-5 py-1 text-xs flex-shrink-0" style={{ color: C.faint, background: C.bg }}>
        F2 hold cart · F4 charge · Esc close
      </div>

      <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-y-auto md:overflow-visible">

        {/* ---------- PRODUCT SIDE ---------- */}
        <div className="flex-1 flex flex-col min-w-0 p-4 min-h-96 md:min-h-0">
          <div className="flex items-center gap-2 mb-3 rounded-xl px-4 py-3" style={{ background: C.panel, border: `1px solid ${C.cardBorder}` }}>
            <Barcode size={20} strokeWidth={1.7} style={{ color: C.lime }} />
            <input
              ref={searchRef}
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Scan barcode or search product..."
              className="flex-1 bg-transparent outline-none text-lg"
              style={{ color: C.text }}
            />
            {query && (
              <button onClick={() => setQuery('')}><X size={18} style={{ color: C.faint }} /></button>
            )}
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {CATEGORIES.map(cat => (
              <Chip key={cat} active={category === cat} onClick={() => setCategory(cat)}>{cat}</Chip>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', alignContent: 'start' }}>
            {productsLoading && (
              <div className="col-span-full text-center py-10" style={{ color: C.faint }}>Loading products…</div>
            )}
            {productsError && (
              <div className="col-span-full flex items-start gap-2 rounded-xl p-4" style={{ background: 'rgba(224,138,107,0.1)', border: `1px solid ${C.danger}` }}>
                <AlertCircle size={18} style={{ color: C.danger, flexShrink: 0, marginTop: 2 }} />
                <div className="text-sm" style={{ color: C.danger }}>
                  Couldn't load products from the database: {productsError}
                  <div className="text-xs mt-1" style={{ color: C.muted }}>Check your .env.local has the right VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY, and that ark-pos-seed.sql ran successfully.</div>
                </div>
              </div>
            )}
            {!productsLoading && !productsError && filteredProducts.map(p => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="rounded-2xl p-4 text-left transition active:scale-95"
                style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, minHeight: 96 }}
              >
                <div className="text-sm font-semibold mb-2 leading-snug">{p.name}</div>
                <div className="text-base font-mono font-bold" style={{ color: C.lime }}>{money(p.price)}</div>
              </button>
            ))}
            {!productsLoading && !productsError && filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-10" style={{ color: C.faint }}>No products match.</div>
            )}
          </div>
        </div>

        {/* ---------- CART SIDE ---------- */}
        <div className="w-full md:max-w-sm md:flex-shrink-0 flex flex-col border-t md:border-t-0 md:border-l" style={{ borderColor: C.cardBorder, background: C.panel }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: C.cardBorder }}>
            <div className="flex items-center gap-2 text-sm font-bold"><ShoppingCart size={16} strokeWidth={1.8} /> Current Sale</div>
            <button
              onClick={voidLastItem}
              disabled={cart.length === 0}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
              style={{ color: cart.length ? C.danger : C.faint, background: C.panelAlt, opacity: cart.length ? 1 : 0.5 }}
            >
              <RotateCcw size={12} /> Void last
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-2">
            {cart.length === 0 && (
              <div className="text-center py-16 text-sm" style={{ color: C.faint }}>Cart is empty — tap a product to add it.</div>
            )}
            {cart.map(item => (
              <div key={item.id} className="flex items-center gap-2 py-3 border-b" style={{ borderColor: C.cardBorder }}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.name}</div>
                  <div className="text-xs font-mono" style={{ color: C.faint }}>{money(item.price)} each</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => changeQty(item.id, -1)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: C.panelAlt }}>
                    <Minus size={13} style={{ color: C.text }} />
                  </button>
                  <span className="w-6 text-center text-sm font-mono">{item.qty}</span>
                  <button onClick={() => changeQty(item.id, 1)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: C.panelAlt }}>
                    <Plus size={13} style={{ color: C.text }} />
                  </button>
                </div>
                <div className="w-20 text-right text-sm font-mono font-semibold">{money(item.price * item.qty)}</div>
                <button onClick={() => removeItem(item.id)}><X size={15} style={{ color: C.faint }} /></button>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 border-t" style={{ borderColor: C.cardBorder }}>
            <div className="flex justify-between text-sm mb-1" style={{ color: C.muted }}>
              <span>Subtotal</span><span className="font-mono">{money(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-sm mb-2" style={{ color: C.muted }}>
              <div className="flex items-center gap-2">
                <span>Discount</span>
                <div className="flex gap-1">
                  {[0, 5, 10, 15].map(pct => (
                    <button
                      key={pct}
                      onClick={() => setDiscountPct(pct)}
                      className="text-xs px-2 py-0.5 rounded-md font-semibold"
                      style={{ background: discountPct === pct ? C.lime : C.panelAlt, color: discountPct === pct ? C.ink : C.faint }}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
              <span className="font-mono">-{money(discountAmount)}</span>
            </div>
            <div className="flex justify-between items-baseline mb-3 pt-2 border-t" style={{ borderColor: C.cardBorder }}>
              <span className="text-sm font-bold">Total</span>
              <span className="text-2xl font-mono font-extrabold" style={{ color: C.lime }}>{money(total)}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={holdCart}
                disabled={cart.length === 0}
                className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5"
                style={{ background: C.panelAlt, color: C.text, opacity: cart.length ? 1 : 0.5 }}
              >
                <PauseCircle size={16} strokeWidth={1.8} /> Hold
              </button>
              <button
                onClick={openPayment}
                disabled={cart.length === 0}
                className="flex-[2] py-3 rounded-xl font-extrabold text-sm"
                style={{ background: cart.length ? C.lime : C.panelAlt, color: cart.length ? C.ink : C.faint }}
              >
                Charge {cart.length > 0 ? money(total) : ''}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- TOAST ---------- */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full text-sm font-semibold shadow-xl" style={{ background: C.lime, color: C.ink }}>
          {toast}
        </div>
      )}

      {/* ---------- HELD CARTS DRAWER ---------- */}
      {heldDrawerOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-6 z-40" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setHeldDrawerOpen(false)}>
          <div className="w-full max-w-md rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.cardBorder}` }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="font-bold">Held Carts</div>
              <button onClick={() => setHeldDrawerOpen(false)}><X size={18} style={{ color: C.faint }} /></button>
            </div>
            {heldCarts.length === 0 && <div className="text-sm py-6 text-center" style={{ color: C.faint }}>No carts on hold.</div>}
            {heldCarts.map(h => (
              <div key={h.id} className="flex items-center justify-between py-3 border-b" style={{ borderColor: C.cardBorder }}>
                <div>
                  <div className="text-sm font-medium">{h.items.length} items</div>
                  <div className="text-xs" style={{ color: C.faint }}>{h.time.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })} • {money(h.total)}</div>
                </div>
                <button
                  onClick={() => resumeCart(h)}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg"
                  style={{ background: C.lime, color: C.ink }}
                >
                  <PlayCircle size={14} /> Resume
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------- PAYMENT MODAL ---------- */}
      {paymentOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-6 z-40" style={{ background: 'rgba(0,0,0,0.65)' }}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.cardBorder}` }}>
            <div className="flex justify-between items-center mb-4">
              <div className="font-bold text-lg">Charge {money(total)}</div>
              <button onClick={() => setPaymentOpen(false)}><X size={18} style={{ color: C.faint }} /></button>
            </div>

            <div className="flex gap-2 mb-4">
              {[
                { key: 'cash', label: 'Cash', icon: Banknote },
                { key: 'card', label: 'Card', icon: CreditCard },
                { key: 'qr', label: 'LankaQR', icon: QrCode },
              ].map(m => (
                <button
                  key={m.key}
                  onClick={() => setPaymentMethod(m.key)}
                  className="flex-1 py-2.5 rounded-xl flex flex-col items-center gap-1 text-xs font-semibold"
                  style={{ background: paymentMethod === m.key ? C.lime : C.panelAlt, color: paymentMethod === m.key ? C.ink : C.muted }}
                >
                  <m.icon size={17} strokeWidth={1.7} /> {m.label}
                </button>
              ))}
            </div>

            {paymentMethod === 'cash' ? (
              <>
                <div className="rounded-xl px-4 py-3 mb-3 text-right" style={{ background: C.panelAlt }}>
                  <div className="text-xs" style={{ color: C.faint }}>Tendered</div>
                  <div className="text-2xl font-mono font-bold">{cashInput ? 'Rs. ' + cashInput : 'Rs. 0'}</div>
                </div>
                <div className="flex gap-2 mb-3">
                  {[total, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500, Math.ceil(total / 1000) * 1000]
                    .filter((v, i, arr) => arr.indexOf(v) === i)
                    .slice(0, 3)
                    .map(v => (
                      <button key={v} onClick={() => setCashInput(String(v))} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ background: C.panelAlt, color: C.text }}>
                        {money(v)}
                      </button>
                    ))}
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'].map(k => (
                    <KeypadButton key={k} subtle={k === 'back'} onClick={() => keypadPress(k)}>
                      {k === 'back' ? <Delete size={18} /> : k}
                    </KeypadButton>
                  ))}
                </div>
                <div className="flex justify-between text-sm mb-4 px-1">
                  <span style={{ color: C.muted }}>Change due</span>
                  <span className="font-mono font-bold" style={{ color: C.lime }}>{money(changeDue)}</span>
                </div>
              </>
            ) : (
              <div className="rounded-xl p-6 mb-4 text-center text-sm" style={{ background: C.panelAlt, color: C.muted }}>
                {paymentMethod === 'card' ? 'Present card on terminal.' : 'Show QR code to customer.'}
              </div>
            )}

            {chargeError && (
              <div className="flex items-start gap-2 rounded-xl p-3 mb-3" style={{ background: 'rgba(224,138,107,0.1)', border: `1px solid ${C.danger}` }}>
                <AlertCircle size={16} style={{ color: C.danger, flexShrink: 0, marginTop: 2 }} />
                <div className="text-xs" style={{ color: C.danger }}>{chargeError}</div>
              </div>
            )}

            <button
              onClick={completeSale}
              disabled={charging || (paymentMethod === 'cash' && cashTendered < total)}
              className="w-full py-3.5 rounded-xl font-extrabold text-base"
              style={{
                background: (!charging && (paymentMethod !== 'cash' || cashTendered >= total)) ? C.lime : C.panelAlt,
                color: (!charging && (paymentMethod !== 'cash' || cashTendered >= total)) ? C.ink : C.faint,
              }}
            >
              {charging ? 'Saving sale…' : 'Confirm Payment'}
            </button>
          </div>
        </div>
      )}

      {/* ---------- RECEIPT ---------- */}
      {receipt && (
        <div className="fixed inset-0 flex items-center justify-center p-6 z-50" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <style>{`@keyframes receiptSlideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, animation: 'receiptSlideUp .35s cubic-bezier(.2,.9,.3,1)' }}
          >
            <div className="flex flex-col items-center mb-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: C.lime }}>
                <Check size={26} strokeWidth={2.2} style={{ color: C.ink }} />
              </div>
              <div className="font-bold text-lg">Sale Complete</div>
              <div className="text-xs" style={{ color: C.faint }}>{receipt.number} • {receipt.time.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}</div>
              <div className="text-xs mt-0.5" style={{ color: C.faint }}>Served by Priyantha Kumara</div>
            </div>

            <div className="rounded-xl p-4 mb-4" style={{ background: C.panelAlt }}>
              {receipt.items.map(i => (
                <div key={i.id} className="flex justify-between text-sm py-1">
                  <span style={{ color: C.muted }}>{i.qty} × {i.name}</span>
                  <span className="font-mono">{money(i.price * i.qty)}</span>
                </div>
              ))}
              {receipt.discountPct > 0 && (
                <div className="flex justify-between text-sm py-1" style={{ color: C.muted }}>
                  <span>Discount ({receipt.discountPct}%)</span>
                  <span className="font-mono">-{money(receipt.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-2 mt-2 border-t" style={{ borderColor: C.cardBorder }}>
                <span>Total</span><span className="font-mono" style={{ color: C.lime }}>{money(receipt.total)}</span>
              </div>
              <div className="flex justify-between text-xs pt-2" style={{ color: C.faint }}>
                <span className="capitalize">{receipt.method}</span>
                <span>{receipt.method === 'cash' ? `Tendered ${money(receipt.tendered)} • Change ${money(receipt.change)}` : 'Paid in full'}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs mb-4" style={{ color: C.faint }}>
              <Receipt size={13} /> Sent to WhatsApp / printed receipt would go here
            </div>

            <button onClick={newSale} className="w-full py-3 rounded-xl font-extrabold text-sm" style={{ background: C.lime, color: C.ink }}>
              New Sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

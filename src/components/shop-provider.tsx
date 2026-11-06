'use client';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import type {
  Prisma,
  Address,
  Wishlist,
  Membership,
  Subscription,
  Alert,
  Notification,
  SupportTicket,
  GiftCard,
  GiftTransaction,
  Coupon,
  SellerApplication,
  AuditLog,
  Inventory,
  ReturnRequest,
  Review,
  Question,
} from '@prisma/client';
import { findOffer, type CartLine } from '@/lib/catalog';
import type { Actor } from '@/lib/session';
export type Order = Prisma.OrderGetPayload<{
  include: { items: true; shipments: true; payment: true };
}>;
export type ShopData = {
  actor: Actor;
  cart: CartLine[];
  lists: Wishlist[];
  orders: Order[];
  addresses: Address[];
  membership: Membership;
  subscriptions: Subscription[];
  alerts: Alert[];
  notifications: Notification[];
  support: SupportTicket[];
  giftCards: GiftCard[];
  giftTransactions: GiftTransaction[];
  coupons: Coupon[];
  applications: SellerApplication[];
  audit: AuditLog[];
  inventory: Inventory[];
  settings: Record<string, string | boolean | number>;
  returns: ReturnRequest[];
  reviews: Review[];
  questions: Question[];
  demo: boolean;
  stripeEnabled: boolean;
};
type Context = {
  data: ShopData | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  run: (action: string, payload?: Record<string, unknown>, message?: string) => Promise<unknown>;
  add: (offerId: string, quantity?: number) => Promise<void>;
  cart: (items: CartLine[]) => Promise<void>;
  notify: (text: string) => void;
  currency: string;
  setCurrency: (v: string) => void;
};
const ShopContext = createContext<Context | null>(null);
export function ShopProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [currency, setCurrency] = useState('SEK');
  const pending = useRef<Promise<void> | null>(null);
  const refresh = useCallback(() => {
    if (pending.current) return pending.current;
    pending.current = (async () => {
      try {
        const response = await fetch('/api/shop');
        const value = await response.json();
        if (!response.ok) throw Error(value.error);
        setData(value);
        setError('');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Kunde inte hämta butiken.');
      } finally {
        setLoading(false);
        pending.current = null;
      }
    })();
    return pending.current;
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  async function run(action: string, payload: Record<string, unknown> = {}, message?: string) {
    const response = await fetch('/api/shop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    });
    const value = await response.json();
    if (!response.ok) {
      setToast(value.error || 'Något gick fel.');
      throw Error(value.error);
    }
    await refresh();
    if (message) setToast(message);
    return value;
  }
  async function cart(items: CartLine[]) {
    await run('cart', { items });
  }
  async function add(offerId: string, quantity = 1) {
    const offer = findOffer(offerId);
    if (!offer) return;
    const old = data?.cart || [];
    const existing = old.find((l) => l.offerId === offerId);
    const items = existing
      ? old.map((l) =>
          l.offerId === offerId ? { ...l, quantity: Math.min(10, l.quantity + quantity) } : l,
        )
      : [...old, { offerId, quantity, selected: true }];
    await cart(items);
    setToast('Tillagd i varukorgen');
  }
  return (
    <ShopContext.Provider
      value={{
        data,
        loading,
        error,
        refresh,
        run,
        add,
        cart,
        notify: setToast,
        currency,
        setCurrency,
      }}
    >
      {error && (
        <div className="connection-error">
          {error} <button onClick={() => void refresh()}>Försök igen</button>
        </div>
      )}
      {children}
      {toast && (
        <div className="toast" role="status">
          <span>✓</span>
          {toast}
          <button aria-label="Stäng meddelande" onClick={() => setToast('')}>
            ×
          </button>
        </div>
      )}
    </ShopContext.Provider>
  );
}
export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw Error('Missing ShopProvider');
  return ctx;
}

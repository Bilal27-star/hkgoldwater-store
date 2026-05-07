import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction
} from "react";
import { addToCartApi, clearCartApi, getCartApi, removeCartItemApi } from "../api";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

const STORAGE_KEY = "gold_water_cart_items_v1";

function resolveCartName(value: unknown): string {
  if (typeof value === "string") return value.trim() || "No name";
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const candidate = obj.en ?? obj.fr ?? obj.ar;
    return typeof candidate === "string" && candidate.trim() ? candidate.trim() : "No name";
  }
  return "No name";
}

function sanitizeCartItems(input: unknown): CartItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item: any) => {
      if (!item || typeof item !== "object") return null;
      const id = String(item.id ?? "").trim();
      if (!id) return null;
      const quantityNum = Number(item.quantity);
      const quantity = Number.isFinite(quantityNum) && quantityNum > 0 ? Math.trunc(quantityNum) : 1;
      const priceNum = Number(item.price);
      const price = Number.isFinite(priceNum) ? priceNum : 0;
      const image = typeof item.image === "string" && item.image.trim() ? item.image : "";
      return {
        id,
        name: resolveCartName(item.name),
        price,
        image,
        quantity
      } satisfies CartItem;
    })
    .filter((item): item is CartItem => item !== null);
}

/** Must match DB product id (UUID string); never coerce with Number(). */
export function normalizeCartProductId(id: string): string {
  return String(id ?? "").trim();
}

function readStoredCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const legacyRaw = localStorage.getItem("cart");
    console.log("[cart] localStorage cart:", raw);
    const parsed = JSON.parse(raw || legacyRaw || "[]") as unknown;
    return sanitizeCartItems(parsed);
  } catch {
    return [];
  }
}

type AddToCartPayload = {
  id: string;
  name: string;
  price: number;
  image: string;
  /** Defaults to 1. Adds this many units (merges with existing line item). */
  quantity?: number;
};

type CartContextValue = {
  cart: CartItem[];
  items: CartItem[];
  setCart: Dispatch<SetStateAction<CartItem[]>>;
  addToCart: (payload: AddToCartPayload) => Promise<void>;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  totalItems: number;
  /** Ensures Supabase cart rows exist before POST /orders (backend ignores body.products). */
  ensureServerCartForCheckout: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readStoredCart());

  useEffect(() => {
    try {
      if (items.length === 0) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota / private mode
    }
  }, [items]);

  useEffect(() => {
    console.log("[cart] cart count:", items.reduce((acc, i) => acc + i.quantity, 0), "items:", items);
  }, [items]);

  const syncCartFromApi = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const data = await getCartApi();
    console.log("[cart] fetched cart:", data);
    const rows = Array.isArray(data?.items) ? data.items : [];
    const mapped = sanitizeCartItems(
      rows.map((item: any) => ({
        id: item.product_id,
        name: item.products?.name,
        price: item.products?.price,
        image: item.products?.image || item.products?.image_url || "https://via.placeholder.com/400",
        quantity: item.quantity
      }))
    );
    setItems(mapped);
  }, []);

  useEffect(() => {
    async function loadCart() {
      try {
        await syncCartFromApi();
      } catch {
        // Ignore API cart load failures to avoid breaking UI.
      }
    }
    loadCart();
  }, [syncCartFromApi]);

  const ensureServerCartForCheckout = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    console.log("CART STATE:", items);
    if (items.length === 0) return;

    const data = await getCartApi();
    const serverRows = Array.isArray(data?.items) ? data.items : [];
    if (serverRows.length > 0) return;

    for (const line of items) {
      const productId = normalizeCartProductId(line.id);
      if (!productId) {
        throw new Error("Invalid cart data");
      }
      await addToCartApi({
        productId,
        quantity: line.quantity
      });
    }
  }, [items]);

  const removeFromCart = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((p) => p.id !== id));
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("[cart] remove action result:", { productId: id, backend: "skipped-no-token" });
        return;
      }
      void (async () => {
        try {
          const result = await removeCartItemApi(normalizeCartProductId(id));
          console.log("[cart] remove action result:", { productId: id, backend: result });
          await syncCartFromApi();
        } catch (err) {
          console.error("[cart] remove failed:", err);
          await syncCartFromApi();
        }
      })();
    },
    [syncCartFromApi]
  );

  const addToCart = useCallback(
    async (payload: AddToCartPayload) => {
      const qty = Math.max(1, payload.quantity ?? 1);
      const { id, name, price, image } = payload;
      setItems((prev) => {
        const existing = prev.find((p) => p.id === id);
        if (existing) {
          return prev.map((p) =>
            p.id === id ? { ...p, quantity: p.quantity + qty } : p
          );
        }
        return [...prev, { id, name, price, image, quantity: qty }];
      });
      try {
        await addToCartApi({
          productId: normalizeCartProductId(id),
          quantity: qty
        });
        await syncCartFromApi();
      } catch {
        // Keep local cart state as fallback.
      }
    },
    [syncCartFromApi]
  );

  const updateQuantity = useCallback(
    async (id: string, quantity: number) => {
      if (quantity < 1) {
        removeFromCart(id);
        return;
      }
      setItems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, quantity } : p))
      );
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    const token = localStorage.getItem("token");
    if (!token) return;
    void (async () => {
      try {
        const result = await clearCartApi();
        console.log("[cart] remove action result:", { action: "clear", backend: result });
        await syncCartFromApi();
      } catch (err) {
        console.error("[cart] clear failed:", err);
        await syncCartFromApi();
      }
    })();
  }, [syncCartFromApi]);

  const totalItems = useMemo(
    () => items.reduce((acc, i) => acc + i.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      cart: items,
      items,
      setCart: setItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      ensureServerCartForCheckout
    }),
    [
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      ensureServerCartForCheckout
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}

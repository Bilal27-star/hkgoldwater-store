import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { createProductApi, deleteProductApi, getCategories, getProductsApi } from "../../api";
import { ADMIN_DATA_STORAGE_KEY } from "../constants";
import {
  defaultSettings,
  seedCategories,
  seedCustomers,
  seedOrders
} from "../seedData";
import type {
  AdminCategory,
  AdminCustomer,
  AdminOrder,
  AdminProduct,
  OrderStatus,
  SiteSettings
} from "../types";

type AdminStore = {
  products: AdminProduct[];
  categories: AdminCategory[];
  orders: AdminOrder[];
  customers: AdminCustomer[];
  settings: SiteSettings;
};

function loadStore(): AdminStore {
  try {
    const raw = localStorage.getItem(ADMIN_DATA_STORAGE_KEY);
    if (!raw) throw new Error("empty");
    return JSON.parse(raw) as AdminStore;
  } catch {
    return {
      products: [],
      categories: [...seedCategories],
      orders: [...seedOrders],
      customers: [...seedCustomers],
      settings: { ...defaultSettings }
    };
  }
}

function saveStore(store: AdminStore) {
  localStorage.setItem(ADMIN_DATA_STORAGE_KEY, JSON.stringify(store));
}

type AdminDataContextValue = {
  products: AdminProduct[];
  productsLoading: boolean;
  productsError: string | null;
  categories: AdminCategory[];
  orders: AdminOrder[];
  customers: AdminCustomer[];
  settings: SiteSettings;
  addProduct: (p: Omit<AdminProduct, "id" | "createdAt" | "updatedAt">) => Promise<AdminProduct>;
  updateProduct: (id: string, patch: Partial<AdminProduct>) => void;
  deleteProduct: (id: string) => Promise<void>;
  addCategory: (name: string) => AdminCategory;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  updateSettings: (patch: Partial<SiteSettings>) => void;
  /** Recalculate customer aggregates from orders (optional utility) */
  refreshCustomerStats: () => void;
};

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<AdminStore>(() => loadStore());
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const resolveLocalizedText = useCallback((value: unknown) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const record = value as Record<string, unknown>;
      return String(record.en || record.fr || record.ar || "");
    }
    return String(value || "");
  }, []);

  const mapApiProductToAdminProduct = useCallback(
    (item: any): AdminProduct => ({
      id: String(item.id),
      name: resolveLocalizedText(item.name) || item.title || "Product",
      price: Number(item.price || 0),
      image: item.image_url || item.image || "",
      categoryId: String(item.category_id || ""),
      brandId: String(item.brand_id || ""),
      brand: item.brand || "",
      stock: Number(item.stock || 0),
      description: resolveLocalizedText(item.description),
      createdAt: item.created_at || new Date().toISOString(),
      updatedAt: item.updated_at || item.created_at || new Date().toISOString()
    }),
    [resolveLocalizedText]
  );

  const mapApiCategoryToAdminCategory = useCallback(
    (item: any): AdminCategory => ({
      id: String(item.id),
      name: item.name || "Category",
      slug:
        typeof item.slug === "string" && item.slug.trim()
          ? item.slug.trim()
          : String(item.name || "category")
              .toLowerCase()
              .trim()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, "")
    }),
    []
  );

  useEffect(() => {
    saveStore(store);
  }, [store]);

  const setAndPersist = useCallback((updater: (prev: AdminStore) => AdminStore) => {
    setStore((prev) => updater(prev));
  }, []);

  const refreshProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const data = await getProductsApi();
      const rows = Array.isArray(data)
        ? data
        : data && typeof data === "object" && Array.isArray((data as { items?: unknown[] }).items)
          ? (data as { items: any[] }).items
          : [];
      setAndPersist((s) => ({
        ...s,
        products: rows.map((row: any) => mapApiProductToAdminProduct(row))
      }));
    } catch (error) {
      console.error("[admin.products] refresh failed", error);
      setProductsError("Failed to load products.");
    } finally {
      setProductsLoading(false);
    }
  }, [mapApiProductToAdminProduct, setAndPersist]);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  const refreshCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      const rows = Array.isArray(data)
        ? data
        : data && typeof data === "object" && Array.isArray((data as { items?: unknown[] }).items)
          ? (data as { items: any[] }).items
          : [];
      setAndPersist((s) => ({
        ...s,
        categories: rows.map((row: any) => mapApiCategoryToAdminCategory(row))
      }));
    } catch (error) {
      console.error("[admin.categories] refresh failed", error);
    }
  }, [mapApiCategoryToAdminCategory, setAndPersist]);

  useEffect(() => {
    refreshCategories();
  }, [refreshCategories]);

  const addProduct = useCallback(
    async (p: Omit<AdminProduct, "id" | "createdAt" | "updatedAt">) => {
      const payload = {
        name: p.name,
        description: p.description || undefined,
        price: p.price,
        stock: p.stock,
        category_id: p.categoryId,
        brand_id: p.brandId || undefined,
        image_url: p.image || undefined
      };
      console.log("Creating product:", payload);
      const created = await createProductApi(payload);
      const mapped = mapApiProductToAdminProduct(created);
      setAndPersist((s) => ({ ...s, products: [mapped, ...s.products] }));
      return mapped;
    },
    [mapApiProductToAdminProduct, setAndPersist]
  );

  const updateProduct = useCallback(
    (id: string, patch: Partial<AdminProduct>) => {
      setAndPersist((s) => ({
        ...s,
        products: s.products.map((pr) =>
          pr.id === id
            ? { ...pr, ...patch, updatedAt: new Date().toISOString() }
            : pr
        )
      }));
    },
    [setAndPersist]
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      await deleteProductApi(id);
      setAndPersist((s) => ({
        ...s,
        products: s.products.filter((p) => p.id !== id)
      }));
    },
    [setAndPersist]
  );

  const slugify = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

  const addCategory = useCallback(
    (name: string) => {
      const cat: AdminCategory = {
        id: crypto.randomUUID(),
        name: name.trim(),
        slug: slugify(name) || `cat-${Date.now()}`
      };
      setAndPersist((s) => ({ ...s, categories: [...s.categories, cat] }));
      return cat;
    },
    [setAndPersist]
  );

  const updateCategory = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim();
      setAndPersist((s) => ({
        ...s,
        categories: s.categories.map((c) =>
          c.id === id ? { ...c, name: trimmed, slug: slugify(trimmed) || c.slug } : c
        )
      }));
    },
    [setAndPersist]
  );

  const deleteCategory = useCallback(
    (id: string) => {
      setAndPersist((s) => ({
        ...s,
        categories: s.categories.filter((c) => c.id !== id),
        products: s.products.map((p) =>
          p.categoryId === id ? { ...p, categoryId: "" } : p
        )
      }));
    },
    [setAndPersist]
  );

  const updateOrderStatus = useCallback(
    (id: string, status: OrderStatus) => {
      setAndPersist((s) => ({
        ...s,
        orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o))
      }));
    },
    [setAndPersist]
  );

  const updateSettings = useCallback(
    (patch: Partial<SiteSettings>) => {
      setAndPersist((s) => ({
        ...s,
        settings: { ...s.settings, ...patch }
      }));
    },
    [setAndPersist]
  );

  const refreshCustomerStats = useCallback(() => {
    setAndPersist((s) => {
      const map = new Map<string, { ordersCount: number; totalSpent: number }>();
      for (const o of s.orders) {
        const key = o.email.toLowerCase();
        const prev = map.get(key) ?? { ordersCount: 0, totalSpent: 0 };
        map.set(key, {
          ordersCount: prev.ordersCount + 1,
          totalSpent: prev.totalSpent + o.total
        });
      }
      const customers = s.customers.map((c) => {
        const agg = map.get(c.email.toLowerCase());
        if (!agg) return c;
        return { ...c, ordersCount: agg.ordersCount, totalSpent: agg.totalSpent };
      });
      return { ...s, customers };
    });
  }, [setAndPersist]);

  const value = useMemo<AdminDataContextValue>(
    () => ({
      products: store.products,
      productsLoading,
      productsError,
      categories: store.categories,
      orders: store.orders,
      customers: store.customers,
      settings: store.settings,
      addProduct,
      updateProduct,
      deleteProduct,
      addCategory,
      updateCategory,
      deleteCategory,
      updateOrderStatus,
      updateSettings,
      refreshCustomerStats
    }),
    [
      store,
      productsLoading,
      productsError,
      addProduct,
      updateProduct,
      deleteProduct,
      addCategory,
      updateCategory,
      deleteCategory,
      updateOrderStatus,
      updateSettings,
      refreshCustomerStats
    ]
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData must be used within AdminDataProvider");
  return ctx;
}

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";
import CategoryModal from "../components/products/CategoryModal";
import FiltersBar, { type ProductFiltersState } from "../components/products/FiltersBar";
import ProductDrawer from "../components/products/ProductDrawer";
import ProductsEmptyState from "../components/products/ProductsEmptyState";
import ProductsTable from "../components/products/ProductsTable";
import { useAdminData } from "../context/AdminDataContext";
import type { AdminProduct } from "../types";

const PAGE_SIZE = 10;

const defaultFilters: ProductFiltersState = {
  search: "",
  categoryId: "",
  priceMin: "",
  priceMax: ""
};

type DrawerState = {
  open: boolean;
  mode: "create" | "edit" | "view";
  product: AdminProduct | null;
};

export default function Products() {
  const { products, productsLoading, productsError, categories, deleteProduct, addCategory } = useAdminData();
  const [filters, setFilters] = useState<ProductFiltersState>(defaultFilters);
  const [page, setPage] = useState(1);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [drawer, setDrawer] = useState<DrawerState>({
    open: false,
    mode: "create",
    product: null
  });
  const [pendingDelete, setPendingDelete] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState(false);

  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])) as Record<string, string>,
    [categories]
  );

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const minRaw = filters.priceMin.trim();
    const maxRaw = filters.priceMax.trim();
    const min = minRaw === "" ? null : Number(minRaw);
    const max = maxRaw === "" ? null : Number(maxRaw);

    return products.filter((p) => {
      if (filters.categoryId && p.categoryId !== filters.categoryId) return false;

      if (q) {
        const nameMatch = p.name.toLowerCase().includes(q);
        const descMatch = (p.description ?? "").toLowerCase().includes(q);
        const catName = categoryNames[p.categoryId] ?? "";
        const catMatch = catName.toLowerCase().includes(q);
        if (!nameMatch && !descMatch && !catMatch) return false;
      }

      if (min !== null && !Number.isNaN(min) && p.price < min) return false;
      if (max !== null && !Number.isNaN(max) && p.price > max) return false;

      return true;
    });
  }, [products, filters, categoryNames]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageSlice = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  function openCreate() {
    setDrawer({ open: true, mode: "create", product: null });
  }

  function openEdit(p: AdminProduct) {
    setDrawer({ open: true, mode: "edit", product: p });
  }

  function openView(p: AdminProduct) {
    setDrawer({ open: true, mode: "view", product: p });
  }

  function closeDrawer() {
    setDrawer((d) => ({ ...d, open: false, product: null }));
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteProduct(pendingDelete.id);
      toast.success("Product deleted");
      setPendingDelete(null);
    } catch (error) {
      console.error("[admin.products] delete failed", error);
      toast.error("Failed to delete product");
    } finally {
      setDeleting(false);
    }
  }

  function handleFiltersChange(next: ProductFiltersState) {
    setFilters(next);
    setPage(1);
  }

  const hasNoProductsEver = products.length === 0;
  const noMatches = !hasNoProductsEver && filtered.length === 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#0B3D91] md:text-3xl">
          Products Management
        </h1>
        <p className="text-sm text-slate-600 md:text-base">
          Manage your store products, pricing, and inventory
        </p>
      </header>

      <FiltersBar
        categories={categories}
        filters={filters}
        onChange={handleFiltersChange}
        onAddProduct={openCreate}
        onNewCategory={() => setCategoryModalOpen(true)}
      />

      {productsLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <p className="font-medium text-slate-900">Loading products...</p>
        </div>
      ) : productsError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-14 text-center shadow-sm">
          <p className="font-medium text-red-700">{productsError}</p>
        </div>
      ) : hasNoProductsEver ? (
        <ProductsEmptyState onAddProduct={openCreate} />
      ) : noMatches ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <p className="font-medium text-slate-900">No products match your filters</p>
          <p className="mt-2 text-sm text-slate-500">
            Try adjusting search or category and price range.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilters(defaultFilters);
              setPage(1);
            }}
            className="mt-6 text-sm font-semibold text-[#1565C0] hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <ProductsTable
            products={pageSlice}
            categoryNames={categoryNames}
            onEdit={openEdit}
            onDelete={setPendingDelete}
            onView={openView}
          />
          {filtered.length > PAGE_SIZE && (
            <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm sm:flex-row">
              <p className="tabular-nums">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium transition enabled:hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="tabular-nums text-slate-500">
                  Page {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium transition enabled:hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <ProductDrawer
        open={drawer.open}
        mode={drawer.mode}
        product={drawer.product}
        onClose={closeDrawer}
        onSaved={() => {
          setPage(1);
        }}
      />

      <CategoryModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSave={(name) => {
          const cat = addCategory(name);
          toast.success(`Category "${cat.name}" created`);
          return cat;
        }}
        onCreated={(cat) => {
          setFilters((f) => ({ ...f, categoryId: cat.id }));
        }}
      />

      <ConfirmModal
        open={!!pendingDelete}
        title="Delete product?"
        message="Are you sure you want to delete this product?"
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/shared/lib/supabase";
import type { Customer, Supplier } from "@/shared/types";
import { SupabaseMasterDataRepository } from "../infrastructure/SupabaseMasterDataRepository";
export function useMasterDataController(refreshKey: number) {
  const repo = useMemo(() => new SupabaseMasterDataRepository(supabase), []);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    const v = await repo.load();
    setSuppliers(v.suppliers);
    setCustomers(v.customers);
    setCategories(v.categories);
  }, [repo]);
  useEffect(() => {
    let active = true;
    void repo
      .load()
      .then((v) => {
        if (active) {
          setSuppliers(v.suppliers);
          setCustomers(v.customers);
          setCategories(v.categories);
        }
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Failed to load master data",
          );
      });
    return () => {
      active = false;
    };
  }, [refreshKey, repo]);
  const run = useCallback(
    async (action: () => Promise<void>) => {
      await action();
      await reload();
    },
    [reload],
  );
  return {
    suppliers,
    customers,
    categories,
    error,
    addSupplier: (v: Omit<Supplier, "id">) => run(() => repo.addSupplier(v)),
    addCustomer: (v: Omit<Customer, "id">) => run(() => repo.addCustomer(v)),
    remove: (t: "suppliers" | "customers", id: string) =>
      run(() => repo.remove(t, id)),
    addCategory: (n: string) => run(() => repo.addCategory(n)),
    removeCategory: (n: string) => run(() => repo.removeCategory(n)),
  };
}

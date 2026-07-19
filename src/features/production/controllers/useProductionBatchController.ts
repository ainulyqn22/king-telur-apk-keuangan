import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/shared/lib/supabase";
import type { BatchStatus, ProductionBatch, StockState } from "@/shared/types";
import { ProductionBatchService } from "../application/ProductionBatchService";
import type { CreateProductionBatchCommand } from "../domain/ProductionBatchRepository";
import { SupabaseProductionBatchRepository } from "../infrastructure/SupabaseProductionBatchRepository";

export function useProductionBatchController() {
  const service = useMemo(
    () =>
      new ProductionBatchService(
        new SupabaseProductionBatchRepository(supabase),
      ),
    [],
  );
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [rawStock, setRawStock] = useState<StockState>({ qty: 0, avgCost: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const value = await service.getSnapshot();
      setBatches(value.batches);
      setRawStock(value.rawStock);
    } catch (cause: unknown) {
      setError(
        cause instanceof Error ? cause.message : "Failed to load batches",
      );
    } finally {
      setLoading(false);
    }
  }, [service]);
  useEffect(() => {
    let active = true;
    void service
      .getSnapshot()
      .then((value) => {
        if (active) {
          setBatches(value.batches);
          setRawStock(value.rawStock);
        }
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Failed to load batches",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [service]);
  const create = useCallback(
    async (command: CreateProductionBatchCommand) => {
      setSaving(true);
      try {
        const value = await service.create(command);
        await reload();
        return value;
      } finally {
        setSaving(false);
      }
    },
    [reload, service],
  );
  const transition = useCallback(
    async (id: string, status: BatchStatus) => {
      setSaving(true);
      try {
        const value = await service.transition(id, status);
        await reload();
        return value;
      } finally {
        setSaving(false);
      }
    },
    [reload, service],
  );
  return {
    batches,
    rawStock,
    loading,
    saving,
    error,
    reload,
    create,
    transition,
  };
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../shared/supabase';
import { PurchaseService } from '../application/PurchaseService';
import type { PurchaseSnapshot, RecordRawEggPurchaseCommand } from '../domain/Purchase';
import { SupabasePurchaseRepository } from '../infrastructure/SupabasePurchaseRepository';

const emptySnapshot: PurchaseSnapshot = {
  suppliers: [],
  purchases: [],
  stock: { qty: 0, avgCost: 0 },
};

export function usePurchaseController() {
  const service = useMemo(
    () => new PurchaseService(new SupabasePurchaseRepository(supabase)),
    [],
  );
  const [snapshot, setSnapshot] = useState<PurchaseSnapshot>(emptySnapshot);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSnapshot(await service.getSnapshot());
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Failed to load purchases');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    let active = true;
    void service.getSnapshot()
      .then((nextSnapshot) => { if (active) setSnapshot(nextSnapshot); })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Failed to load purchases');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [service]);

  const record = useCallback(async (command: RecordRawEggPurchaseCommand) => {
    setSaving(true);
    try {
      const result = await service.record(command);
      await reload();
      return result;
    } finally {
      setSaving(false);
    }
  }, [reload, service]);

  return { ...snapshot, loading, saving, error, reload, record };
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/shared/lib/supabase";
import type { FarmProduction, Settings } from "@/shared/types";
import type { RecordFarmProductionCommand } from "../domain/FarmProductionRepository";
import { SupabaseFarmProductionRepository } from "../infrastructure/SupabaseFarmProductionRepository";
export function useFarmProductionController(refreshKey: number) {
  const repo = useMemo(
    () => new SupabaseFarmProductionRepository(supabase),
    [],
  );
  const [productions, setProductions] = useState<FarmProduction[]>([]);
  const [settings, setSettings] = useState<Settings>({
    shopName: "HouseERP",
    logo: "",
    currency: "Rp",
    defaultTransferPrice: 2000,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    const value = await repo.load();
    setProductions(value.productions);
    setSettings(value.settings);
  }, [repo]);
  useEffect(() => {
    let active = true;
    void repo
      .load()
      .then((value) => {
        if (active) {
          setProductions(value.productions);
          setSettings(value.settings);
        }
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Failed to load production",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey, repo]);
  const record = useCallback(
    async (c: RecordFarmProductionCommand) => {
      const value = await repo.record(c);
      await reload();
      return value;
    },
    [reload, repo],
  );
  return { productions, settings, loading, error, record };
}

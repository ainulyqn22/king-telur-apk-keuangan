import type { FarmProduction, Settings } from "@/shared/types";
export type RecordFarmProductionCommand = Omit<FarmProduction, "id">;
export interface FarmProductionRepository {
  load(): Promise<{ productions: FarmProduction[]; settings: Settings }>;
  record(command: RecordFarmProductionCommand): Promise<FarmProduction>;
}

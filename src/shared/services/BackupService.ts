import type { z } from 'zod';
import type { IStorageRepository } from '../repositories/StorageRepository';
import { BackupRecoveryError, BackupValidationError } from '../errors/CustomErrors';
import { BackupSchema } from '../validators/BackupSchema';

export type BackupData = z.infer<typeof BackupSchema>;

function captureRepository(repo: IStorageRepository): BackupData {
  return BackupSchema.parse({
    settings: repo.getSettings(),
    suppliers: repo.getSuppliers(),
    customers: repo.getCustomers(),
    stock_raw: repo.getRawStock(),
    stock_salted: repo.getSaltedStock(),
    farm_production: repo.getFarmProductions(),
    raw_transactions: repo.getRawTransactions(),
    production_batches: repo.getProductionBatches(),
    production_transactions: repo.getSaltedTransactions(),
    sales: repo.getSales(),
    operational_costs: repo.getOperationalCosts(),
    categories: repo.getCategories(),
    activity_logs: repo.getActivityLogs(),
    backup_version: '1.0',
  });
}

function applyBackup(repo: IStorageRepository, data: BackupData): void {
  repo.saveSettings(data.settings);
  repo.saveSuppliers(structuredClone(data.suppliers));
  repo.saveCustomers(structuredClone(data.customers));
  repo.saveRawStock(structuredClone(data.stock_raw));
  repo.saveSaltedStock(structuredClone(data.stock_salted));
  repo.saveFarmProductions(structuredClone(data.farm_production));
  repo.saveRawTransactions(structuredClone(data.raw_transactions));
  repo.saveProductionBatches(structuredClone(data.production_batches));
  repo.saveSaltedTransactions(structuredClone(data.production_transactions));
  repo.saveSales(structuredClone(data.sales));
  repo.saveOperationalCosts(structuredClone(data.operational_costs));
  repo.saveCategories(structuredClone(data.categories));
  repo.saveActivityLogs(structuredClone(data.activity_logs));
}

function parseBackup(jsonString: string): BackupData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString) as unknown;
  } catch (error) {
    throw new BackupValidationError('Berkas backup bukan JSON yang valid.', { cause: error });
  }

  const result = BackupSchema.safeParse(parsed);
  if (!result.success) {
    throw new BackupValidationError('Berkas backup tidak valid atau tidak kompatibel.', {
      cause: result.error,
    });
  }
  return result.data;
}

export class BackupService {
  constructor(private readonly repo: IStorageRepository) {}

  create(): string {
    return JSON.stringify(captureRepository(this.repo), null, 2);
  }

  restore(jsonString: string, afterRestore?: () => void): void {
    // Parse and validate the complete payload before reading or changing current state.
    const incoming = parseBackup(jsonString);
    const snapshot = structuredClone(captureRepository(this.repo));

    try {
      applyBackup(this.repo, incoming);
      afterRestore?.();
    } catch (restoreError) {
      try {
        applyBackup(this.repo, snapshot);
      } catch (rollbackError) {
        throw new BackupRecoveryError(
          'Restore gagal dan data sebelumnya tidak dapat dipulihkan secara otomatis.',
          { cause: new AggregateError([restoreError, rollbackError]) },
        );
      }
      throw new BackupRecoveryError('Restore gagal; data sebelumnya telah dipulihkan.', {
        cause: restoreError,
      });
    }
  }
}

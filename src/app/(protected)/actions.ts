'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { siteUrl } from '@/lib/env';
import { formNumber, formText, redirectError, redirectOk } from '@/lib/form';
import { logServerRedirect } from '@/lib/redirect-log';
import { erpRepository } from '@/services/erp-service';
import { requirePermission } from '@/services/auth-service';
import type { BatchStatus, CustomerType, EggType } from '@/types/erp';
import type { Role } from '@/types/rbac';
import { employeeAssignablePermissions } from '@/types/rbac';

const employeePermissionSchema = z.enum([
  'dashboard.read',
  'inventory.manage',
  'purchases.manage',
  'production.manage',
  'sales.manage',
  'expenses.manage',
  'reports.read',
]);

const permissions = z.array(employeePermissionSchema).transform((values) => {
  const assignable = new Set(employeeAssignablePermissions);
  return values.filter((permission) => assignable.has(permission));
});

async function run(path: string, success: string, operation: () => Promise<void>) {
  try {
    await operation();
  } catch (error) {
    await redirectError(path, error);
  }
  revalidatePath(path);
  revalidatePath('/dashboard');
  await redirectOk(path, success);
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  await logServerRedirect({
    pathname: 'unknown',
    destination: '/login',
    reason: 'logout action completed',
    userId: 'signed-out',
  });
  redirect('/login');
}

export async function saveSettingsAction(formData: FormData) {
  await run('/settings', 'Pengaturan tersimpan', async () => {
    await requirePermission('settings.manage');
    const input = z
      .object({
        shopName: z.string().min(1),
        logo: z.string().max(20_000),
        currency: z.string().min(1).max(10),
        defaultTransferPrice: z.number().nonnegative(),
      })
      .parse({
        shopName: formText(formData, 'shopName'),
        logo: formText(formData, 'logo'),
        currency: formText(formData, 'currency') || 'Rp',
        defaultTransferPrice: formNumber(formData, 'defaultTransferPrice'),
      });
    await (await erpRepository()).saveSettings(input);
  });
}

export async function createSupplierAction(formData: FormData) {
  await run('/master-data', 'Supplier dibuat', async () => {
    await requirePermission('inventory.manage');
    const input = z.object({ name: z.string().min(1), address: z.string(), phone: z.string(), notes: z.string() }).parse({
      name: formText(formData, 'name'),
      address: formText(formData, 'address'),
      phone: formText(formData, 'phone'),
      notes: formText(formData, 'notes'),
    });
    await (await erpRepository()).createSupplier(input);
  });
}

export async function updateSupplierAction(formData: FormData) {
  await run('/master-data', 'Supplier diperbarui', async () => {
    await requirePermission('inventory.manage');
    const id = z.string().min(1).parse(formText(formData, 'id'));
    await (await erpRepository()).updateSupplier(id, {
      name: formText(formData, 'name'),
      address: formText(formData, 'address'),
      phone: formText(formData, 'phone'),
      notes: formText(formData, 'notes'),
    });
  });
}

export async function deleteSupplierAction(formData: FormData) {
  await run('/master-data', 'Supplier dihapus', async () => {
    await requirePermission('inventory.manage');
    await (await erpRepository()).deleteSupplier(z.string().min(1).parse(formText(formData, 'id')));
  });
}

export async function createCustomerAction(formData: FormData) {
  await run('/master-data', 'Customer dibuat', async () => {
    await requirePermission('inventory.manage');
    const input = z
      .object({
        name: z.string().min(1),
        type: z.enum(['Tengkulak', 'Distributor', 'Reseller', 'Retail', 'Customer Langsung']),
        address: z.string(),
        phone: z.string(),
        notes: z.string(),
      })
      .parse({
        name: formText(formData, 'name'),
        type: formText(formData, 'type') as CustomerType,
        address: formText(formData, 'address'),
        phone: formText(formData, 'phone'),
        notes: formText(formData, 'notes'),
      });
    await (await erpRepository()).createCustomer(input);
  });
}

export async function updateCustomerAction(formData: FormData) {
  await run('/master-data', 'Customer diperbarui', async () => {
    await requirePermission('inventory.manage');
    await (await erpRepository()).updateCustomer(z.string().min(1).parse(formText(formData, 'id')), {
      name: formText(formData, 'name'),
      type: formText(formData, 'type') as CustomerType,
      address: formText(formData, 'address'),
      phone: formText(formData, 'phone'),
      notes: formText(formData, 'notes'),
    });
  });
}

export async function deleteCustomerAction(formData: FormData) {
  await run('/master-data', 'Customer dihapus', async () => {
    await requirePermission('inventory.manage');
    await (await erpRepository()).deleteCustomer(z.string().min(1).parse(formText(formData, 'id')));
  });
}

export async function createExpenseCategoryAction(formData: FormData) {
  await run('/master-data', 'Kategori dibuat', async () => {
    await requirePermission('expenses.manage');
    await (await erpRepository()).createExpenseCategory(z.string().min(1).parse(formText(formData, 'name')));
  });
}

export async function deleteExpenseCategoryAction(formData: FormData) {
  await run('/master-data', 'Kategori dihapus', async () => {
    await requirePermission('expenses.manage');
    await (await erpRepository()).deleteExpenseCategory(z.string().min(1).parse(formText(formData, 'id')));
  });
}

export async function recordPurchaseAction(formData: FormData) {
  await run('/purchases', 'Pembelian dicatat', async () => {
    await requirePermission('purchases.manage');
    const input = z
      .object({
        date: z.iso.date(),
        supplierId: z.string().min(1),
        qty: z.number().positive(),
        pricePerUnit: z.number().positive(),
        shippingCost: z.number().nonnegative(),
        notes: z.string().max(2_000),
      })
      .parse({
        date: formText(formData, 'date'),
        supplierId: formText(formData, 'supplierId'),
        qty: formNumber(formData, 'qty'),
        pricePerUnit: formNumber(formData, 'pricePerUnit'),
        shippingCost: formNumber(formData, 'shippingCost'),
        notes: formText(formData, 'notes'),
      });
    await (await erpRepository()).recordPurchase(input);
  });
}

export async function recordFarmProductionAction(formData: FormData) {
  await run('/production/farm', 'Produksi kandang dicatat', async () => {
    await requirePermission('production.manage');
    const input = {
      date: formText(formData, 'date'),
      qty: formNumber(formData, 'qty'),
      transferPrice: formNumber(formData, 'transferPrice'),
      population: formNumber(formData, 'population'),
      productiveCount: formNumber(formData, 'productiveCount'),
      culledCount: formNumber(formData, 'culledCount'),
      mortality: formNumber(formData, 'mortality'),
      feedQty: formNumber(formData, 'feedQty'),
      feedCost: formNumber(formData, 'feedCost'),
      notes: formText(formData, 'notes'),
    };
    z.object({
      date: z.iso.date(),
      qty: z.number().positive(),
      transferPrice: z.number().positive(),
      population: z.number().positive(),
      productiveCount: z.number().nonnegative(),
      culledCount: z.number().nonnegative(),
      mortality: z.number().nonnegative(),
      feedQty: z.number().nonnegative(),
      feedCost: z.number().nonnegative(),
      notes: z.string().max(2_000),
    }).parse(input);
    await (await erpRepository()).recordFarmProduction(input);
  });
}

export async function createProductionBatchAction(formData: FormData) {
  await run('/production/salted', 'Batch dibuat', async () => {
    await requirePermission('production.manage');
    const input = {
      date: formText(formData, 'date'),
      qtyInput: formNumber(formData, 'qtyInput'),
      saltCost: formNumber(formData, 'saltCost'),
      ashCost: formNumber(formData, 'ashCost'),
      plasticCost: formNumber(formData, 'plasticCost'),
      packagingCost: formNumber(formData, 'packagingCost'),
      laborCost: formNumber(formData, 'laborCost'),
      otherCost: formNumber(formData, 'otherCost'),
      notes: formText(formData, 'notes'),
    };
    z.object({
      date: z.iso.date(),
      qtyInput: z.number().positive(),
      saltCost: z.number().nonnegative(),
      ashCost: z.number().nonnegative(),
      plasticCost: z.number().nonnegative(),
      packagingCost: z.number().nonnegative(),
      laborCost: z.number().nonnegative(),
      otherCost: z.number().nonnegative(),
      notes: z.string().max(2_000),
    }).parse(input);
    await (await erpRepository()).createProductionBatch(input);
  });
}

export async function transitionBatchAction(formData: FormData) {
  await run('/production/salted', 'Status batch diperbarui', async () => {
    await requirePermission('production.manage');
    await (await erpRepository()).transitionBatch(
      z.string().min(1).parse(formText(formData, 'id')),
      z.enum(['Pemeraman', 'Siap Panen', 'Siap Dijual', 'Selesai']).parse(formText(formData, 'status')),
    );
  });
}

export async function recordSaleAction(formData: FormData) {
  await run('/sales', 'Penjualan dicatat', async () => {
    await requirePermission('sales.manage');
    const input = z
      .object({
        date: z.iso.date(),
        customerId: z.string().min(1),
        eggType: z.enum(['RAW', 'SALTED']),
        qty: z.number().positive(),
        pricePerUnit: z.number().positive(),
        discount: z.number().nonnegative(),
        shippingCost: z.number().nonnegative(),
        notes: z.string().max(2_000),
      })
      .refine((value) => value.discount <= value.qty * value.pricePerUnit + value.shippingCost, {
        message: 'Diskon melebihi nilai transaksi',
        path: ['discount'],
      })
      .parse({
        date: formText(formData, 'date'),
        customerId: formText(formData, 'customerId'),
        eggType: formText(formData, 'eggType') as EggType,
        qty: formNumber(formData, 'qty'),
        pricePerUnit: formNumber(formData, 'pricePerUnit'),
        discount: formNumber(formData, 'discount'),
        shippingCost: formNumber(formData, 'shippingCost'),
        notes: formText(formData, 'notes'),
      });
    await (await erpRepository()).recordSale(input);
  });
}

export async function recordExpenseAction(formData: FormData) {
  await run('/expenses', 'Biaya operasional dicatat', async () => {
    await requirePermission('expenses.manage');
    const input = z
      .object({ date: z.iso.date(), category: z.string().min(1), amount: z.number().positive(), description: z.string().max(2_000) })
      .parse({
        date: formText(formData, 'date'),
        category: formText(formData, 'category'),
        amount: formNumber(formData, 'amount'),
        description: formText(formData, 'description'),
      });
    await (await erpRepository()).recordExpense(input);
  });
}

export async function inviteUserAction(formData: FormData) {
  await run('/users', 'Undangan pengguna dikirim', async () => {
    await requirePermission('users.manage');
    const input = z
      .object({
        email: z.email(),
        fullName: z.string().min(1),
        role: z.enum(['Owner', 'Admin', 'Employee']),
        permissions,
      })
      .parse({
        email: formText(formData, 'email'),
        fullName: formText(formData, 'fullName'),
        role: formText(formData, 'role') as Role,
        permissions: formData.getAll('permissions').map(String),
      });
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.inviteUserByEmail(input.email, {
      data: { full_name: input.fullName },
      redirectTo: `${siteUrl()}/auth/confirm?next=/reset-password`,
    });
    if (error) throw new Error(error.message);
    if (data.user) {
      const { error: profileError } = await admin.from('profiles').upsert({
        id: data.user.id,
        full_name: input.fullName,
        role: input.role,
        permissions: input.role === 'Employee' ? input.permissions : [],
      });
      if (profileError) throw new Error(profileError.message);
    }
  });
}

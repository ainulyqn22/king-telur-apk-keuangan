import { NextResponse } from 'next/server';
import { buildFinancialSummary, erpRepository } from '@/services/erp-service';
import { getCurrentProfile } from '@/services/auth-service';
import { can } from '@/types/rbac';

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: 'Authentication is required' }, { status: 401 });
  }
  if (!can(profile, 'reports.read')) {
    return NextResponse.json({ error: 'Insufficient permission' }, { status: 403 });
  }

  const data = await (await erpRepository()).getReports();
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    summary: buildFinancialSummary(data),
    stock: {
      raw: data.rawStock,
      salted: data.saltedStock,
    },
  });
}

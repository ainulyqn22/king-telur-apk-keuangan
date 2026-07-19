import { AppShell } from '@/components/app-shell';
import { erpRepository } from '@/services/erp-service';
import { navigationFor, requireProfile, requireUser } from '@/services/auth-service';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [user, profile, repo] = await Promise.all([requireUser(), requireProfile(), erpRepository()]);
  const settings = await repo.getSettings();

  return (
    <AppShell nav={navigationFor(profile)} shopName={settings.shopName} userName={profile.fullName || user.email || 'User'}>
      {children}
    </AppShell>
  );
}

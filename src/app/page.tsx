import { redirect } from 'next/navigation';
import { logServerRedirect } from '@/lib/redirect-log';

export default async function HomePage() {
  await logServerRedirect({
    pathname: '/',
    destination: '/dashboard',
    reason: 'root route forwards to dashboard',
  });
  redirect('/dashboard');
}

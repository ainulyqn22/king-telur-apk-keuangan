import { redirect } from 'next/navigation';
import { z } from 'zod';
import { logServerRedirect } from '@/lib/redirect-log';

export function formText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

export function formNumber(formData: FormData, name: string) {
  const raw = formText(formData, name);
  return raw === '' ? 0 : Number(raw);
}

export async function redirectOk(path: string, message: string) {
  await logServerRedirect({
    pathname: path,
    destination: `${path}?ok=${encodeURIComponent(message)}`,
    reason: 'server action completed successfully',
  });
  redirect(`${path}?ok=${encodeURIComponent(message)}`);
}

export async function redirectError(path: string, error: unknown) {
  const message =
    error instanceof z.ZodError
      ? error.issues[0]?.message ?? 'Input tidak valid'
      : error instanceof Error
        ? error.message
        : 'Operasi gagal';
  await logServerRedirect({
    pathname: path,
    destination: `${path}?error=${encodeURIComponent(message)}`,
    reason: `server action failed: ${message}`,
  });
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

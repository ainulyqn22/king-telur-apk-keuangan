'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formText, redirectError } from '@/lib/form';
import { logServerRedirect } from '@/lib/redirect-log';

const schema = z.object({
  email: z.email(),
  password: z.string().min(8),
  next: z.string().optional(),
});

export async function loginAction(formData: FormData) {
  const fallback = '/dashboard';
  let destination = fallback;
  try {
    const input = schema.parse({
      email: formText(formData, 'email'),
      password: formText(formData, 'password'),
      next: formText(formData, 'next') || fallback,
    });
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (error) throw new Error(error.message);
    destination = input.next?.startsWith('/') ? input.next : fallback;
  } catch (error) {
    await redirectError('/login', error);
  }
  await logServerRedirect({
    pathname: '/login',
    destination,
    reason: 'login succeeded',
  });
  redirect(destination);
}

export async function forgotPasswordAction(formData: FormData) {
  try {
    const email = z.email().parse(formText(formData, 'email'));
    const origin = (await headers()).get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/confirm?next=/reset-password`,
    });
    if (error) throw new Error(error.message);
  } catch (error) {
    await redirectError('/forgot-password', error);
  }
  await logServerRedirect({
    pathname: '/forgot-password',
    destination: '/forgot-password?ok=Periksa email untuk tautan reset password',
    reason: 'password reset email requested',
  });
  redirect('/forgot-password?ok=Periksa email untuk tautan reset password');
}

export async function resetPasswordAction(formData: FormData) {
  try {
    const password = z.string().min(8, 'Password minimal 8 karakter').parse(formText(formData, 'password'));
    const confirmPassword = formText(formData, 'confirmPassword');
    if (password !== confirmPassword) throw new Error('Konfirmasi password tidak sama');
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  } catch (error) {
    await redirectError('/reset-password', error);
  }
  await logServerRedirect({
    pathname: '/reset-password',
    destination: '/dashboard?ok=Password diperbarui',
    reason: 'password reset succeeded',
  });
  redirect('/dashboard?ok=Password diperbarui');
}

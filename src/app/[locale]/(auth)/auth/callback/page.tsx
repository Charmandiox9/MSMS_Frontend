import { redirect } from '@/i18n/routing';
import { resolveAuthCallbackTarget } from '@/lib/auth-callback-route';

export default async function AuthCallbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ route?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const destination = resolveAuthCallbackTarget(query.route ?? '/dashboard');

  redirect({ href: destination, locale });
}

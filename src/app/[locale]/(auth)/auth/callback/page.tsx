import { redirect } from '@/i18n/routing';

export default async function AuthCallbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ route?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const route = query.route || '/dashboard';
  const target =
    route.startsWith('/dashboard/') || route === '/no-access'
      ? route
      : '/';

  redirect({ href: target, locale });
}

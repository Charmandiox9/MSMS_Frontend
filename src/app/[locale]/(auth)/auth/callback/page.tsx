import { redirect } from 'next/navigation';

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ route?: string }>;
}) {
  const params = await searchParams;
  const route = params.route || '/dashboard';
  const target =
    route.startsWith('/dashboard') || route === '/no-access'
      ? route
      : '/dashboard';

  redirect(target);
}

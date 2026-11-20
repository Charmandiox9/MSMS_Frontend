import SessionEntry from "./SessionEntry";
import LoginScreen from "./LoginScreen";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;

  return (
    <SessionEntry isOAuthCallback={query.entry === "oauth"}>
      <LoginScreen />
    </SessionEntry>
  );
}

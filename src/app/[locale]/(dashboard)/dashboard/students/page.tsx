import StudentsPage from "./StudentsPage";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ nrc?: string }>;
}) {
  const { nrc } = await searchParams;
  return <StudentsPage initialNrc={nrc} />;
}

import PublicationDetail from "../../PublicationDetail";

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PublicationDetail id={id} kind="GUIDE" />;
}

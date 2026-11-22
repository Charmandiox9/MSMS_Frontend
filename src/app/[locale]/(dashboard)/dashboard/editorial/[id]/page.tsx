import EditorialEntry from "../EditorialEntry";

export default async function EditorialEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditorialEntry id={id} />;
}

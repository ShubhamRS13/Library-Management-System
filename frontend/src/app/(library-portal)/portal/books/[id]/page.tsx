import PortalBookDetailClient from "./PortalBookDetailClient";

export default async function PortalBookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PortalBookDetailClient bookId={Number(id)} />;
}

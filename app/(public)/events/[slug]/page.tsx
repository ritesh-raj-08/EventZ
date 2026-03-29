import { notFound } from "next/navigation";
import { EventDetailClient } from "./event-detail-client";

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug ?? "").trim();
  if (!decoded) {
    notFound();
  }

  return <EventDetailClient slug={decoded} />;
}

import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { LISTED_STATUSES } from "@/lib/property-status";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await prisma.property.findMany({
    where: { status: { in: LISTED_STATUSES } },
    select: { code: true, updatedAt: true }
  });

  return [
    { url: `${siteConfig.url}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteConfig.url}/imoveis`, changeFrequency: "daily", priority: 0.9 },
    ...properties.map((property) => ({
      url: `${siteConfig.url}/imoveis/${property.code}`,
      lastModified: property.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8
    }))
  ];
}

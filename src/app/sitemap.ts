import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    "/",
    "/login",
    "/signup",
    "/privacy",
    "/terms",
    "/about",
    "/contact",
    "/companies",
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `https://seasignal.app${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.8,
  }));

  // Fetch public company pages
  let companyEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();
    const { data: companies } = await supabase
      .from("companies")
      .select("id, updated_at");

    if (companies) {
      companyEntries = companies.map((company) => ({
        url: `https://seasignal.app/companies/${company.id}`,
        lastModified: new Date(company.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
    }
  } catch {
    // If DB is unavailable, return static pages only
  }

  return [...staticEntries, ...companyEntries];
}

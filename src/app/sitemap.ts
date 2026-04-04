import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://seasignal.app";

  const staticPages = [
    "/",
    "/login",
    "/signup",
    "/privacy",
    "/terms",
    "/about",
    "/contact",
    "/companies",
    "/vessels",
    "/forums",
    "/jobs",
    "/agencies",
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${appUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.8,
  }));

  // Fetch dynamic pages in parallel
  let dynamicEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();
    const [companies, vessels, forumCategories, jobs] = await Promise.all([
      supabase.from("companies").select("id, updated_at"),
      supabase.from("vessels").select("id, updated_at"),
      supabase.from("forum_categories").select("slug, created_at"),
      supabase.from("job_listings").select("id, updated_at").eq("status", "open"),
    ]);

    if (companies.data) {
      dynamicEntries.push(
        ...companies.data.map((c) => ({
          url: `${appUrl}/companies/${c.id}`,
          lastModified: new Date(c.updated_at),
          changeFrequency: "weekly" as const,
          priority: 0.6,
        }))
      );
    }

    if (vessels.data) {
      dynamicEntries.push(
        ...vessels.data.map((v) => ({
          url: `${appUrl}/vessels/${v.id}`,
          lastModified: new Date(v.updated_at),
          changeFrequency: "weekly" as const,
          priority: 0.6,
        }))
      );
    }

    if (forumCategories.data) {
      dynamicEntries.push(
        ...forumCategories.data.map((f) => ({
          url: `${appUrl}/forums/${f.slug}`,
          lastModified: new Date(f.created_at),
          changeFrequency: "daily" as const,
          priority: 0.5,
        }))
      );
    }

    if (jobs.data) {
      dynamicEntries.push(
        ...jobs.data.map((j) => ({
          url: `${appUrl}/jobs/${j.id}`,
          lastModified: new Date(j.updated_at),
          changeFrequency: "daily" as const,
          priority: 0.5,
        }))
      );
    }
  } catch {
    // If DB is unavailable, return static pages only
  }

  return [...staticEntries, ...dynamicEntries];
}

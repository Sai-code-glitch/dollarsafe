import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { TOOLS } from "@/lib/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.appUrl.replace(/\/$/, "");
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly" = "monthly") => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  });
  return [
    page("", 1, "weekly"),
    page("/pricing", 0.8),
    page("/tools", 0.9, "weekly"),
    ...TOOLS.map((t) => page(`/tools/${t.slug}`, 0.8)),
    page("/signup", 0.6),
    page("/legal/terms", 0.2, "yearly"),
    page("/legal/privacy", 0.2, "yearly"),
    page("/legal/disclosures", 0.2, "yearly"),
  ];
}

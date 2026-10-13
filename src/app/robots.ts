import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = env.appUrl.replace(/\/$/, "");
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/chat", "/account", "/profiles", "/onboarding", "/reports"] },
    sitemap: `${base}/sitemap.xml`,
  };
}

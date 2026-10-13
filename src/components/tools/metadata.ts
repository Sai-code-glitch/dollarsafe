import type { Metadata } from "next";
import { toolBySlug } from "@/lib/tools";

export function toolMetadata(slug: string): Metadata {
  const tool = toolBySlug(slug);
  if (!tool) throw new Error(`Unknown tool: ${slug}`);
  const title = `${tool.title}: free, no sign-up`;
  return {
    title,
    description: tool.description,
    alternates: { canonical: `/tools/${slug}` },
    openGraph: { title: `${tool.title} · Dollarsafe`, description: tool.description, url: `/tools/${slug}`, type: "website" },
    twitter: { card: "summary_large_image", title: `${tool.title} · Dollarsafe`, description: tool.description },
  };
}

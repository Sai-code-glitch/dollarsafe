import { ogSize, renderOgImage } from "@/components/ogImage";
import { toolBySlug } from "@/lib/tools";

const tool = toolBySlug("budget")!;

export const alt = `${tool.title} by Dollarsafe`;
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage(`Free ${tool.title}`, tool.summary);
}

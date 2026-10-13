import { ogSize, renderOgImage } from "@/components/ogImage";

export const alt = "Dollarsafe: AI money coach for every stage of life";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage("Clear money guidance for every stage of life.", "AI money coach · Budgets, debt, retirement, taxes · Free calculators");
}

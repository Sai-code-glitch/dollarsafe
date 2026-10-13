import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { TOOLS } from "@/lib/tools";

describe("public calculator pages", () => {
  it("has a page for every tool and unique slugs", () => {
    expect(new Set(TOOLS.map((t) => t.slug)).size).toBe(TOOLS.length);
    for (const t of TOOLS) expect(existsSync(path.join(__dirname, "../src/app/tools", t.slug, "page.tsx"))).toBe(true);
  });

  it("keeps meta descriptions short enough for search results", () => {
    for (const t of TOOLS) expect(t.description.length).toBeLessThanOrEqual(170);
  });

  it("never markets the product as an advisor or promises returns", () => {
    const copy = [
      ...TOOLS.flatMap((t) => [t.title, t.summary, t.description, t.followUp]),
      ...TOOLS.map((t) => readFileSync(path.join(__dirname, "../src/app/tools", t.slug, "page.tsx"), "utf8")),
    ].join("\n");
    expect(copy).not.toMatch(/financial advisor|investment advice|guarantee(d)? (return|savings|results)/i);
  });

  it("stays outside the signed-in redirect", () => {
    const proxy = readFileSync(path.join(__dirname, "../src/proxy.ts"), "utf8");
    expect(proxy).not.toMatch(/\/tools/);
  });
});

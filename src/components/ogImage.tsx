import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

/** Branded 1200x630 share image used by the home page and each calculator page. */
export function renderOgImage(headline: string, subline: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 60%)",
          color: "#0f172a",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "#059669",
              color: "white",
              fontSize: 44,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            $
          </div>
          <div style={{ fontSize: 44, fontWeight: 700 }}>Dollarsafe</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1, maxWidth: 950 }}>{headline}</div>
          <div style={{ fontSize: 32, color: "#475569" }}>{subline}</div>
        </div>
        <div style={{ fontSize: 22, color: "#64748b" }}>Financial education and general guidance. Not investment advice.</div>
      </div>
    ),
    ogSize,
  );
}

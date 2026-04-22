import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Ember — 청년 취업·이직 준비 플랫폼";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#1C1C1E",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: "72px",
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            Ember
          </div>
          <div
            style={{
              fontSize: "32px",
              color: "#9B9B9B",
              fontWeight: 400,
            }}
          >
            청년 취업·이직 준비 플랫폼
          </div>
          <div
            style={{
              fontSize: "24px",
              color: "#FE6E6E",
              fontWeight: 500,
              marginTop: "8px",
            }}
          >
            for-youth.site
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

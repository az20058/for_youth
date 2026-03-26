import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const colors = [
  { name: "Primary", hex: "#FE6E6E" },
  { name: "Primary Dim", hex: "#FFF5A0" },
  { name: "Background", hex: "#1C1C1E" },
  { name: "Surface", hex: "#2D2D2D" },
  { name: "Surface Elevated", hex: "#3A3A3A" },
  { name: "Border", hex: "#3A3A3A" },
  { name: "Text", hex: "#FFFFFF" },
  { name: "Text Muted", hex: "#9B9B9B" },
];

function DesignTokens() {
  return (
    <div className="p-6" style={{ backgroundColor: "#1C1C1E", minHeight: "100vh" }}>
      <h2 style={{ color: "#FFFFFF", fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem" }}>
        Color Tokens
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
        {colors.map((c) => (
          <div key={c.name} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div
              style={{
                backgroundColor: c.hex,
                width: "100%",
                height: "4rem",
                borderRadius: "0.5rem",
                border: "1px solid #3A3A3A",
              }}
            />
            <p style={{ color: "#FFFFFF", fontSize: "0.875rem", fontWeight: "600", margin: 0 }}>{c.name}</p>
            <p style={{ color: "#9B9B9B", fontSize: "0.75rem", margin: 0 }}>{c.hex}</p>
          </div>
        ))}
      </div>

      <h2 style={{ color: "#FFFFFF", fontSize: "1.25rem", fontWeight: "bold", marginTop: "2rem", marginBottom: "1rem" }}>
        Typography (Pretendard)
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {[
          { label: "Heading 1", style: { fontSize: "1.875rem", fontWeight: "700", color: "#FFFFFF" } },
          { label: "Heading 2", style: { fontSize: "1.5rem", fontWeight: "700", color: "#FFFFFF" } },
          { label: "Heading 3", style: { fontSize: "1.25rem", fontWeight: "600", color: "#FFFFFF" } },
          { label: "Body", style: { fontSize: "1rem", color: "#FFFFFF" } },
          { label: "Caption", style: { fontSize: "0.875rem", color: "#9B9B9B" } },
        ].map((t) => (
          <div key={t.label} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ color: "#9B9B9B", fontSize: "0.75rem", width: "6rem" }}>{t.label}</span>
            <span style={t.style}>EMBER 업계 TOP 스타트업 플랫폼</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const meta: Meta = {
  title: "Design System/Tokens",
  component: DesignTokens,
  parameters: { layout: "fullscreen" },
};
export default meta;

export const Tokens: StoryObj = {};

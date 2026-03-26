import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const meta: Meta<typeof Checkbox> = {
  title: "Components/Checkbox",
  component: Checkbox,
};
export default meta;

export const CheckboxList: StoryObj = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "280px" }}>
      {["체크리스트 1", "체크리스트 2", "체크리스트 3"].map((label, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            backgroundColor: "#2D2D2D",
            borderRadius: "0.5rem",
            padding: "0.5rem 0.75rem",
          }}
        >
          <Checkbox
            id={`cb-${i}`}
            defaultChecked={i > 0}
            className="border-[#FE6E6E] data-[state=checked]:bg-[#FE6E6E] data-[state=checked]:border-[#FE6E6E]"
          />
          <Label htmlFor={`cb-${i}`} style={{ color: "#FFFFFF", fontSize: "0.875rem", cursor: "pointer" }}>
            {label}
          </Label>
        </div>
      ))}
    </div>
  ),
};

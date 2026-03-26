import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "@/components/ui/badge";

const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  component: Badge,
};
export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: { children: "#해시태그" },
};

export const Multiple: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      {["#스타트업", "#창업", "#IT", "#서울", "#매칭"].map((tag) => (
        <Badge key={tag}>{tag}</Badge>
      ))}
    </div>
  ),
};

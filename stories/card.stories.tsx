import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
};
export default meta;

export const BusinessCard: StoryObj = {
  render: () => (
    <div style={{ width: "320px" }}>
      <Card style={{ backgroundColor: "#2D2D2D", border: "1px solid #3A3A3A" }}>
        <CardHeader style={{ paddingBottom: "0.5rem" }}>
          <CardTitle style={{ color: "#FFFFFF", fontSize: "1rem" }}>사업 이름</CardTitle>
          <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
            {["#해시태그", "#해시태그", "#해시태그"].map((t, i) => (
              <Badge key={i}>{t}</Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <p style={{ color: "#9B9B9B", fontSize: "0.875rem", lineHeight: "1.6" }}>
            정책 내용 정책 내용 정책 내용 정책 내용 정책 내용 정책 내용 정책 내용...
          </p>
          <Button className="w-full" style={{ marginTop: "1rem" }}>바로가기</Button>
        </CardContent>
      </Card>
    </div>
  ),
};

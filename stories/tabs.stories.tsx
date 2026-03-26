import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const meta: Meta<typeof Tabs> = {
  title: "Components/Tabs",
  component: Tabs,
};
export default meta;

export const TodoTabs: StoryObj = {
  render: () => (
    <div style={{ width: "280px" }}>
      <Tabs defaultValue="pending">
        <TabsList className="w-full" style={{ backgroundColor: "#2D2D2D" }}>
          <TabsTrigger
            value="pending"
            className="flex-1 data-[state=active]:bg-[#FE6E6E] data-[state=active]:text-white"
          >
            미완료
          </TabsTrigger>
          <TabsTrigger
            value="done"
            className="flex-1 data-[state=active]:bg-[#FE6E6E] data-[state=active]:text-white"
          >
            완료
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pending" style={{ color: "#FFFFFF", marginTop: "0.5rem" }}>
          미완료 항목 목록
        </TabsContent>
        <TabsContent value="done" style={{ color: "#FFFFFF", marginTop: "0.5rem" }}>
          완료된 항목 목록
        </TabsContent>
      </Tabs>
    </div>
  ),
};

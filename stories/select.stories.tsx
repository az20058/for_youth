import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const meta: Meta<typeof Select> = {
  title: "Components/Select",
  component: Select,
};
export default meta;

export const RegionSelect: StoryObj = {
  render: () => (
    <div style={{ width: "280px" }}>
      <Select>
        <SelectTrigger
          style={{ backgroundColor: "#2D2D2D", border: "1px solid #3A3A3A", color: "#FFFFFF" }}
        >
          <SelectValue placeholder="지역을 선택하세요" />
        </SelectTrigger>
        <SelectContent style={{ backgroundColor: "#2D2D2D", border: "1px solid #3A3A3A" }}>
          {["서울", "경기", "인천", "부산", "광주"].map((region) => (
            <SelectItem
              key={region}
              value={region}
              className="text-white focus:bg-[#FE6E6E] focus:text-white"
            >
              {region}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ),
};

export const WithSelected: StoryObj = {
  render: () => (
    <div style={{ width: "280px" }}>
      <Select defaultValue="서울">
        <SelectTrigger
          style={{ backgroundColor: "#2D2D2D", border: "1px solid #FE6E6E", color: "#FE6E6E" }}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent style={{ backgroundColor: "#2D2D2D", border: "1px solid #3A3A3A" }}>
          {["서울", "경기", "인천", "부산", "광주"].map((region) => (
            <SelectItem
              key={region}
              value={region}
              className="text-white focus:bg-[#FE6E6E] focus:text-white"
            >
              {region}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ),
};

import { CircleUserRound } from "lucide-react";
import { FlameIcon } from "@/components/icons/FlameIcon";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title?: string;
  onProfileClick?: () => void;
}

export function Header({ title = "EMBER", onProfileClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-[#1C1C1E]">
      <div className="flex items-center gap-2">
        <FlameIcon className="size-10" />
        <span className="text-white text-lg font-bold tracking-wide">
          {title}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onProfileClick}
        aria-label="프로필"
        className="rounded-full text-[#9B9B9B] hover:text-white hover:bg-[#3A3A3A]"
      >
        <CircleUserRound className="size-6" />
      </Button>
    </header>
  );
}

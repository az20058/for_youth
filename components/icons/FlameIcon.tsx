import Image from "next/image";
import { cn } from "@/lib/utils";

interface FlameIconProps {
  className?: string;
  glow?: boolean;
}

export function FlameIcon({ className, glow = false }: FlameIconProps) {
  return (
    <div className={cn("relative", className)}>
      {glow && (
        <div className="absolute inset-[10%] rounded-full bg-[#FE6E6E]/80 blur-3xl" />
      )}
      <Image src="/icons/flame.svg" alt="" fill className="object-contain relative" />
    </div>
  );
}

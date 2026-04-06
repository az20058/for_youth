import Image from "next/image";
import { cn } from "@/lib/utils";

export function FlameIcon({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Image src="/icons/flame.svg" alt="" fill className="object-contain" />
    </div>
  );
}

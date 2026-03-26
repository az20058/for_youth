import Image from "next/image";

interface HeaderProps {
  title?: string;
  onProfileClick?: () => void;
}

export function Header({ title = "EMBER", onProfileClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-[#1C1C1E]">
      <div className="flex items-center gap-2">
        <Image
          src="/ember-flame.svg"
          alt="EMBER flame"
          width={22}
          height={32}
          priority
        />
        <span className="text-white text-lg font-bold tracking-wide">
          {title}
        </span>
      </div>
      <button
        onClick={onProfileClick}
        className="w-9 h-9 rounded-full bg-[#2D2D2D] flex items-center justify-center border border-[#3A3A3A] hover:bg-[#3A3A3A] transition-colors"
        aria-label="프로필"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9B9B9B"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      </button>
    </header>
  );
}

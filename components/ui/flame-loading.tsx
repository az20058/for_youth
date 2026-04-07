import { FlameIcon } from '@/components/icons/FlameIcon';

interface FlameLoadingProps {
  message?: string;
  subMessage?: string;
  fullscreen?: boolean;
}

export function FlameLoading({
  message = '불러오는 중…',
  subMessage,
  fullscreen = false,
}: FlameLoadingProps) {
  if (fullscreen) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 flex min-h-screen flex-col items-center justify-center gap-6">
          <FlameIcon className="size-20 animate-pulse" glow />
          <p className="text-base font-medium text-foreground">{message}</p>
          {subMessage && (
            <p className="text-sm text-muted-foreground">{subMessage}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <FlameIcon className="size-10 animate-pulse" glow />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

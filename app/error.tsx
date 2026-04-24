'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center space-y-4 px-4">
        <h2 className="text-xl font-bold">오류가 발생했습니다</h2>
        <p className="text-muted-foreground text-sm">
          {error.message || '예기치 않은 오류가 발생했습니다.'}
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-orange-500 px-6 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}

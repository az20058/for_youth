export default function TestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-40 isolate">
        <header className="bg-background border-b border-border px-4 h-14 flex items-center">
          <span className="font-bold">EMBER</span>
        </header>
        <header className="bg-background border-b border-border">
          <div className="relative flex">
            <a className="flex-1 text-center py-2.5 text-sm font-medium text-foreground">지원 현황</a>
            <a className="flex-1 text-center py-2.5 text-sm font-medium text-muted-foreground">자기소개서</a>
            <span className="absolute bottom-0 h-0.5 bg-primary" style={{ left: 0, width: '50%' }} />
          </div>
        </header>
      </div>
      <div className="mx-auto w-full max-w-3xl px-4 pb-24">
        {children}
      </div>
    </div>
  );
}

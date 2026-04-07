import { HomeSidebar } from '@/components/HomeSidebar';
import { HomeMobileHeader } from '@/components/HomeMobileHeader';
import { Header } from '@/components/ui/header';

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#1C1C1E]">
      <div className="sticky top-0 z-40">
        <Header />
      </div>
      <div className="flex flex-1">
        <HomeSidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <HomeMobileHeader />
          <div className="mx-auto w-full max-w-3xl px-4 py-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

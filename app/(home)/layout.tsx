import { HomeSidebar } from '@/components/HomeSidebar';
import { HomeMobileHeader } from '@/components/HomeMobileHeader';
import { Header } from '@/components/ui/header';
import { MobileFooterNav } from '@/components/MobileFooterNav';
import { PageTransition } from '@/components/PageTransition';

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <div className="sticky top-0 z-40 isolate" data-web-header>
        <Header />
        <HomeMobileHeader />
      </div>
      <div className="flex flex-1">
        <HomeSidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-6">
            <PageTransition>{children}</PageTransition>
          </div>
        </div>
      </div>
      <MobileFooterNav />
    </div>
  );
}

import type { Metadata } from "next";
import { ScheduleSidebar } from '@/components/ScheduleSidebar';
import { ScheduleMobileHeader } from '@/components/ScheduleMobileHeader';
import { AuthGuard } from '@/components/AuthGuard';
import { Header } from '@/components/ui/header';
import { Toaster } from '@/components/ui/sonner';
import { MobileFooterNav } from '@/components/MobileFooterNav';
import { PageTransition } from '@/components/PageTransition';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function ScheduleLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex flex-col min-h-dvh">
        <div className="sticky top-0 z-40 isolate" data-web-header>
          <Header />
          <ScheduleMobileHeader />
        </div>
        <div className="flex flex-1">
          <ScheduleSidebar />
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-6">
              <PageTransition>{children}</PageTransition>
            </div>
          </div>
        </div>
        <Toaster position="top-right" />
      </div>
      <MobileFooterNav />
    </AuthGuard>
  );
}

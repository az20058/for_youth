import { AppSidebar } from '@/components/AppSidebar';
import { MobileHeader } from '@/components/MobileHeader';
import { AuthGuard } from '@/components/AuthGuard';
import { Header } from '@/components/ui/header';
import { Toaster } from '@/components/ui/sonner';
import { MobileFooterNav } from '@/components/MobileFooterNav';

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen">
        <div className="sticky top-0 z-40">
          <Header />
          <MobileHeader />
        </div>
        <div className="flex flex-1">
          <AppSidebar />
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 pb-24 md:pb-0">
              {children}
            </div>
          </div>
        </div>
        <Toaster position="top-right" />
      </div>
      <MobileFooterNav />
    </AuthGuard>
  );
}

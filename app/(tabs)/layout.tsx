import { AppSidebar } from '@/components/AppSidebar';
import { MobileHeader } from '@/components/MobileHeader';
import { Header } from '@/components/ui/header';
import { Toaster } from '@/components/ui/sonner';

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-40">
        <Header />
      </div>
      <div className="flex flex-1">
        <AppSidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <MobileHeader />
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
            {children}
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

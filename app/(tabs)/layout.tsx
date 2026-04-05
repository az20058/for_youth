import { AppSidebar } from '@/components/AppSidebar';
import { MobileHeader } from '@/components/MobileHeader';
import { Toaster } from '@/components/ui/sonner';

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <MobileHeader />
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
          {children}
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

import { AuthGuard } from '@/components/AuthGuard';
import { Header } from '@/components/ui/header';
import { MobileFooterNav } from '@/components/MobileFooterNav';

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen">
        <div className="sticky top-0 z-40">
          <Header />
        </div>
        <div className="pb-24 md:pb-0">
          {children}
        </div>
        <MobileFooterNav />
      </div>
    </AuthGuard>
  );
}

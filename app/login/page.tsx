'use client';

import { useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FlameIcon } from '@/components/icons/FlameIcon';
import { FlameLoading } from '@/components/ui/flame-loading';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <FlameLoading fullscreen />;
  }

  return (
    <div className="min-h-screen bg-[#1C1C1E] flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6 w-full max-w-sm">
        <FlameIcon className="size-20" glow />
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold tracking-wide">EMBER</h1>
          <p className="text-[#9B9B9B] text-sm mt-1">청년을 위한 도전 플랫폼</p>
        </div>

        <div className="flex flex-col gap-3 w-full mt-4">
          <Button
            className="w-full h-12 rounded-xl bg-white text-black hover:bg-gray-100 font-medium text-sm gap-2"
            onClick={() => signIn('google', { callbackUrl: '/' })}
          >
            <svg className="size-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google로 계속하기
          </Button>

          <Button
            className="w-full h-12 rounded-xl bg-[#FEE500] text-[#191919] hover:bg-[#FEE500]/90 font-medium text-sm gap-2"
            onClick={() => signIn('kakao', { callbackUrl: '/' })}
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="#191919">
              <path d="M12 3C6.48 3 2 6.36 2 10.44c0 2.62 1.75 4.93 4.37 6.24l-1.12 4.16a.3.3 0 0 0 .45.33l4.7-3.1c.52.07 1.05.1 1.6.1 5.52 0 10-3.36 10-7.73C22 6.36 17.52 3 12 3z" />
            </svg>
            Kakao로 계속하기
          </Button>
        </div>

        <p className="text-[#9B9B9B] text-xs text-center mt-4 leading-relaxed">
          로그인하면 EMBER의 이용약관 및<br />개인정보처리방침에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MypageSkeleton } from './_components/MypageSkeleton';
import { fetchProfile, updateProfile } from '@/lib/profileApi';
import type { UserProfile } from '@/lib/types';
import { ProfileHeader } from './_components/ProfileHeader';
import { DesiredConditions } from './_components/DesiredConditions';
import { EducationCareer } from './_components/EducationCareer';
import { TechStacks } from './_components/TechStacks';
import { CertPortfolio } from './_components/CertPortfolio';

export default function MyPage() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });

  const { mutateAsync } = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(['profile'], updated);
    },
  });

  async function handleSave(data: Parameters<typeof updateProfile>[0]) {
    await mutateAsync(data);
  }

  if (isLoading || !profile) {
    return (
      <div className="py-8 space-y-4">
        <h1 className="text-xl font-bold">마이페이지</h1>
        <MypageSkeleton />
      </div>
    );
  }

  return (
    <div className="py-8 space-y-4">
      <h1 className="text-xl font-bold">마이페이지</h1>

      <ProfileHeader profile={profile} onSave={handleSave} />
      <DesiredConditions profile={profile} onSave={handleSave} />
      <EducationCareer profile={profile} onSave={handleSave} />
      <TechStacks profile={profile} onSave={handleSave} />
      <CertPortfolio profile={profile} onSave={handleSave} />

      <section className="p-5 rounded-2xl bg-card border border-border">
        <h2 className="font-semibold mb-3">계정 관리</h2>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 text-base text-destructive hover:text-destructive"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="size-5" />
          로그아웃
        </Button>
      </section>
    </div>
  );
}

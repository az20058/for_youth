'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { MypageSkeleton } from './_components/MypageSkeleton';
import { fetchProfile, updateProfile } from '@/lib/profileApi';
import type { UserProfile } from '@/lib/types';
import { ProfileHeader } from './_components/ProfileHeader';
import { EducationCareer } from './_components/EducationCareer';
import { CertPortfolio } from './_components/CertPortfolio';
import { ResumeFile } from './_components/ResumeFile';

function getDefaultOpen(profile: UserProfile): string[] {
  const open: string[] = [];
  const hasEducation = !!profile.education || profile.careers.length > 0;
  const hasCert = profile.certifications.length > 0 || profile.languages.length > 0;
  const hasResume = !!profile.resumeUrl || !!profile.portfolioUrl;
  if (!hasEducation) open.push('education');
  if (!hasCert) open.push('cert');
  if (!hasResume) open.push('resume');
  if (open.length === 0) open.push('education');
  return open;
}

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
        <h1 className="text-2xl font-bold tracking-tight">마이페이지</h1>
        <MypageSkeleton />
      </div>
    );
  }

  const defaultOpen = getDefaultOpen(profile);

  return (
    <div className="py-8 space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">마이페이지</h1>

      <ProfileHeader profile={profile} onSave={handleSave} />

      <Accordion type="multiple" defaultValue={defaultOpen} className="flex flex-col gap-2">
        <AccordionItem value="resume" className="rounded-xl bg-card border border-border px-5 border-b-0">
          <AccordionTrigger className="hover:no-underline font-semibold">이력서 &amp; 포트폴리오</AccordionTrigger>
          <AccordionContent>
            <ResumeFile profile={profile} onSave={handleSave} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="education" className="rounded-xl bg-card border border-border px-5 border-b-0">
          <AccordionTrigger className="hover:no-underline font-semibold">학력 &amp; 경력</AccordionTrigger>
          <AccordionContent>
            <EducationCareer profile={profile} onSave={handleSave} />
          </AccordionContent>
        </AccordionItem>
<AccordionItem value="cert" className="rounded-xl bg-card border border-border px-5 border-b-0">
          <AccordionTrigger className="hover:no-underline font-semibold">자격증 &amp; 어학</AccordionTrigger>
          <AccordionContent>
            <CertPortfolio profile={profile} onSave={handleSave} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <section className="p-5 rounded-xl bg-card border border-border">
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

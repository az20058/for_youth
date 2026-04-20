'use client';

import { usePathname } from 'next/navigation';
import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { getNavItems } from '@/lib/nav';

const tabs = getNavItems('app-tabs');

export function MobileHeader() {
  const pathname = usePathname();
  if (pathname.startsWith('/mypage')) return null;
  return <SegmentedTabs items={tabs} />;
}

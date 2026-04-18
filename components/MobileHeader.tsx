'use client';

import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { getNavItems } from '@/lib/nav';

const tabs = getNavItems('app-tabs');

export function MobileHeader() {
  return <SegmentedTabs items={tabs} />;
}

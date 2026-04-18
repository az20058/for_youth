'use client';

import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { getNavItems } from '@/lib/nav';

const tabs = getNavItems('home-tabs');

export function HomeMobileHeader() {
  return <SegmentedTabs items={tabs} />;
}

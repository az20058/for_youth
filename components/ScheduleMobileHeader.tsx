'use client';

import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { getNavItems } from '@/lib/nav';

const tabs = getNavItems('schedule-tabs');

export function ScheduleMobileHeader() {
  return <SegmentedTabs items={tabs} />;
}

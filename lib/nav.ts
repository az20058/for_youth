import {
  HomeIcon,
  BriefcaseIcon,
  CalendarIcon,
  UserIcon,
  LayoutListIcon,
  FileTextIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** 이 경로들 중 하나라도 매치되면 active 상태 */
  activePaths: string[];
  /** exact=true면 pathname === href 일 때만 active */
  exact?: boolean;
  /** 표시 위치 제한 — 없으면 전체 */
  placement?: ('global' | 'home-sidebar' | 'home-tabs' | 'app-sidebar' | 'app-tabs')[];
}

/** 앱 전체 네비게이션 단일 정의 */
export const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: '홈',
    icon: HomeIcon,
    activePaths: ['/', '/programs'],
    exact: true,
    placement: ['global', 'home-sidebar', 'home-tabs'],
  },
  {
    href: '/programs',
    label: '정책 둘러보기',
    icon: LayoutListIcon,
    activePaths: ['/programs'],
    placement: ['home-sidebar', 'home-tabs'],
  },
  {
    href: '/applications',
    label: '지원 현황',
    icon: BriefcaseIcon,
    activePaths: ['/applications', '/cover-letters'],
    placement: ['global', 'app-sidebar', 'app-tabs'],
  },
  {
    href: '/cover-letters',
    label: '자기소개서',
    icon: FileTextIcon,
    activePaths: ['/cover-letters'],
    placement: ['app-sidebar', 'app-tabs'],
  },
  {
    href: '/schedule',
    label: '일정',
    icon: CalendarIcon,
    activePaths: ['/schedule'],
    placement: ['global'],
  },
  {
    href: '/mypage',
    label: '마이페이지',
    icon: UserIcon,
    activePaths: ['/mypage'],
    placement: ['global'],
  },
];

/** placement 필터 헬퍼 */
export function getNavItems(placement: NavItem['placement'][number]): NavItem[] {
  return NAV_ITEMS.filter(
    (item) => !item.placement || item.placement.includes(placement),
  );
}

/** pathname이 NavItem의 activePaths에 매치되는지 확인 */
export function isNavActive(item: NavItem, pathname: string): boolean {
  if (item.exact && item.href === pathname) return true;
  return item.activePaths.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

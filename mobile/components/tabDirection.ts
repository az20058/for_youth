/** 탭 전환 방향을 추적하는 간단한 모듈 레벨 스토어 */

const TAB_NAMES = ['index', 'applications', 'schedule', 'mypage'] as const;

let prevIndex = 0;
let direction: 'left' | 'right' | null = null;

export function onTabChange(routeName: string) {
  const currIndex = TAB_NAMES.indexOf(routeName as (typeof TAB_NAMES)[number]);
  if (currIndex === -1 || currIndex === prevIndex) {
    direction = null;
    return;
  }
  direction = currIndex > prevIndex ? 'right' : 'left';
  prevIndex = currIndex;
}

export function getDirection() {
  return direction;
}

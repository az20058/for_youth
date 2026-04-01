import { render, screen } from '@testing-library/react';
import { MobileHeader } from '@/components/MobileHeader';

jest.mock('next/navigation', () => ({
  usePathname: () => '/applications',
}));

describe('MobileHeader', () => {
  it('앱 이름이 렌더링된다', () => {
    render(<MobileHeader />);
    expect(screen.getByText('취업 관리')).toBeInTheDocument();
  });

  it('탭 링크가 렌더링된다', () => {
    render(<MobileHeader />);
    expect(screen.getByRole('link', { name: /지원 현황/ })).toHaveAttribute('href', '/applications');
    expect(screen.getByRole('link', { name: /자기소개서/ })).toHaveAttribute('href', '/cover-letters');
  });

  it('현재 경로의 탭이 활성 상태다', () => {
    render(<MobileHeader />);
    expect(screen.getByRole('link', { name: /지원 현황/ })).toHaveAttribute('data-active', 'true');
    expect(screen.getByRole('link', { name: /자기소개서/ })).toHaveAttribute('data-active', 'false');
  });
});

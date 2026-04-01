import { render, screen } from '@testing-library/react';
import { AppSidebar } from '@/components/AppSidebar';

const mockPathname = jest.fn(() => '/applications');
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

describe('AppSidebar', () => {
  it('네비게이션 링크가 렌더링된다', () => {
    render(<AppSidebar />);
    expect(screen.getByRole('link', { name: /지원 현황/ })).toHaveAttribute('href', '/applications');
    expect(screen.getByRole('link', { name: /자기소개서/ })).toHaveAttribute('href', '/cover-letters');
  });

  it('현재 경로의 링크가 활성 스타일을 가진다', () => {
    mockPathname.mockReturnValue('/applications');
    render(<AppSidebar />);
    expect(screen.getByRole('link', { name: /지원 현황/ })).toHaveAttribute('data-active', 'true');
    expect(screen.getByRole('link', { name: /자기소개서/ })).toHaveAttribute('data-active', 'false');
  });
});

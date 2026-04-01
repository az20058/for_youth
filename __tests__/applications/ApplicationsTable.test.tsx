import { render, screen, fireEvent } from '@testing-library/react';
import { ApplicationsTable } from '@/components/ApplicationsTable';
import type { Application } from '@/lib/types';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockApps: Application[] = [
  {
    id: '1',
    companyName: '네이버',
    careerLevel: '신입',
    deadline: new Date('2026-04-20'),
    companySize: '대기업',
    coverLetters: [],
    status: '지원 예정',
  },
  {
    id: '2',
    companyName: '토스',
    careerLevel: '경력 2년',
    deadline: new Date('2026-04-15'),
    companySize: '스타트업',
    coverLetters: [],
    status: '면접 기간',
  },
];

describe('ApplicationsTable', () => {
  beforeEach(() => mockPush.mockClear());

  it('컬럼 헤더가 렌더링된다', () => {
    render(<ApplicationsTable applications={mockApps} />);
    expect(screen.getByRole('columnheader', { name: '회사명' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '경력' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '마감일' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '기업 규모' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '지원 상태' })).toBeInTheDocument();
  });

  it('각 지원서 행이 렌더링된다', () => {
    render(<ApplicationsTable applications={mockApps} />);
    expect(screen.getByRole('cell', { name: '네이버' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '토스' })).toBeInTheDocument();
  });

  it('회사명에 상세 페이지 링크가 있다', () => {
    render(<ApplicationsTable applications={mockApps} />);
    const link = screen.getByRole('link', { name: '네이버' });
    expect(link).toHaveAttribute('href', '/applications/1');
  });

  it('데이터가 없으면 빈 상태 메시지를 표시한다', () => {
    render(<ApplicationsTable applications={[]} />);
    expect(screen.getByText('지원서가 없습니다.')).toBeInTheDocument();
  });

  it('지원 상태 우선, 같은 상태 내에서는 마감일 오름차순으로 정렬된다', () => {
    const apps: Application[] = [
      {
        id: 'a',
        companyName: '카카오',
        careerLevel: '신입',
        deadline: new Date('2026-05-01'),
        companySize: '대기업',
        coverLetters: [],
        status: '서류 탈락',
      },
      {
        id: 'b',
        companyName: '쿠팡',
        careerLevel: '신입',
        deadline: new Date('2026-04-20'),
        companySize: '대기업',
        coverLetters: [],
        status: '지원 예정',
      },
      {
        id: 'c',
        companyName: '토스',
        careerLevel: '신입',
        deadline: new Date('2026-04-10'),
        companySize: '스타트업',
        coverLetters: [],
        status: '지원 예정',
      },
    ];
    render(<ApplicationsTable applications={apps} />);
    const rows = screen.getAllByRole('row').slice(1); // 헤더 제외
    expect(rows[0]).toHaveTextContent('토스');   // 지원 예정, 4/10
    expect(rows[1]).toHaveTextContent('쿠팡');   // 지원 예정, 4/20
    expect(rows[2]).toHaveTextContent('카카오'); // 서류 탈락
  });
});

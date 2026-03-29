import { render, screen, fireEvent } from '@testing-library/react';
import { CoverLetterList } from '@/components/CoverLetterList';

const initialCoverLetters = [
  {
    id: 'cl-1',
    question: '지원 동기를 작성해주세요.',
    answer: '저는 귀사에 지원합니다.',
    type: null as null,
  },
];

describe('CoverLetterList', () => {
  it('"질문 추가" 버튼이 렌더링된다', () => {
    render(<CoverLetterList initialCoverLetters={initialCoverLetters} />);
    expect(screen.getByRole('button', { name: /질문 추가/ })).toBeInTheDocument();
  });

  it('"질문 추가" 버튼 클릭 시 아코디언 항목이 하나 추가된다', () => {
    render(<CoverLetterList initialCoverLetters={initialCoverLetters} />);
    const before = screen.getAllByRole('button').length;
    fireEvent.click(screen.getByRole('button', { name: /질문 추가/ }));
    // 새 아코디언 헤더(trigger)가 추가되어 버튼 수가 증가해야 함
    expect(screen.getAllByRole('button').length).toBeGreaterThan(before);
  });

  it('초기 항목이 없으면 빈 상태 메시지가 표시된다', () => {
    render(<CoverLetterList initialCoverLetters={[]} />);
    expect(screen.getByText(/자기소개서 항목이 없습니다/)).toBeInTheDocument();
  });

  it('초기 항목이 없어도 "질문 추가" 버튼은 표시된다', () => {
    render(<CoverLetterList initialCoverLetters={[]} />);
    expect(screen.getByRole('button', { name: /질문 추가/ })).toBeInTheDocument();
  });
});

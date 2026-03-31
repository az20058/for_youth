import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { NewApplicationForm } from '@/components/NewApplicationForm';
import * as actions from '@/app/applications/actions';

const mockPush = jest.fn();

jest.mock('@/app/applications/actions', () => ({
  createApplication: jest.fn().mockResolvedValue({}),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// DatePicker: 트리거 버튼 클릭 → 달력 팝오버 열림 → 활성화된 첫 날짜 클릭
// shadcn Select(Radix)는 combobox role로 렌더링됨
// label htmlFor 연결 대신 aria-label로 쿼리
function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText('회사명'), { target: { value: '네이버' } });
  fireEvent.change(screen.getByLabelText('경력'), { target: { value: '신입' } });

  // DatePicker: 트리거 클릭 → grid에서 비활성화되지 않은 첫 날 클릭
  fireEvent.click(screen.getByRole('button', { name: '마감일 선택' }));
  const grid = screen.getByRole('grid');
  const dayButtons = within(grid).getAllByRole('button');
  const enabledDayButtons = dayButtons.filter((btn) => !btn.hasAttribute('disabled'));
  fireEvent.click(enabledDayButtons[0]);

  // 기업 규모 Select: 트리거 클릭 → 옵션 즉시 렌더링 확인 후 클릭
  fireEvent.click(screen.getByRole('combobox', { name: '기업 규모 선택' }));
  fireEvent.click(screen.getByRole('option', { name: '대기업' }));
}

describe('NewApplicationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  it('폼이 렌더링된다', () => {
    render(<NewApplicationForm />);
    expect(screen.getByLabelText('회사명')).toBeInTheDocument();
    expect(screen.getByLabelText('경력')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '마감일 선택' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '기업 규모 선택' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '지원 상태 선택' })).toBeInTheDocument();
  });

  it('필수 필드 비우고 제출 → 에러 메시지 표시', async () => {
    render(<NewApplicationForm />);
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findByText('회사명을 입력해주세요.')).toBeInTheDocument();
    expect(screen.getByText('경력을 입력해주세요.')).toBeInTheDocument();
    expect(screen.getByText('마감일을 입력해주세요.')).toBeInTheDocument();
    expect(screen.getByText('기업 규모를 선택해주세요.')).toBeInTheDocument();
  });

  it('에러 있으면 createApplication 호출 안 함', () => {
    render(<NewApplicationForm />);
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(actions.createApplication).not.toHaveBeenCalled();
  });

  it('유효한 값 입력 후 제출 → createApplication 호출', async () => {
    render(<NewApplicationForm />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => {
      expect(actions.createApplication).toHaveBeenCalledTimes(1);
    });
    expect(actions.createApplication).toHaveBeenCalledWith(
      expect.objectContaining({
        companyName: '네이버',
        careerLevel: '신입',
        companySize: '대기업',
      }),
    );
  });

  it('제출 성공 후 /applications로 이동', async () => {
    render(<NewApplicationForm />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/applications');
    });
  });

  it('"질문 추가" 버튼 클릭 → 자기소개서 입력 영역 추가', () => {
    render(<NewApplicationForm />);
    fireEvent.click(screen.getByRole('button', { name: /질문 추가/ }));
    expect(screen.getByLabelText('자기소개서 1 질문')).toBeInTheDocument();
  });

  it('삭제 버튼 클릭 → 자기소개서 항목 제거', () => {
    render(<NewApplicationForm />);
    fireEvent.click(screen.getByRole('button', { name: /질문 추가/ }));
    expect(screen.getByLabelText('자기소개서 1 질문')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '자기소개서 1 삭제' }));
    expect(screen.queryByLabelText('자기소개서 1 질문')).not.toBeInTheDocument();
  });

  it('coverLetter 추가 후 question 비우고 제출 → 에러 메시지', async () => {
    render(<NewApplicationForm />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: /질문 추가/ }));
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findByText('자기소개서 항목에 질문을 입력해주세요.')).toBeInTheDocument();
    expect(actions.createApplication).not.toHaveBeenCalled();
  });
});

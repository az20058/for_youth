import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewApplicationForm } from '@/components/NewApplicationForm';
import * as actions from '@/app/applications/actions';

const mockPush = jest.fn();

jest.mock('@/app/applications/actions', () => ({
  createApplication: jest.fn().mockResolvedValue({}),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const futureDateStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
};

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText('회사명'), { target: { value: '네이버' } });
  fireEvent.change(screen.getByLabelText('경력'), { target: { value: '신입' } });
  fireEvent.change(screen.getByLabelText('마감일'), { target: { value: futureDateStr() } });
  fireEvent.change(screen.getByLabelText('기업 규모'), { target: { value: '대기업' } });
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
    expect(screen.getByLabelText('마감일')).toBeInTheDocument();
    expect(screen.getByLabelText('기업 규모')).toBeInTheDocument();
    expect(screen.getByLabelText('상태')).toBeInTheDocument();
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

  it('coverLetter 추가 후 question 비우고 제출 → 에러 메시지', async () => {
    render(<NewApplicationForm />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: /질문 추가/ }));
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findByText('자기소개서 항목에 질문을 입력해주세요.')).toBeInTheDocument();
    expect(actions.createApplication).not.toHaveBeenCalled();
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { CoverLetterAccordion } from '@/components/CoverLetterAccordion';

const defaultProps = {
  id: 'cl-1',
  question: '지원 동기를 작성해주세요.',
  answer: '저는 귀사의 기술력에 매력을 느껴 지원하게 되었습니다.',
  onQuestionChange: jest.fn(),
  onAnswerChange: jest.fn(),
};

describe('CoverLetterAccordion', () => {
  it('질문 텍스트가 헤더에 표시된다', () => {
    render(<CoverLetterAccordion {...defaultProps} />);
    expect(screen.getByText(defaultProps.question)).toBeInTheDocument();
  });

  it('초기 상태에서 답변 영역이 닫혀 있다', () => {
    render(<CoverLetterAccordion {...defaultProps} />);
    expect(screen.queryByDisplayValue(defaultProps.answer)).not.toBeInTheDocument();
  });

  it('헤더를 클릭하면 답변 입력 영역이 열린다', () => {
    render(<CoverLetterAccordion {...defaultProps} />);
    fireEvent.click(screen.getByText(defaultProps.question));
    expect(screen.getByDisplayValue(defaultProps.answer)).toBeInTheDocument();
  });

  it('열린 상태에서 헤더를 다시 클릭하면 닫힌다', () => {
    render(<CoverLetterAccordion {...defaultProps} />);
    const header = screen.getByText(defaultProps.question);
    fireEvent.click(header);
    fireEvent.click(header);
    expect(screen.queryByDisplayValue(defaultProps.answer)).not.toBeInTheDocument();
  });

  it('열린 상태에서 질문 input이 표시된다', () => {
    render(<CoverLetterAccordion {...defaultProps} />);
    fireEvent.click(screen.getByText(defaultProps.question));
    const questionInput = screen.getByDisplayValue(defaultProps.question);
    expect(questionInput).toBeInTheDocument();
  });

  it('답변 textarea에 값을 입력하면 onAnswerChange가 호출된다', () => {
    const onAnswerChange = jest.fn();
    render(<CoverLetterAccordion {...defaultProps} onAnswerChange={onAnswerChange} />);
    fireEvent.click(screen.getByText(defaultProps.question));
    const textarea = screen.getByDisplayValue(defaultProps.answer);
    fireEvent.change(textarea, { target: { value: '새로운 답변' } });
    expect(onAnswerChange).toHaveBeenCalledWith('cl-1', '새로운 답변');
  });

  it('질문 input에 값을 입력하면 onQuestionChange가 호출된다', () => {
    const onQuestionChange = jest.fn();
    render(<CoverLetterAccordion {...defaultProps} onQuestionChange={onQuestionChange} />);
    fireEvent.click(screen.getByText(defaultProps.question));
    const questionInput = screen.getByDisplayValue(defaultProps.question);
    fireEvent.change(questionInput, { target: { value: '새로운 질문' } });
    expect(onQuestionChange).toHaveBeenCalledWith('cl-1', '새로운 질문');
  });

  it('글자 수가 표시된다', () => {
    render(<CoverLetterAccordion {...defaultProps} />);
    fireEvent.click(screen.getByText(defaultProps.question));
    const charCount = defaultProps.answer.length;
    expect(screen.getByText(new RegExp(`${charCount}`))).toBeInTheDocument();
  });
});

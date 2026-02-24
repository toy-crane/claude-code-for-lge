import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodoApp } from "@/components/todo-app";

beforeEach(() => {
  localStorage.clear();
});

describe("Todo 앱 검증 체크리스트", () => {
  // 체크리스트 1: 입력 필드에 "장보기" 입력 후 Enter -> 목록에 추가됨
  test('입력 필드에 "장보기" 입력 후 Enter를 누르면 목록에 추가된다', async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    const input = screen.getByPlaceholderText("할 일을 입력하세요");
    await user.type(input, "장보기");
    await user.keyboard("{Enter}");

    expect(screen.getByText("장보기")).toBeInTheDocument();
  });

  // 체크리스트 2: 빈 입력 상태에서 Enter -> Todo가 추가되지 않음
  test("빈 입력 상태에서 Enter를 누르면 Todo가 추가되지 않는다", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    const input = screen.getByPlaceholderText("할 일을 입력하세요");
    await user.click(input);
    await user.keyboard("{Enter}");

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  // 체크리스트 3: 체크박스 클릭 -> 완료 표시 (취소선)
  test("체크박스를 클릭하면 완료 표시(취소선)가 된다", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<TodoApp />);

    const input = screen.getByPlaceholderText("할 일을 입력하세요");
    await user.type(input, "장보기");
    await user.keyboard("{Enter}");

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    expect(screen.getByText("장보기")).toHaveClass("line-through");

    jest.useRealTimers();
  });

  // 체크리스트 4: 삭제 버튼 클릭 -> 해당 항목 제거
  test("삭제 버튼을 클릭하면 해당 항목이 제거된다", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    const input = screen.getByPlaceholderText("할 일을 입력하세요");
    await user.type(input, "장보기");
    await user.keyboard("{Enter}");

    expect(screen.getByText("장보기")).toBeInTheDocument();

    const deleteButton = screen.getByRole("button");
    await user.click(deleteButton);

    expect(screen.queryByText("장보기")).not.toBeInTheDocument();
  });

  // 체크리스트 5: 페이지 새로고침 -> 기존 목록 유지
  test("페이지를 새로고침해도 기존 목록이 유지된다", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<TodoApp />);

    const input = screen.getByPlaceholderText("할 일을 입력하세요");
    await user.type(input, "장보기");
    await user.keyboard("{Enter}");

    expect(screen.getByText("장보기")).toBeInTheDocument();

    // localStorage에 데이터가 저장되었는지 확인
    const stored = JSON.parse(localStorage.getItem("todos")!);
    expect(stored).toHaveLength(1);
    expect(stored[0].text).toBe("장보기");

    // 페이지 새로고침 시뮬레이션: 언마운트 후 다시 마운트
    unmount();
    render(<TodoApp />);

    expect(screen.getByText("장보기")).toBeInTheDocument();
  });
});

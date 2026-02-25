import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodoApp } from "@/components/todo-app";
import type { Todo } from "@/lib/types";

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
    const user = userEvent.setup();
    render(<TodoApp />);

    const input = screen.getByPlaceholderText("할 일을 입력하세요");
    await user.type(input, "장보기");
    await user.keyboard("{Enter}");

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    expect(screen.getByText("장보기")).toHaveClass("line-through");
  });

  // 체크리스트 4: 삭제 버튼 클릭 -> 해당 항목 제거
  test("삭제 버튼을 클릭하면 해당 항목이 제거된다", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    const input = screen.getByPlaceholderText("할 일을 입력하세요");
    await user.type(input, "장보기");
    await user.keyboard("{Enter}");

    expect(screen.getByText("장보기")).toBeInTheDocument();

    const deleteButton = screen.getByRole("button", { name: "" });
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

describe("우선순위 기능", () => {
  test("기본 우선순위(보통)로 Todo가 추가된다", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    const input = screen.getByPlaceholderText("할 일을 입력하세요");
    await user.type(input, "장보기");
    await user.keyboard("{Enter}");

    // Badge로 표시된 우선순위 확인 (data-slot="badge" 속성)
    const badge = screen.getByText("보통", { selector: '[data-slot="badge"]' });
    expect(badge).toBeInTheDocument();
  });

  test("우선순위를 높음으로 선택하면 높음 배지가 표시된다", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    // 우선순위 선택
    const priorityTrigger = screen.getByLabelText("우선순위");
    await user.click(priorityTrigger);
    const highOption = screen.getByRole("option", { name: "높음" });
    await user.click(highOption);

    // Todo 추가
    const input = screen.getByPlaceholderText("할 일을 입력하세요");
    await user.type(input, "긴급 작업");
    await user.keyboard("{Enter}");

    // 배지 확인
    expect(screen.getByText("높음")).toBeInTheDocument();
    expect(screen.getByText("긴급 작업")).toBeInTheDocument();
  });

  test("Todo 추가 후 우선순위가 보통으로 리셋된다", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    // 우선순위를 높음으로 변경
    const priorityTrigger = screen.getByLabelText("우선순위");
    await user.click(priorityTrigger);
    const highOption = screen.getByRole("option", { name: "높음" });
    await user.click(highOption);

    // Todo 추가
    const input = screen.getByPlaceholderText("할 일을 입력하세요");
    await user.type(input, "긴급 작업");
    await user.keyboard("{Enter}");

    // 리셋 후 셀렉트 값 확인 - 트리거 텍스트가 "보통"인지
    expect(priorityTrigger).toHaveTextContent("보통");
  });
});

describe("필터링 기능", () => {
  function seedTodos() {
    const todos: Todo[] = [
      { id: "1", text: "할일 1", completed: false, priority: "medium", createdAt: 1 },
      { id: "2", text: "할일 2", completed: true, priority: "high", createdAt: 2 },
      { id: "3", text: "할일 3", completed: false, priority: "low", createdAt: 3 },
      { id: "4", text: "할일 4", completed: true, priority: "medium", createdAt: 4 },
      { id: "5", text: "할일 5", completed: false, priority: "high", createdAt: 5 },
    ];
    localStorage.setItem("todos", JSON.stringify(todos));
  }

  test("전체 필터: 모든 Todo가 표시된다", async () => {
    seedTodos();
    const user = userEvent.setup();
    render(<TodoApp />);

    await user.click(screen.getByRole("button", { name: "전체" }));

    expect(screen.getAllByRole("checkbox")).toHaveLength(5);
  });

  test("진행중 필터: 미완료 항목만 표시된다", async () => {
    seedTodos();
    const user = userEvent.setup();
    render(<TodoApp />);

    await user.click(screen.getByRole("button", { name: "진행중" }));

    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
    expect(screen.queryByText("할일 2")).not.toBeInTheDocument();
    expect(screen.queryByText("할일 4")).not.toBeInTheDocument();
  });

  test("완료 필터: 완료된 항목만 표시된다", async () => {
    seedTodos();
    const user = userEvent.setup();
    render(<TodoApp />);

    await user.click(screen.getByRole("button", { name: "완료" }));

    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(screen.queryByText("할일 1")).not.toBeInTheDocument();
    expect(screen.queryByText("할일 3")).not.toBeInTheDocument();
    expect(screen.queryByText("할일 5")).not.toBeInTheDocument();
  });

  test("빈 목록 메시지: 필터 결과가 없으면 '할 일이 없습니다' 표시", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    await user.click(screen.getByRole("button", { name: "진행중" }));

    expect(screen.getByText("할 일이 없습니다")).toBeInTheDocument();
  });

  test("실시간 반영: 완료 필터에서 체크 해제하면 목록에서 사라진다", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    seedTodos();
    render(<TodoApp />);

    await user.click(screen.getByRole("button", { name: "완료" }));
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);

    // 첫 번째 완료 항목의 체크박스 해제
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);

    // 완료 필터에서 해당 항목이 사라짐
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);

    jest.useRealTimers();
  });

  test("활성 스타일: 선택된 필터 버튼에 data-active 속성이 있다", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    const allBtn = screen.getByRole("button", { name: "전체" });
    const activeBtn = screen.getByRole("button", { name: "진행중" });
    const completedBtn = screen.getByRole("button", { name: "완료" });

    // 기본 상태: 전체 활성
    expect(allBtn).toHaveAttribute("data-active", "true");
    expect(activeBtn).not.toHaveAttribute("data-active", "true");

    // 진행중 클릭
    await user.click(activeBtn);
    expect(activeBtn).toHaveAttribute("data-active", "true");
    expect(allBtn).not.toHaveAttribute("data-active", "true");
    expect(completedBtn).not.toHaveAttribute("data-active", "true");
  });
});

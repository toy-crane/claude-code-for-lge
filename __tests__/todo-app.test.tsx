import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodoApp } from "@/components/todo-app";
import type { Todo, SubTask } from "@/lib/types";

beforeEach(() => {
  localStorage.clear();
});

describe("SubTask 타입", () => {
  test("SubTask 객체를 생성할 수 있다", () => {
    const subtask: SubTask = {
      id: "sub-1",
      text: "하위 작업",
      completed: false,
      order: 0,
    };
    expect(subtask.id).toBe("sub-1");
    expect(subtask.text).toBe("하위 작업");
    expect(subtask.completed).toBe(false);
    expect(subtask.order).toBe(0);
  });

  test("Todo 객체에 subtasks 배열이 포함된다", () => {
    const todo: Todo = {
      id: "1",
      text: "부모 할일",
      completed: false,
      priority: "medium",
      createdAt: Date.now(),
      subtasks: [],
    };
    expect(todo.subtasks).toEqual([]);
  });
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

    const statusFilterGroup = screen.getByRole("group", { name: "상태 필터" });
    await user.click(within(statusFilterGroup).getByRole("button", { name: "전체" }));

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

    const statusFilterGroup = screen.getByRole("group", { name: "상태 필터" });
    const allBtn = within(statusFilterGroup).getByRole("button", { name: "전체" });
    const activeBtn = within(statusFilterGroup).getByRole("button", { name: "진행중" });
    const completedBtn = within(statusFilterGroup).getByRole("button", { name: "완료" });

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

describe("마감일 기능", () => {
  test("마감일 없이 Todo를 추가하면 정상적으로 추가되고 날짜가 표시되지 않는다", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    const input = screen.getByPlaceholderText("할 일을 입력하세요");
    await user.type(input, "장보기");
    await user.keyboard("{Enter}");

    expect(screen.getByText("장보기")).toBeInTheDocument();
    expect(screen.queryByText(/\d{4}-\d{2}-\d{2}/)).not.toBeInTheDocument();
  });

  test("마감일을 설정하면 Todo 목록에 날짜가 표시된다", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    const dateInput = screen.getByLabelText("마감일");
    fireEvent.change(dateInput, { target: { value: "2026-03-15" } });

    const input = screen.getByPlaceholderText("할 일을 입력하세요");
    await user.type(input, "보고서 제출");
    await user.keyboard("{Enter}");

    expect(screen.getByText("보고서 제출")).toBeInTheDocument();
    expect(screen.getByText("2026-03-15")).toBeInTheDocument();
  });

  test("Todo 추가 후 마감일 입력이 초기화된다", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    const dateInput = screen.getByLabelText("마감일") as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2026-03-15" } });

    const input = screen.getByPlaceholderText("할 일을 입력하세요");
    await user.type(input, "보고서 제출");
    await user.keyboard("{Enter}");

    expect(dateInput.value).toBe("");
  });
});

describe("정렬 기능", () => {
  function seedTodosForSort() {
    const todos: Todo[] = [
      { id: "1", text: "다람쥐", completed: false, priority: "medium", createdAt: 1 },
      { id: "2", text: "가나다", completed: false, priority: "high", createdAt: 2 },
      { id: "3", text: "바나나", completed: false, priority: "low", createdAt: 3 },
      { id: "4", text: "아이스크림", completed: false, priority: "medium", createdAt: 4 },
      { id: "5", text: "나비", completed: false, priority: "high", createdAt: 5 },
    ];
    localStorage.setItem("todos", JSON.stringify(todos));
  }

  test("이름순 정렬: 가나다순으로 표시된다", async () => {
    seedTodosForSort();
    const user = userEvent.setup();
    render(<TodoApp />);

    const sortTrigger = screen.getByLabelText("정렬");
    await user.click(sortTrigger);
    const nameOption = screen.getByRole("option", { name: "이름순" });
    await user.click(nameOption);

    const items = screen.getAllByRole("checkbox");
    const texts = items.map((item) => {
      const container = item.closest(".group");
      return container?.querySelector("span.flex-1")?.textContent;
    });
    expect(texts).toEqual(["가나다", "나비", "다람쥐", "바나나", "아이스크림"]);
  });

  test("생성일순 정렬: 최신 항목이 먼저 표시된다", async () => {
    seedTodosForSort();
    const user = userEvent.setup();
    render(<TodoApp />);

    // 기본값이 생성일순
    const items = screen.getAllByRole("checkbox");
    const texts = items.map((item) => {
      const container = item.closest(".group");
      return container?.querySelector("span.flex-1")?.textContent;
    });
    expect(texts).toEqual(["나비", "아이스크림", "바나나", "가나다", "다람쥐"]);
  });

  test("정렬 셀렉트에 현재 정렬 기준이 표시된다", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    const sortTrigger = screen.getByLabelText("정렬");
    expect(sortTrigger).toHaveTextContent("생성일순");

    await user.click(sortTrigger);
    const nameOption = screen.getByRole("option", { name: "이름순" });
    await user.click(nameOption);

    expect(sortTrigger).toHaveTextContent("이름순");
  });
});

describe("마감일순 정렬 기능", () => {
  function seedTodosWithDueDates() {
    const todos: Todo[] = [
      { id: "1", text: "회의 준비", completed: false, priority: "high", createdAt: 1, dueDate: "2026-03-20" },
      { id: "2", text: "보고서 작성", completed: false, priority: "medium", createdAt: 2, dueDate: "2026-03-10" },
      { id: "3", text: "운동하기", completed: false, priority: "low", createdAt: 3 },
      { id: "4", text: "장보기", completed: false, priority: "medium", createdAt: 4, dueDate: "2026-03-15" },
      { id: "5", text: "독서", completed: false, priority: "low", createdAt: 5 },
    ];
    localStorage.setItem("todos", JSON.stringify(todos));
  }

  test("마감일순 정렬: 마감일이 가까운 항목이 먼저 표시된다", async () => {
    seedTodosWithDueDates();
    const user = userEvent.setup();
    render(<TodoApp />);

    const sortTrigger = screen.getByLabelText("정렬");
    await user.click(sortTrigger);
    const dueDateOption = screen.getByRole("option", { name: "마감일순" });
    await user.click(dueDateOption);

    const items = screen.getAllByRole("checkbox");
    const texts = items.map((item) => {
      const container = item.closest(".group");
      return container?.querySelector("span.flex-1")?.textContent;
    });
    expect(texts[0]).toBe("보고서 작성");
    expect(texts[1]).toBe("장보기");
    expect(texts[2]).toBe("회의 준비");
  });

  test("마감일순 정렬: 마감일이 없는 항목은 마지막에 표시된다", async () => {
    seedTodosWithDueDates();
    const user = userEvent.setup();
    render(<TodoApp />);

    const sortTrigger = screen.getByLabelText("정렬");
    await user.click(sortTrigger);
    const dueDateOption = screen.getByRole("option", { name: "마감일순" });
    await user.click(dueDateOption);

    const items = screen.getAllByRole("checkbox");
    const texts = items.map((item) => {
      const container = item.closest(".group");
      return container?.querySelector("span.flex-1")?.textContent;
    });
    expect(texts[3]).toBe("운동하기");
    expect(texts[4]).toBe("독서");
  });
});

describe("검색 기능", () => {
  function seedTodosForSearch() {
    const todos: Todo[] = [
      { id: "1", text: "팀 회의 준비", completed: false, priority: "high", createdAt: 1 },
      { id: "2", text: "장보기", completed: false, priority: "medium", createdAt: 2 },
      { id: "3", text: "회의록 작성", completed: false, priority: "low", createdAt: 3 },
      { id: "4", text: "운동하기", completed: false, priority: "medium", createdAt: 4 },
      { id: "5", text: "보고서 작성", completed: false, priority: "high", createdAt: 5 },
    ];
    localStorage.setItem("todos", JSON.stringify(todos));
  }

  test("검색어 '회의'를 입력하면 회의가 포함된 항목만 표시된다", async () => {
    seedTodosForSearch();
    const user = userEvent.setup();
    render(<TodoApp />);

    const searchInput = screen.getByPlaceholderText("검색어를 입력하세요");
    await user.type(searchInput, "회의");

    const items = screen.getAllByRole("checkbox");
    expect(items).toHaveLength(2);
    expect(screen.getByText("팀 회의 준비")).toBeInTheDocument();
    expect(screen.getByText("회의록 작성")).toBeInTheDocument();
  });

  test("검색어를 지우면 전체 목록이 복원된다", async () => {
    seedTodosForSearch();
    const user = userEvent.setup();
    render(<TodoApp />);

    const searchInput = screen.getByPlaceholderText("검색어를 입력하세요");
    await user.type(searchInput, "회의");
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);

    await user.clear(searchInput);
    expect(screen.getAllByRole("checkbox")).toHaveLength(5);
  });
});

describe("카테고리 태그 기능", () => {
  test("카테고리 없이 Todo를 추가하면 카테고리 배지가 표시되지 않는다", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    const input = screen.getByPlaceholderText("할 일을 입력하세요");
    await user.type(input, "장보기");
    await user.keyboard("{Enter}");

    expect(screen.getByText("장보기")).toBeInTheDocument();
    // 카테고리 배지(variant="outline")가 Todo 아이템 안에 없는지 확인
    const todoItem = screen.getByText("장보기").closest(".group");
    expect(todoItem).not.toBeNull();
    expect(within(todoItem!).queryByText("업무")).not.toBeInTheDocument();
    expect(within(todoItem!).queryByText("개인")).not.toBeInTheDocument();
    expect(within(todoItem!).queryByText("쇼핑")).not.toBeInTheDocument();
  });

  test("업무 카테고리를 선택하면 Todo에 업무 태그가 표시된다", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    const categoryTrigger = screen.getByLabelText("카테고리");
    await user.click(categoryTrigger);
    const workOption = screen.getByRole("option", { name: "업무" });
    await user.click(workOption);

    const input = screen.getByPlaceholderText("할 일을 입력하세요");
    await user.type(input, "보고서 작성");
    await user.keyboard("{Enter}");

    expect(screen.getByText("보고서 작성")).toBeInTheDocument();
    const todoItem = screen.getByText("보고서 작성").closest(".group");
    expect(within(todoItem!).getByText("업무")).toBeInTheDocument();
  });

  test("Todo 추가 후 카테고리 선택이 초기화된다", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    const categoryTrigger = screen.getByLabelText("카테고리");
    await user.click(categoryTrigger);
    const workOption = screen.getByRole("option", { name: "업무" });
    await user.click(workOption);

    const input = screen.getByPlaceholderText("할 일을 입력하세요");
    await user.type(input, "보고서 작성");
    await user.keyboard("{Enter}");

    expect(categoryTrigger).toHaveTextContent("없음");
  });
});

describe("카테고리 필터 기능", () => {
  function seedTodosWithCategories() {
    const todos: Todo[] = [
      { id: "1", text: "보고서 작성", completed: false, priority: "high", createdAt: 1, category: "업무" },
      { id: "2", text: "장보기", completed: false, priority: "medium", createdAt: 2, category: "쇼핑" },
      { id: "3", text: "운동하기", completed: false, priority: "low", createdAt: 3, category: "개인" },
      { id: "4", text: "회의 준비", completed: false, priority: "medium", createdAt: 4, category: "업무" },
      { id: "5", text: "독서", completed: false, priority: "low", createdAt: 5 },
    ];
    localStorage.setItem("todos", JSON.stringify(todos));
  }

  test("업무 카테고리 필터: 업무 태그가 있는 항목만 표시된다", async () => {
    seedTodosWithCategories();
    const user = userEvent.setup();
    render(<TodoApp />);

    const categoryFilterGroup = screen.getByRole("group", { name: "카테고리 필터" });
    const workBtn = within(categoryFilterGroup).getByRole("button", { name: "업무" });
    await user.click(workBtn);

    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(screen.getByText("보고서 작성")).toBeInTheDocument();
    expect(screen.getByText("회의 준비")).toBeInTheDocument();
  });

  test("전체 카테고리 필터: 모든 항목이 표시된다", async () => {
    seedTodosWithCategories();
    const user = userEvent.setup();
    render(<TodoApp />);

    const categoryFilterGroup = screen.getByRole("group", { name: "카테고리 필터" });
    const workBtn = within(categoryFilterGroup).getByRole("button", { name: "업무" });
    await user.click(workBtn);
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);

    const allBtn = within(categoryFilterGroup).getByRole("button", { name: "전체" });
    await user.click(allBtn);
    expect(screen.getAllByRole("checkbox")).toHaveLength(5);
  });

  test("카테고리 필터 활성 스타일: 선택된 버튼에 data-active 속성이 있다", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    const categoryFilterGroup = screen.getByRole("group", { name: "카테고리 필터" });
    const allBtn = within(categoryFilterGroup).getByRole("button", { name: "전체" });
    const workBtn = within(categoryFilterGroup).getByRole("button", { name: "업무" });

    expect(allBtn).toHaveAttribute("data-active", "true");
    expect(workBtn).not.toHaveAttribute("data-active", "true");

    await user.click(workBtn);
    expect(workBtn).toHaveAttribute("data-active", "true");
    expect(allBtn).not.toHaveAttribute("data-active", "true");
  });
});

describe("서브태스크 통합 테스트", () => {
  test("서브태스크를 추가하면 진행률이 표시된다", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    // 부모 Todo 추가
    const input = screen.getByPlaceholderText("할 일을 입력하세요");
    await user.type(input, "프로젝트 기획");
    await user.keyboard("{Enter}");

    // 펼침 버튼 클릭
    const expandButton = screen.getByRole("button", { name: /펼치기/ });
    await user.click(expandButton);

    // 서브태스크 추가
    const subtaskInput = screen.getByPlaceholderText("서브태스크 입력");
    await user.type(subtaskInput, "목차 정리");
    const addButton = screen.getByRole("button", { name: "추가" });
    await user.click(addButton);

    expect(screen.getByText("목차 정리")).toBeInTheDocument();
    expect(screen.getByText("0/1")).toBeInTheDocument();
  });

  test("서브태스크 체크박스를 클릭하면 진행률이 갱신된다", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    const input = screen.getByPlaceholderText("할 일을 입력하세요");
    await user.type(input, "프로젝트 기획");
    await user.keyboard("{Enter}");

    const expandButton = screen.getByRole("button", { name: /펼치기/ });
    await user.click(expandButton);

    const subtaskInput = screen.getByPlaceholderText("서브태스크 입력");
    const addButton = screen.getByRole("button", { name: "추가" });
    await user.type(subtaskInput, "목차 정리");
    await user.click(addButton);

    // 서브태스크 체크
    const subtaskCheckbox = screen.getByRole("checkbox", { name: /목차 정리 완료/ });
    await user.click(subtaskCheckbox);

    expect(screen.getByText("1/1")).toBeInTheDocument();
  });

  test("부모 Todo 완료 시 모든 서브태스크가 자동 완료된다", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    const input = screen.getByPlaceholderText("할 일을 입력하세요");
    await user.type(input, "프로젝트 기획");
    await user.keyboard("{Enter}");

    const expandButton = screen.getByRole("button", { name: /펼치기/ });
    await user.click(expandButton);

    const subtaskInput = screen.getByPlaceholderText("서브태스크 입력");
    const addButton = screen.getByRole("button", { name: "추가" });
    await user.type(subtaskInput, "목차 정리");
    await user.click(addButton);
    await user.type(subtaskInput, "참고자료 수집");
    await user.click(addButton);

    // 부모 Todo의 체크박스 클릭 (서브태스크 체크박스가 아닌 부모 체크박스)
    const checkboxes = screen.getAllByRole("checkbox");
    // 첫 번째 체크박스가 부모 Todo의 체크박스
    await user.click(checkboxes[0]);

    expect(screen.getByText("2/2")).toBeInTheDocument();
  });

  test("서브태스크를 삭제하면 진행률이 갱신된다", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    const input = screen.getByPlaceholderText("할 일을 입력하세요");
    await user.type(input, "프로젝트 기획");
    await user.keyboard("{Enter}");

    const expandButton = screen.getByRole("button", { name: /펼치기/ });
    await user.click(expandButton);

    const subtaskInput = screen.getByPlaceholderText("서브태스크 입력");
    const addButton = screen.getByRole("button", { name: "추가" });
    await user.type(subtaskInput, "목차 정리");
    await user.click(addButton);
    await user.type(subtaskInput, "참고자료 수집");
    await user.click(addButton);

    expect(screen.getByText("0/2")).toBeInTheDocument();

    // 서브태스크 삭제
    const deleteButton = screen.getByRole("button", { name: /목차 정리 삭제/ });
    await user.click(deleteButton);

    expect(screen.getByText("0/1")).toBeInTheDocument();
  });

  test("서브태스크에 드래그 핸들이 표시된다", async () => {
    const todo = {
      id: "todo-1",
      text: "프로젝트 기획",
      completed: false,
      priority: "medium",
      createdAt: Date.now(),
      subtasks: [
        { id: "sub-1", text: "작업 A", completed: false, order: 0 },
        { id: "sub-2", text: "작업 B", completed: false, order: 1 },
        { id: "sub-3", text: "작업 C", completed: false, order: 2 },
      ],
    };
    localStorage.setItem("todos", JSON.stringify([todo]));

    const user = userEvent.setup();
    render(<TodoApp />);

    const expandButton = screen.getByRole("button", { name: /펼치기/ });
    await user.click(expandButton);

    // 드래그 핸들이 각 서브태스크에 존재하는지 확인
    const dragHandles = screen.getAllByTestId("drag-handle");
    expect(dragHandles).toHaveLength(3);
  });
});

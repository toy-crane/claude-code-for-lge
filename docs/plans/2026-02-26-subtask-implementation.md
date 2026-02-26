# 서브태스크 기능 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Todo 항목에 1단계 서브태스크를 추가하여 세분화 관리 및 진행률 표시 기능 구현

**Architecture:** 기존 Todo 타입에 `subtasks: SubTask[]` 배열을 내장하고, `use-todos` Hook에 서브태스크 CRUD 메서드를 추가한다. UI는 TodoItem 내부에 펼침/접힘으로 서브태스크 목록을 표시하며, @dnd-kit으로 드래그 순서 변경을 구현한다.

**Tech Stack:** React 19, Next.js 16, @dnd-kit/core + @dnd-kit/sortable, localStorage

**설계 문서:** `docs/plans/2026-02-26-subtask-design.md`, `.claude/specs/subtask.md`

---

### Task 1: @dnd-kit 패키지 설치

**Files:**
- Modify: `package.json`

**Step 1: 패키지 설치**

Run: `bun add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

**Step 2: 설치 확인**

Run: `bun run build`
Expected: 빌드 성공 (기존 코드에 영향 없음)

**Step 3: 커밋**

```bash
git add package.json bun.lock
git commit -m "chore: add @dnd-kit packages for subtask drag-and-drop"
```

---

### Task 2: SubTask 타입 추가 및 Todo 타입 확장

**Files:**
- Modify: `lib/types.ts`

**Step 1: 실패하는 테스트 작성**

`__tests__/todo-app.test.tsx` 파일 상단의 import 아래에 타입 테스트 추가:

```typescript
import type { Todo, SubTask } from "@/lib/types";

// 타입 검증: SubTask 타입이 올바른 필드를 가지는지 확인
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
```

**Step 2: 테스트 실행 — 실패 확인**

Run: `bun run test -- --testPathPattern="todo-app" 2>&1 | head -30`
Expected: FAIL — `SubTask` 타입이 존재하지 않음

**Step 3: 타입 구현**

`lib/types.ts`에 추가:

```typescript
export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
  order: number;
}
```

기존 `Todo` 인터페이스에 `subtasks` 필드 추가:

```typescript
export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  createdAt: number;
  dueDate?: string;
  category?: Category;
  subtasks: SubTask[];
}
```

**Step 4: use-todos Hook 호환성 수정**

`hooks/use-todos.ts`의 `addTodo` 함수에서 새 Todo 생성 시 `subtasks: []` 추가:

```typescript
const newTodo: Todo = {
  id: crypto.randomUUID(),
  text: trimmed,
  completed: false,
  priority,
  createdAt: Date.now(),
  ...(dueDate ? { dueDate } : {}),
  ...(category ? { category } : {}),
  subtasks: [],
};
```

**Step 5: 테스트 실행 — 통과 확인**

Run: `bun run test -- --testPathPattern="todo-app" 2>&1 | tail -20`
Expected: 모든 테스트 PASS (기존 테스트 포함)

**Step 6: 커밋**

```bash
git add lib/types.ts hooks/use-todos.ts __tests__/todo-app.test.tsx
git commit -m "feat: add SubTask type and extend Todo with subtasks field"
```

---

### Task 3: use-todos Hook에 서브태스크 CRUD 메서드 추가

**Files:**
- Modify: `hooks/use-todos.ts`
- Modify: `__tests__/todo-app.test.tsx`

**Step 1: addSubtask 실패 테스트 작성**

```typescript
describe("서브태스크 기능", () => {
  test("Todo에 서브태스크를 추가할 수 있다", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    // 부모 Todo 추가
    const input = screen.getByPlaceholderText("할 일을 입력하세요");
    await user.type(input, "프로젝트 기획");
    await user.keyboard("{Enter}");

    // 서브태스크 추가 UI 열기 (... 메뉴 또는 펼침 버튼)
    const expandButton = screen.getByRole("button", { name: /펼치기/ });
    await user.click(expandButton);

    // 서브태스크 추가
    const subtaskInput = screen.getByPlaceholderText("서브태스크 입력");
    await user.type(subtaskInput, "목차 정리");
    const addButton = screen.getByRole("button", { name: "추가" });
    await user.click(addButton);

    expect(screen.getByText("목차 정리")).toBeInTheDocument();
  });

  test("서브태스크 추가 시 진행률이 표시된다", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    const input = screen.getByPlaceholderText("할 일을 입력하세요");
    await user.type(input, "프로젝트 기획");
    await user.keyboard("{Enter}");

    const expandButton = screen.getByRole("button", { name: /펼치기/ });
    await user.click(expandButton);

    // 서브태스크 2개 추가
    const subtaskInput = screen.getByPlaceholderText("서브태스크 입력");
    const addButton = screen.getByRole("button", { name: "추가" });

    await user.type(subtaskInput, "목차 정리");
    await user.click(addButton);
    await user.type(subtaskInput, "참고자료 수집");
    await user.click(addButton);

    expect(screen.getByText("0/2")).toBeInTheDocument();
  });
});
```

**Step 2: 테스트 실행 — 실패 확인**

Run: `bun run test -- --testPathPattern="todo-app" --testNamePattern="서브태스크" 2>&1 | tail -20`
Expected: FAIL

**Step 3: use-todos Hook에 메서드 구현**

`hooks/use-todos.ts`에 4개 메서드 추가:

```typescript
const addSubtask = useCallback((todoId: string, text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return;
  writeTodos(
    getSnapshot().map((todo) =>
      todo.id === todoId
        ? {
            ...todo,
            subtasks: [
              ...todo.subtasks,
              {
                id: crypto.randomUUID(),
                text: trimmed,
                completed: false,
                order: todo.subtasks.length,
              },
            ],
          }
        : todo
    )
  );
}, []);

const toggleSubtask = useCallback((todoId: string, subtaskId: string) => {
  writeTodos(
    getSnapshot().map((todo) =>
      todo.id === todoId
        ? {
            ...todo,
            subtasks: todo.subtasks.map((s) =>
              s.id === subtaskId ? { ...s, completed: !s.completed } : s
            ),
          }
        : todo
    )
  );
}, []);

const deleteSubtask = useCallback((todoId: string, subtaskId: string) => {
  writeTodos(
    getSnapshot().map((todo) =>
      todo.id === todoId
        ? {
            ...todo,
            subtasks: todo.subtasks
              .filter((s) => s.id !== subtaskId)
              .map((s, i) => ({ ...s, order: i })),
          }
        : todo
    )
  );
}, []);

const reorderSubtasks = useCallback((todoId: string, subtaskIds: string[]) => {
  writeTodos(
    getSnapshot().map((todo) => {
      if (todo.id !== todoId) return todo;
      const reordered = subtaskIds
        .map((id, i) => {
          const subtask = todo.subtasks.find((s) => s.id === id);
          return subtask ? { ...subtask, order: i } : null;
        })
        .filter((s): s is SubTask => s !== null);
      return { ...todo, subtasks: reordered };
    })
  );
}, []);
```

`toggleTodo`를 수정하여 부모 완료 시 서브태스크 자동 완료:

```typescript
const toggleTodo = useCallback((id: string) => {
  writeTodos(
    getSnapshot().map((todo) => {
      if (todo.id !== id) return todo;
      const newCompleted = !todo.completed;
      return {
        ...todo,
        completed: newCompleted,
        subtasks: newCompleted
          ? todo.subtasks.map((s) => ({ ...s, completed: true }))
          : todo.subtasks,
      };
    })
  );
}, []);
```

return에 새 메서드 추가:

```typescript
return {
  todos, isLoaded,
  addTodo, toggleTodo, deleteTodo, editTodo,
  addSubtask, toggleSubtask, deleteSubtask, reorderSubtasks,
};
```

**Step 4: 이 시점에서는 UI가 아직 없으므로, Hook 단위 테스트를 별도로 작성**

`__tests__/use-todos.test.ts` 파일 생성:

```typescript
import { renderHook, act } from "@testing-library/react";
import { useTodos } from "@/hooks/use-todos";

beforeEach(() => {
  localStorage.clear();
});

describe("useTodos - 서브태스크", () => {
  test("addSubtask: Todo에 서브태스크를 추가한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo({ text: "부모 할일" });
    });

    const todoId = result.current.todos[0].id;

    act(() => {
      result.current.addSubtask(todoId, "하위 작업 1");
    });

    expect(result.current.todos[0].subtasks).toHaveLength(1);
    expect(result.current.todos[0].subtasks[0].text).toBe("하위 작업 1");
    expect(result.current.todos[0].subtasks[0].completed).toBe(false);
  });

  test("toggleSubtask: 서브태스크 완료 상태를 토글한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo({ text: "부모 할일" });
    });
    const todoId = result.current.todos[0].id;

    act(() => {
      result.current.addSubtask(todoId, "하위 작업");
    });
    const subtaskId = result.current.todos[0].subtasks[0].id;

    act(() => {
      result.current.toggleSubtask(todoId, subtaskId);
    });

    expect(result.current.todos[0].subtasks[0].completed).toBe(true);
  });

  test("deleteSubtask: 서브태스크를 삭제하고 order를 재계산한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo({ text: "부모 할일" });
    });
    const todoId = result.current.todos[0].id;

    act(() => {
      result.current.addSubtask(todoId, "작업 1");
      result.current.addSubtask(todoId, "작업 2");
      result.current.addSubtask(todoId, "작업 3");
    });

    const subtaskToDelete = result.current.todos[0].subtasks[0].id;

    act(() => {
      result.current.deleteSubtask(todoId, subtaskToDelete);
    });

    expect(result.current.todos[0].subtasks).toHaveLength(2);
    expect(result.current.todos[0].subtasks[0].order).toBe(0);
    expect(result.current.todos[0].subtasks[1].order).toBe(1);
  });

  test("toggleTodo: 부모 완료 시 모든 서브태스크가 자동 완료된다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo({ text: "부모 할일" });
    });
    const todoId = result.current.todos[0].id;

    act(() => {
      result.current.addSubtask(todoId, "작업 1");
      result.current.addSubtask(todoId, "작업 2");
    });

    act(() => {
      result.current.toggleTodo(todoId);
    });

    expect(result.current.todos[0].completed).toBe(true);
    expect(result.current.todos[0].subtasks[0].completed).toBe(true);
    expect(result.current.todos[0].subtasks[1].completed).toBe(true);
  });

  test("reorderSubtasks: 서브태스크 순서를 변경한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo({ text: "부모 할일" });
    });
    const todoId = result.current.todos[0].id;

    act(() => {
      result.current.addSubtask(todoId, "작업 A");
      result.current.addSubtask(todoId, "작업 B");
      result.current.addSubtask(todoId, "작업 C");
    });

    const [a, b, c] = result.current.todos[0].subtasks.map((s) => s.id);

    act(() => {
      result.current.reorderSubtasks(todoId, [c, a, b]);
    });

    const reordered = result.current.todos[0].subtasks;
    expect(reordered[0].text).toBe("작업 C");
    expect(reordered[1].text).toBe("작업 A");
    expect(reordered[2].text).toBe("작업 B");
    expect(reordered[0].order).toBe(0);
    expect(reordered[1].order).toBe(1);
    expect(reordered[2].order).toBe(2);
  });
});
```

**Step 5: 테스트 실행 — 통과 확인**

Run: `bun run test -- --testPathPattern="use-todos" 2>&1 | tail -20`
Expected: 모든 테스트 PASS

**Step 6: 커밋**

```bash
git add hooks/use-todos.ts __tests__/use-todos.test.ts
git commit -m "feat: add subtask CRUD methods to useTodos hook"
```

---

### Task 4: SubtaskItem 컴포넌트 구현

**Files:**
- Create: `components/subtask-item.tsx`
- Modify: `__tests__/todo-app.test.tsx`

**Step 1: SubtaskItem 컴포넌트 구현**

```typescript
// components/subtask-item.tsx
"use client";

// 개별 서브태스크 항목 컴포넌트
import { Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SubTask } from "@/lib/types";

interface SubtaskItemProps {
  subtask: SubTask;
  onToggle: () => void;
  onDelete: () => void;
}

export function SubtaskItem({ subtask, onToggle, onDelete }: SubtaskItemProps) {
  return (
    <div className="group flex items-center gap-2 py-1 pl-8">
      <Checkbox
        checked={subtask.completed}
        onCheckedChange={onToggle}
        aria-label={`${subtask.text} 완료`}
      />
      <span
        className={cn(
          "flex-1 text-sm",
          subtask.completed && "text-muted-foreground line-through"
        )}
      >
        {subtask.text}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 opacity-0 group-hover:opacity-100"
        onClick={onDelete}
        aria-label={`${subtask.text} 삭제`}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
```

**Step 2: 빌드 확인**

Run: `bun run build 2>&1 | tail -10`
Expected: 빌드 성공

**Step 3: 커밋**

```bash
git add components/subtask-item.tsx
git commit -m "feat: add SubtaskItem component"
```

---

### Task 5: TodoItem에 서브태스크 펼침/접힘 UI 추가

**Files:**
- Modify: `components/todo-item.tsx`

**Step 1: TodoItem 확장**

TodoItem에 다음 기능 추가:
- 서브태스크가 있으면 펼침/접힘 버튼(▶/▼)과 진행률(2/5) 표시
- 펼치면 SubtaskItem 목록 + 서브태스크 추가 입력 필드 표시

```typescript
// components/todo-item.tsx
"use client";

// 개별 Todo 항목 컴포넌트 (서브태스크 포함)
import { useState, useRef, useEffect } from "react";
import { X, CalendarDays, ChevronRight, ChevronDown, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SubtaskItem } from "@/components/subtask-item";
import type { Todo } from "@/lib/types";

const priorityConfig = {
  high: { label: "높음", variant: "destructive" as const },
  medium: { label: "보통", variant: "default" as const },
  low: { label: "낮음", variant: "secondary" as const },
};

const categoryConfig = {
  업무: { label: "업무", className: "border-blue-300 text-blue-700 bg-blue-50" },
  개인: { label: "개인", className: "border-green-300 text-green-700 bg-green-50" },
  쇼핑: { label: "쇼핑", className: "border-purple-300 text-purple-700 bg-purple-50" },
};

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onAddSubtask: (todoId: string, text: string) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  onDeleteSubtask: (todoId: string, subtaskId: string) => void;
}

export function TodoItem({
  todo, onToggle, onDelete, onEdit,
  onAddSubtask, onToggleSubtask, onDeleteSubtask,
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [isExpanded, setIsExpanded] = useState(false);
  const [subtaskInput, setSubtaskInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  // ... (기존 편집 로직 유지)

  const hasSubtasks = todo.subtasks.length > 0;
  const completedCount = todo.subtasks.filter((s) => s.completed).length;
  const totalCount = todo.subtasks.length;

  function handleAddSubtask() {
    if (subtaskInput.trim()) {
      onAddSubtask(todo.id, subtaskInput);
      setSubtaskInput("");
      subtaskInputRef.current?.focus();
    }
  }

  function handleSubtaskKeyDown(e: React.KeyboardEvent) {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter") handleAddSubtask();
    if (e.key === "Escape") setSubtaskInput("");
  }

  // 렌더링: 기존 TodoItem + 펼침 시 서브태스크 목록
  // 펼침 버튼: hasSubtasks일 때 ChevronRight/ChevronDown 아이콘
  // 진행률: hasSubtasks일 때 "completedCount/totalCount" 텍스트
  // 서브태스크 목록: isExpanded일 때 SubtaskItem 리스트 + 추가 입력 필드
}
```

**Step 2: 테스트 실행 — 기존 테스트 통과 확인**

Run: `bun run test 2>&1 | tail -20`
Expected: 기존 테스트 PASS (새 props에 대한 기본값 처리 필요할 수 있음)

**Step 3: 커밋**

```bash
git add components/todo-item.tsx
git commit -m "feat: add subtask expand/collapse UI to TodoItem"
```

---

### Task 6: TodoApp에서 서브태스크 메서드 연결

**Files:**
- Modify: `components/todo-app.tsx`
- Modify: `__tests__/todo-app.test.tsx`

**Step 1: 실패하는 통합 테스트 작성**

`__tests__/todo-app.test.tsx`에 추가:

```typescript
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

    // 부모 Todo 체크
    const parentCheckbox = screen.getAllByRole("checkbox")[0];
    await user.click(parentCheckbox);

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
});
```

**Step 2: 테스트 실행 — 실패 확인**

Run: `bun run test -- --testNamePattern="서브태스크 통합" 2>&1 | tail -20`
Expected: FAIL

**Step 3: TodoApp에서 Hook 메서드 연결**

`components/todo-app.tsx`에서 useTodos의 새 메서드를 가져와 TodoItem에 전달:

```typescript
const {
  todos, isLoaded,
  addTodo, toggleTodo, deleteTodo, editTodo,
  addSubtask, toggleSubtask, deleteSubtask, reorderSubtasks,
} = useTodos();

// TodoItem 렌더링 부분
<TodoItem
  key={todo.id}
  todo={todo}
  onToggle={handleToggle}
  onDelete={deleteTodo}
  onEdit={editTodo}
  onAddSubtask={addSubtask}
  onToggleSubtask={toggleSubtask}
  onDeleteSubtask={deleteSubtask}
/>
```

**Step 4: 테스트 실행 — 통과 확인**

Run: `bun run test 2>&1 | tail -20`
Expected: 모든 테스트 PASS

**Step 5: 커밋**

```bash
git add components/todo-app.tsx __tests__/todo-app.test.tsx
git commit -m "feat: wire subtask methods in TodoApp"
```

---

### Task 7: @dnd-kit으로 서브태스크 드래그 순서 변경

**Files:**
- Modify: `components/todo-item.tsx`
- Modify: `components/subtask-item.tsx`
- Modify: `__tests__/todo-app.test.tsx`

**Step 1: 실패하는 테스트 작성**

```typescript
test("서브태스크를 드래그하여 순서를 변경할 수 있다", async () => {
  // localStorage에 서브태스크가 있는 Todo를 직접 세팅
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

  render(<TodoApp />);

  const expandButton = screen.getByRole("button", { name: /펼치기/ });
  await userEvent.click(expandButton);

  // 드래그 핸들이 각 서브태스크에 존재하는지 확인
  const dragHandles = screen.getAllByTestId("drag-handle");
  expect(dragHandles).toHaveLength(3);
});
```

**Step 2: 테스트 실행 — 실패 확인**

Run: `bun run test -- --testNamePattern="드래그" 2>&1 | tail -20`
Expected: FAIL

**Step 3: SubtaskItem에 드래그 핸들 추가**

`components/subtask-item.tsx`에 `@dnd-kit/sortable` 적용:

```typescript
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

export function SubtaskItem({ subtask, onToggle, onDelete }: SubtaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: subtask.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="group flex items-center gap-2 py-1 pl-8">
      <button
        className="cursor-grab touch-none"
        data-testid="drag-handle"
        aria-label="드래그"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </button>
      {/* ... 나머지 동일 */}
    </div>
  );
}
```

**Step 4: TodoItem의 서브태스크 목록을 DndContext로 감싸기**

`components/todo-item.tsx`의 서브태스크 렌더링 부분:

```typescript
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

// TodoItem 내부, 펼침 영역에서:
const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);

function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const sortedSubtasks = [...todo.subtasks].sort((a, b) => a.order - b.order);
  const oldIndex = sortedSubtasks.findIndex((s) => s.id === active.id);
  const newIndex = sortedSubtasks.findIndex((s) => s.id === over.id);

  const newOrder = [...sortedSubtasks];
  const [moved] = newOrder.splice(oldIndex, 1);
  newOrder.splice(newIndex, 0, moved);

  onReorderSubtasks(todo.id, newOrder.map((s) => s.id));
}

// JSX:
<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext
    items={todo.subtasks.sort((a, b) => a.order - b.order).map((s) => s.id)}
    strategy={verticalListSortingStrategy}
  >
    {todo.subtasks
      .sort((a, b) => a.order - b.order)
      .map((subtask) => (
        <SubtaskItem
          key={subtask.id}
          subtask={subtask}
          onToggle={() => onToggleSubtask(todo.id, subtask.id)}
          onDelete={() => onDeleteSubtask(todo.id, subtask.id)}
        />
      ))}
  </SortableContext>
</DndContext>
```

TodoItemProps에 `onReorderSubtasks` 추가:

```typescript
interface TodoItemProps {
  // ... 기존
  onReorderSubtasks: (todoId: string, subtaskIds: string[]) => void;
}
```

**Step 5: TodoApp에서 reorderSubtasks 연결**

```typescript
<TodoItem
  // ... 기존
  onReorderSubtasks={reorderSubtasks}
/>
```

**Step 6: 테스트 실행 — 통과 확인**

Run: `bun run test 2>&1 | tail -20`
Expected: 모든 테스트 PASS

**Step 7: 빌드 확인**

Run: `bun run build 2>&1 | tail -10`
Expected: 빌드 성공

**Step 8: 커밋**

```bash
git add components/subtask-item.tsx components/todo-item.tsx components/todo-app.tsx __tests__/todo-app.test.tsx
git commit -m "feat: add drag-and-drop reordering for subtasks"
```

---

### Task 8: 최종 검증 및 기존 테스트 호환성 확인

**Files:**
- Modify: `__tests__/todo-app.test.tsx` (필요 시)

**Step 1: 전체 테스트 실행**

Run: `bun run test 2>&1`
Expected: 모든 테스트 PASS

**Step 2: 린트 실행**

Run: `bun run lint 2>&1`
Expected: 에러 없음

**Step 3: 빌드 실행**

Run: `bun run build 2>&1`
Expected: 빌드 성공

**Step 4: 기존 테스트 중 실패하는 것이 있으면 수정**

기존 TodoItem 테스트가 새로 추가된 props 때문에 실패할 수 있음. `onAddSubtask`, `onToggleSubtask`, `onDeleteSubtask`, `onReorderSubtasks`에 빈 함수 기본값을 전달하도록 수정.

**Step 5: 커밋**

```bash
git add -A
git commit -m "test: fix existing tests for subtask compatibility"
```

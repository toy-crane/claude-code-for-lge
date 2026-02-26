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
    });
    act(() => {
      result.current.addSubtask(todoId, "작업 2");
    });
    act(() => {
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
    });
    act(() => {
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
    });
    act(() => {
      result.current.addSubtask(todoId, "작업 B");
    });
    act(() => {
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

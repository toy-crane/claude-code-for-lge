"use client";

import { useSyncExternalStore, useCallback } from "react";
import type { Todo, SubTask, Priority, Category } from "@/lib/types";

interface AddTodoOptions {
  text: string;
  priority?: Priority;
  dueDate?: string;
  category?: Category;
}

const STORAGE_KEY = "todos";
const emptyTodos: Todo[] = [];

let cachedRaw: string | null | undefined;
let cachedTodos: Todo[] = emptyTodos;

function getSnapshot(): Todo[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedTodos = raw ? JSON.parse(raw) : emptyTodos;
  }
  return cachedTodos;
}

function getServerSnapshot(): Todo[] {
  return emptyTodos;
}

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function writeTodos(todos: Todo[]) {
  const raw = JSON.stringify(todos);
  localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedTodos = todos;
  emitChange();
}

export function useTodos() {
  const todos = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addTodo = useCallback(({ text, priority = "medium", dueDate, category }: AddTodoOptions) => {
    const trimmed = text.trim();
    if (!trimmed) return;
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
    writeTodos([newTodo, ...getSnapshot()]);
  }, []);

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

  const deleteTodo = useCallback((id: string) => {
    writeTodos(getSnapshot().filter((todo) => todo.id !== id));
  }, []);

  const editTodo = useCallback((id: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    writeTodos(
      getSnapshot().map((todo) =>
        todo.id === id ? { ...todo, text: trimmed } : todo
      )
    );
  }, []);

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

  return {
    todos, isLoaded: true,
    addTodo, toggleTodo, deleteTodo, editTodo,
    addSubtask, toggleSubtask, deleteSubtask, reorderSubtasks,
  };
}

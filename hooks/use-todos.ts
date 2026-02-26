"use client";

import { useSyncExternalStore, useCallback } from "react";
import type { Todo, Priority, Category } from "@/lib/types";

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
      getSnapshot().map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
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

  return { todos, isLoaded: true, addTodo, toggleTodo, deleteTodo, editTodo };
}

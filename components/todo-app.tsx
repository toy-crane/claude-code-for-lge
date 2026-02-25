"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTodos } from "@/hooks/use-todos";
import { TodoItem } from "@/components/todo-item";
import type { Priority, FilterType } from "@/lib/types";

export function TodoApp() {
  const { todos, isLoaded, addTodo, toggleTodo, deleteTodo, editTodo } =
    useTodos();
  const [input, setInput] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [filter, setFilter] = useState<FilterType>("all");

  function handleToggle(id: string) {
    toggleTodo(id);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter") {
      addTodo(input, priority);
      setInput("");
      setPriority("medium");
    }
  }

  const filteredTodos =
    filter === "all"
      ? todos
      : filter === "active"
        ? todos.filter((t) => !t.completed)
        : todos.filter((t) => t.completed);

  if (!isLoaded) {
    return null;
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Todo 앱</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Input
            placeholder="할 일을 입력하세요"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
            <SelectTrigger className="w-28" aria-label="우선순위">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">높음</SelectItem>
              <SelectItem value="medium">보통</SelectItem>
              <SelectItem value="low">낮음</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          {([["all", "전체"], ["active", "진행중"], ["completed", "완료"]] as const).map(
            ([value, label]) => (
              <Button
                key={value}
                variant={filter === value ? "default" : "outline"}
                size="sm"
                data-active={filter === value ? "true" : undefined}
                onClick={() => setFilter(value)}
              >
                {label}
              </Button>
            )
          )}
        </div>
        <div className="flex flex-col divide-y">
          {filteredTodos.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground">
              할 일이 없습니다
            </p>
          ) : (
            filteredTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggle}
                onDelete={deleteTodo}
                onEdit={editTodo}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

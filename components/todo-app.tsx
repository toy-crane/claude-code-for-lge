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
import { useTodos } from "@/hooks/use-todos";
import { TodoItem } from "@/components/todo-item";
import type { Priority } from "@/lib/types";

export function TodoApp() {
  const { todos, isLoaded, addTodo, toggleTodo, deleteTodo, editTodo } =
    useTodos();
  const [input, setInput] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");

  function handleToggle(id: string) {
    const todo = todos.find((t) => t.id === id);
    toggleTodo(id);
    if (todo && !todo.completed) {
      setTimeout(() => deleteTodo(id), 500);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter") {
      addTodo(input, priority);
      setInput("");
      setPriority("medium");
    }
  }

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
        <div className="flex flex-col divide-y">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={handleToggle}
              onDelete={deleteTodo}
              onEdit={editTodo}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

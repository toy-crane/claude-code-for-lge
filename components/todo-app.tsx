"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTodos } from "@/hooks/use-todos";
import { TodoItem } from "@/components/todo-item";

export function TodoApp() {
  const { todos, isLoaded, addTodo, toggleTodo, deleteTodo, editTodo } =
    useTodos();
  const [input, setInput] = useState("");

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
      addTodo(input);
      setInput("");
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
        <Input
          placeholder="할 일을 입력하세요"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
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

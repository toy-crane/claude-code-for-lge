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
import type { Priority, FilterType, SortType, Category, CategoryFilter } from "@/lib/types";

export function TodoApp() {
  const {
    todos, isLoaded,
    addTodo, toggleTodo, deleteTodo, editTodo,
    addSubtask, toggleSubtask, deleteSubtask, reorderSubtasks,
  } = useTodos();
  const [input, setInput] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [filter, setFilter] = useState<FilterType>("all");
  const [dueDate, setDueDate] = useState("");
  const [sort, setSort] = useState<SortType>("createdAt");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  function handleToggle(id: string) {
    toggleTodo(id);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter") {
      addTodo({
        text: input,
        priority,
        dueDate: dueDate || undefined,
        category: category || undefined,
      });
      setInput("");
      setPriority("medium");
      setDueDate("");
      setCategory("");
    }
  }

  const filteredTodos = (() => {
    let result =
      filter === "all"
        ? todos
        : filter === "active"
          ? todos.filter((t) => !t.completed)
          : todos.filter((t) => t.completed);

    if (categoryFilter !== "all") {
      result = result.filter((t) => t.category === categoryFilter);
    }

    if (search) {
      const query = search.toLowerCase();
      result = result.filter((t) => t.text.toLowerCase().includes(query));
    }

    result = [...result].sort((a, b) => {
      if (sort === "name") return a.text.localeCompare(b.text, "ko");
      if (sort === "dueDate") {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      return b.createdAt - a.createdAt;
    });

    return result;
  })();

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
          <Input
            type="date"
            aria-label="마감일"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-40"
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
          <Select value={category || "none"} onValueChange={(v) => setCategory(v === "none" ? "" : v as Category)}>
            <SelectTrigger className="w-24" aria-label="카테고리">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">없음</SelectItem>
              <SelectItem value="업무">업무</SelectItem>
              <SelectItem value="개인">개인</SelectItem>
              <SelectItem value="쇼핑">쇼핑</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2" role="group" aria-label="상태 필터">
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
        <div className="flex gap-2" role="group" aria-label="카테고리 필터">
          {([["all", "전체"], ["업무", "업무"], ["개인", "개인"], ["쇼핑", "쇼핑"]] as const).map(
            ([value, label]) => (
              <Button
                key={value}
                variant={categoryFilter === value ? "default" : "outline"}
                size="sm"
                data-active={categoryFilter === value ? "true" : undefined}
                onClick={() => setCategoryFilter(value as CategoryFilter)}
              >
                {label}
              </Button>
            )
          )}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="검색어를 입력하세요"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={sort} onValueChange={(v) => setSort(v as SortType)}>
            <SelectTrigger className="w-32" aria-label="정렬">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">생성일순</SelectItem>
              <SelectItem value="name">이름순</SelectItem>
              <SelectItem value="dueDate">마감일순</SelectItem>
            </SelectContent>
          </Select>
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
                onAddSubtask={addSubtask}
                onToggleSubtask={toggleSubtask}
                onDeleteSubtask={deleteSubtask}
                onReorderSubtasks={reorderSubtasks}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

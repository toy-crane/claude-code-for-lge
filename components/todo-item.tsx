"use client";

// 개별 Todo 항목 컴포넌트 (서브태스크 포함)
import { useState, useRef, useEffect } from "react";
import { X, CalendarDays, ChevronRight, ChevronDown, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  onReorderSubtasks: (todoId: string, subtaskIds: string[]) => void;
}

export function TodoItem({
  todo, onToggle, onDelete, onEdit,
  onAddSubtask, onToggleSubtask, onDeleteSubtask, onReorderSubtasks,
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [isExpanded, setIsExpanded] = useState(false);
  const [subtaskInput, setSubtaskInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  function handleSave() {
    const trimmed = editText.trim();
    if (trimmed) {
      onEdit(todo.id, trimmed);
    } else {
      setEditText(todo.text);
    }
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditText(todo.text);
      setIsEditing(false);
    }
  }

  // 서브태스크 추가 핸들러
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

  // 드래그 앤 드롭 센서
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sorted = [...subtasks].sort((a, b) => a.order - b.order);
    const oldIndex = sorted.findIndex((s) => s.id === active.id);
    const newIndex = sorted.findIndex((s) => s.id === over.id);

    const newOrder = [...sorted];
    const [moved] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, moved);

    onReorderSubtasks(todo.id, newOrder.map((s) => s.id));
  }

  const config = priorityConfig[todo.priority ?? "medium"];
  const subtasks = todo.subtasks ?? [];
  const hasSubtasks = subtasks.length > 0;
  const completedCount = subtasks.filter((s) => s.completed).length;
  const totalCount = subtasks.length;

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Input
          ref={inputRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="h-8"
        />
      </div>
    );
  }

  return (
    <div>
      {/* 메인 Todo 행 */}
      <div className="group flex items-center gap-3 px-3 py-2">
        {/* 펼침/접힘 버튼 */}
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 shrink-0"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "접기" : "펼치기"}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </Button>
        <Checkbox
          checked={todo.completed}
          onCheckedChange={() => onToggle(todo.id)}
        />
        <Badge variant={config.variant} className="shrink-0">
          {config.label}
        </Badge>
        {todo.category && (
          <Badge variant="outline" className={cn("shrink-0", categoryConfig[todo.category].className)}>
            {categoryConfig[todo.category].label}
          </Badge>
        )}
        <span
          className={cn(
            "flex-1 cursor-default select-none",
            todo.completed && "text-muted-foreground line-through"
          )}
          onDoubleClick={() => setIsEditing(true)}
        >
          {todo.text}
        </span>
        {/* 진행률 표시 */}
        {hasSubtasks && (
          <span className="text-xs text-muted-foreground shrink-0">
            {completedCount}/{totalCount}
          </span>
        )}
        {todo.dueDate && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <CalendarDays className="h-3 w-3" />
            {todo.dueDate}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100"
          onClick={() => onDelete(todo.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* 서브태스크 영역 (펼침 시) */}
      {isExpanded && (
        <div className="ml-4 border-l-2 border-muted">
          {/* 서브태스크 목록 (드래그 앤 드롭) */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={[...subtasks].sort((a, b) => a.order - b.order).map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {[...subtasks]
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

          {/* 서브태스크 추가 입력 */}
          <div className="flex items-center gap-2 py-1 pl-8">
            <Plus className="h-3 w-3 text-muted-foreground shrink-0" />
            <Input
              ref={subtaskInputRef}
              placeholder="서브태스크 입력"
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              onKeyDown={handleSubtaskKeyDown}
              className="h-7 text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs shrink-0"
              onClick={handleAddSubtask}
            >
              추가
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

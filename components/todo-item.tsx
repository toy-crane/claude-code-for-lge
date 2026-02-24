"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Todo } from "@/lib/types";

const priorityConfig = {
  high: { label: "높음", variant: "destructive" as const },
  medium: { label: "보통", variant: "default" as const },
  low: { label: "낮음", variant: "secondary" as const },
};

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
}

export function TodoItem({ todo, onToggle, onDelete, onEdit }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const config = priorityConfig[todo.priority ?? "medium"];

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
    <div className="group flex items-center gap-3 px-3 py-2">
      <Checkbox
        checked={todo.completed}
        onCheckedChange={() => onToggle(todo.id)}
      />
      <Badge variant={config.variant} className="shrink-0">
        {config.label}
      </Badge>
      <span
        className={cn(
          "flex-1 cursor-default select-none",
          todo.completed && "text-muted-foreground line-through"
        )}
        onDoubleClick={() => setIsEditing(true)}
      >
        {todo.text}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100"
        onClick={() => onDelete(todo.id)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

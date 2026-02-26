"use client";

// 개별 서브태스크 항목 컴포넌트 (드래그 앤 드롭 지원)
import { Trash2, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
        className="cursor-grab touch-none text-muted-foreground"
        data-testid="drag-handle"
        aria-label="드래그"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3 w-3" />
      </button>
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

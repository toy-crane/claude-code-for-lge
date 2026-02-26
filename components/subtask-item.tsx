"use client";

// 개별 서브태스크 항목 컴포넌트
import { Trash2 } from "lucide-react";
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
  return (
    <div className="group flex items-center gap-2 py-1 pl-8">
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

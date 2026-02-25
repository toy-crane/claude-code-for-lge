export type Priority = "high" | "medium" | "low";

export type FilterType = "all" | "active" | "completed";

export type SortType = "createdAt" | "name" | "dueDate";

export type Category = "업무" | "개인" | "쇼핑";

export type CategoryFilter = "all" | Category;

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  createdAt: number;
  dueDate?: string;
  category?: Category;
}

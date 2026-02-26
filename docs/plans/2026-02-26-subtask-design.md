# 서브태스크 기능 설계

## 개요
Todo 항목에 1단계 서브태스크를 추가하여 큰 작업을 세분화하고 진행률을 시각적으로 파악할 수 있게 한다.

## 핵심 결정

| 항목 | 결정 |
|------|------|
| 서브태스크 깊이 | 1단계만 |
| 데이터 구조 | Todo 내부 `subtasks: SubTask[]` 배열 |
| 부모 완료 시 | 미완료 서브태스크 자동 완료 |
| 부모 삭제 시 | 서브태스크 함께 삭제 |
| 진행률 표시 | "2/5" 형태로 부모 Todo에 표시 |
| 서브태스크 속성 | 제목 + 완료 상태만 (단순 task) |
| 최대 개수 | 무제한 |
| 드래그 순서 변경 | @dnd-kit 사용 |

## 데이터 구조

```typescript
type SubTask = {
  id: string;
  text: string;
  completed: boolean;
  order: number;
};

type Todo = {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  createdAt: number;
  dueDate?: string;
  category?: Category;
  subtasks: SubTask[];
};
```

## 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `lib/types.ts` | `SubTask` 타입 추가, `Todo`에 `subtasks` 필드 추가 |
| `hooks/use-todos.ts` | 서브태스크 CRUD 메서드 추가 + 부모 완료 시 자동 완료 |
| `components/todo-item.tsx` | 펼침/접힘 UI, 진행률, 서브태스크 목록 |
| `components/subtask-item.tsx` | 신규 — 개별 서브태스크 컴포넌트 |
| `components/todo-app.tsx` | 새 메서드 연결 |
| `__tests__/todo-app.test.tsx` | 서브태스크 테스트 추가 |
| `package.json` | @dnd-kit 패키지 추가 |

## 핵심 로직

- **진행률**: `subtasks.filter(s => s.completed).length / subtasks.length`
- **부모 완료**: `toggleTodo` 시 subtasks 전체 `completed: true`
- **캐스케이드 삭제**: Todo 객체 삭제 시 내부 subtasks도 자동 제거
- **순서 관리**: `@dnd-kit/sortable`로 드래그, `order` 필드 재계산

## 상세 스펙

`.claude/specs/subtask.md` 참조 (시나리오, 성공 기준, 화면 구성 포함)

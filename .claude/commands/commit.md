---
description: "Conventional Commit 형식으로 커밋"
allowed-tools: Bash(git diff:*), Bash(git add:*), Bash(git commit:*)
---

변경사항을 확인하고 Conventional Commit 형식으로 커밋해줘.

커밋 메시지 규칙:
- 형식: <type>(<scope>): <description>
- type: feat, fix, refactor, test, docs, chore
- scope: 변경된 주요 모듈/컴포넌트 이름
- description: 영어, 소문자, 현재형, 50자 이내

예시:
- feat(todo): add filter tabs for completion status
- fix(todo-item): resolve checkbox toggle not persisting

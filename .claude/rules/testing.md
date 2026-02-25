---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
---

# Testing Rules

## 환경

- Jest 30 + React Testing Library + user-event, jsdom 환경
- 설정: `jest.config.ts` (next/jest 기반), `jest.setup.ts`
- 실행: `bun run test` (`bun test` 사용 금지 — Bun 내장 러너와 충돌)

## 작성 원칙

- TDD: 테스트 먼저 작성 → 실패 확인 → 구현
- 실제 API 호출 금지, 반드시 mock 사용
- 각 테스트는 독립적으로 실행 가능해야 함
- 핵심 흐름은 실제 사용자 행동(클릭, 입력)으로 테스트 — 내부 상태 직접 세팅 지양
- 새 기능 추가 시 기존 기능과의 통합 테스트 최소 1개 작성

## 컨벤션

- 파일명: 대상 파일명 + `.test.ts(x)`
- 위치: `__tests__/` 또는 소스 파일 옆

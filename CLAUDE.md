# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소의 코드를 다룰 때 참고하는 가이드입니다.

## 프로젝트 개요

Next.js 16 + React 19 기반 앱. Tailwind CSS v4와 shadcn/ui(new-york 스타일)를 사용하며, App Router와 React Server Components가 기본 활성화되어 있습니다.

## 명령어

- `bun dev` — 개발 서버 실행 (localhost:3000)
- `bun run build` — 프로덕션 빌드
- `bun run lint` — ESLint 실행 (flat config, core-web-vitals + typescript 규칙)
- `bunx shadcn add <component>` — shadcn/ui 컴포넌트 추가
- `bun run test` — Jest 테스트 실행
- `bun run test:watch` — Jest watch 모드 실행

## 기술 스택 및 컨벤션

- **패키지 매니저**: bun (잠금 파일: `bun.lock`)
- **스타일링**: Tailwind CSS v4, CSS 변수 기반 테마 (`app/globals.css`에 정의), `tw-animate-css`로 애니메이션 처리
- **UI 컴포넌트**: shadcn/ui — 컴포넌트는 `@/components/ui`에 위치, `cn()` 유틸리티는 `@/lib/utils`에 정의
- **아이콘**: lucide-react
- **경로 별칭**: `@/*`는 프로젝트 루트에 매핑 (`tsconfig.json`에서 설정)
- **폰트**: Geist Sans, Geist Mono (`next/font/google` 사용)

## 아키텍처

- `app/` — Next.js App Router: `layout.tsx` (루트 레이아웃), `page.tsx` (홈 페이지), `globals.css` (테마 + Tailwind)
- `lib/utils.ts` — 공유 유틸리티 (`cn` 클래스 병합 함수)
- `components/` — shadcn/ui 컴포넌트 디렉토리 (`@/components`로 별칭)
- `public/` — 정적 에셋 (SVG 파일)

## 테스트

- **프레임워크**: Jest 30 + React Testing Library + user-event
- **환경**: jsdom (`jest-environment-jsdom`)
- **설정 파일**: `jest.config.ts` (next/jest 기반), `jest.setup.ts` (`@testing-library/jest-dom` 임포트)
- **테스트 위치**: `__tests__/` 디렉토리 또는 `*.test.(ts|tsx)`, `*.spec.(ts|tsx)` 파일
- **실행**: `bun run test` (주의: `bun test`는 Bun 내장 러너를 사용하므로 반드시 `bun run test`로 실행)

### 테스트 작성 원칙

- **핵심 흐름은 실제 사용자 행동으로 테스트**: 상태 전환이나 사이드이펙트가 있는 경로는 내부 상태를 직접 세팅하지 말고, 실제 사용자 행동(클릭, 입력 등)으로 테스트한다. 직접 세팅은 대량 데이터나 단순 렌더링 확인처럼 내부 로직을 거치지 않아도 되는 경우에만 사용한다.
- **새 기능 추가 시 기존 기능과의 통합 테스트 작성**: 새 기능이 기존 기능과 조합되어 동작하는 시나리오를 최소 하나 이상 작성한다.

## Development Workflow

- 코드를 구현할 때 항상 테스트를 먼저 작성한다
- 테스트가 실패하는 것을 확인한 뒤, 테스트를 통과하도록 구현한다

## Rules
- 커밋 메시지: Conventional Commits (feat:, fix:, refactor:)
- 모든 대화에서 한글만 사용
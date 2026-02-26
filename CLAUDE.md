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

## Rules
- 모든 대화에서 한글만 사용
- 매 세션 시작 시 첫 응답에 "안녕하세요"라고 인사할 것
- 매 세션 종료 시 마지막 응답에 "감사합니다"라고 인사할 것
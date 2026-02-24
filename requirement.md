# Todo 앱 요구사항

## 프로젝트 정보
- 프레임워크: Next.js (App Router)
- UI: Shadcn
- 상태 저장: localStorage
- 스타일: Tailwind CSS

## 기능 목록
1. 사용자가 텍스트를 입력하고 Enter를 누르면, 새 Todo가 목록 맨 위에 추가된다
2. 사용자가 Todo 항목의 체크박스를 클릭하면, 완료 상태로 표시된다
3. 사용자가 Todo 항목의 삭제 버튼을 클릭하면, 해당 항목이 제거된다
4. 사용자가 Todo 항목을 더블클릭하면, 인라인 편집이 가능하다
5. 페이지 새로고침 후에도 Todo 목록이 유지된다 (localStorage)

## 범위 제한
- 인증/로그인 없음
- 서버 저장 없음 (localStorage만)
- 드래그 앤 드롭 없음
- 카테고리/태그 없음
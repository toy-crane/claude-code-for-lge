# Claude Hooks 스크립트 검증 결과

## Context

사용자가 테스트 실행 시 출력을 필터링하는 PreToolUse 훅을 작성하려 합니다. 공식 문서(https://code.claude.com/docs/en/hooks)를 기반으로 스크립트의 정확성을 검증합니다.

## 발견된 문제점

### 1. `permissionDecision` 값 오류 (치명적)

```diff
- "permissionDecision": "approve",
+ "permissionDecision": "allow",
```

공식 문서에 따르면 유효한 값은 **`"allow"`, `"deny"`, `"ask"`** 3가지뿐입니다. `"approve"`는 존재하지 않는 값이므로 훅이 의도대로 동작하지 않습니다.

### 2. `bun run test` 미매칭 (기능 오류)

```diff
- if [[ ! "$command" =~ (bun\ test|bunx\ jest|bunx\ vitest|pytest) ]]; then
+ if [[ ! "$command" =~ (bun\ (run\ )?test|bunx\ jest|bunx\ vitest|pytest) ]]; then
```

`bun run test`는 `bun test`와 다른 문자열이므로 현재 정규식에 매칭되지 않습니다. `(run\ )?`를 추가하여 둘 다 매칭되도록 합니다.

### 3. JSON 내 변수 치환 시 이스케이프 문제 (잠재적 오류)

`$filtered_command`에 큰따옴표(`"`)나 백슬래시(`\`) 등 JSON 특수문자가 포함될 경우 JSON이 깨질 수 있습니다. `jq`를 사용한 안전한 JSON 생성을 권장합니다.

## 정상 동작하는 부분

| 항목 | 상태 | 설명 |
|------|------|------|
| stdin 입력 읽기 (`cat`) | OK | 공식 문서와 일치 |
| `tool_input.command` 경로 | OK | Bash 도구의 입력 스키마와 일치 |
| `hookSpecificOutput` 최상위 구조 | OK | 공식 권장 구조 사용 |
| `hookEventName: "PreToolUse"` | OK | 이벤트명 정확 |
| `updatedInput.command` | OK | Bash 도구 입력 수정 가능 |
| exit 0 (테스트 아닌 경우 통과) | OK | exit 0 = 성공, JSON 없으면 기본 동작 |
| 파일 위치 `.claude/hooks/` | OK | 관례에 맞음 |

## 수정된 스크립트

```bash
#!/bin/bash

# stdin으로 Claude가 실행하려는 도구 정보를 JSON으로 받음
input=$(cat)

# 실행하려는 명령어 추출
command=$(echo "$input" | jq -r '.tool_input.command // empty')

# 테스트 명령이 아니면 그대로 통과
if [[ ! "$command" =~ (bun\ (run\ )?test|bunx\ jest|bunx\ vitest|pytest) ]]; then
  exit 0
fi

# 테스트 명령에 필터링 파이프 추가
filtered_command="$command 2>&1 | grep -E -A 10 '(FAIL|ERROR|WARN|Tests:|Test Suites:|✕|✗|FAILED|assert)' || true"

# jq를 사용하여 안전한 JSON 생성
jq -n \
  --arg cmd "$filtered_command" \
  '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "allow",
      updatedInput: {
        command: $cmd
      }
    }
  }'
```

## settings.json 등록 방법

`.claude/settings.json` 또는 `.claude/settings.local.json`에 다음을 추가:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/filter-test-output.sh",
            "timeout": 600,
            "statusMessage": "테스트 출력 필터링 중..."
          }
        ]
      }
    ]
  }
}
```

## 검증 방법

1. 스크립트 작성 후 `chmod +x .claude/hooks/filter-test-output.sh`
2. settings.json에 hooks 등록
3. Claude Code에서 `bun run test` 실행을 요청하여 필터링이 적용되는지 확인
4. 테스트 아닌 일반 Bash 명령이 영향받지 않는지 확인

## 미해결 질문

- 없음 (공식 문서 기반으로 모든 항목 검증 완료)

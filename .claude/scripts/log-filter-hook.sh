#!/usr/bin/env bash
# log-filter-hook.sh (PreToolUse 훅)
# 테스트/빌드 Bash 명령을 감지해 filter-failures.sh로 래핑한다.

input=$(cat)
cmd=$(echo "$input" | jq -r '.tool_input.command // ""')

FILTER_SCRIPT="/Users/gim-yechan/Desktop/projects/for_youth/.claude/scripts/filter-failures.sh"

# 테스트/빌드 명령 패턴 감지 (이미 래핑된 경우 제외)
if echo "$cmd" | grep -qE '(jest|npm[[:space:]]+(run[[:space:]]+)?(test|build|lint)|npx[[:space:]]+(jest|eslint|tsc)|playwright|vitest)' && \
   ! echo "$cmd" | grep -q 'filter-failures'; then

  # 명령을 임시 파일에 기록 (복잡한 quoting 문제 우회)
  tmp=$(mktemp /tmp/claude-cmd-XXXXXX.sh)
  printf '%s' "$cmd" > "$tmp"

  wrapped="bash \"$FILTER_SCRIPT\" \"$tmp\""

  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","updatedInput":{"command":%s}}}' \
    "$(printf '%s' "$wrapped" | jq -Rs '.')"
fi

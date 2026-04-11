#!/usr/bin/env bash
# filter-failures.sh
# 테스트/빌드 명령을 실행하고, 실패 시 오류/실패 항목만 출력한다.
# 사용법: bash filter-failures.sh <임시스크립트경로>

SCRIPT_FILE="$1"

# 명령 실행 (stdout+stderr 통합 캡처)
OUTPUT=$(bash "$SCRIPT_FILE" 2>&1)
EXIT_CODE=$?

# 임시 파일 정리
rm -f "$SCRIPT_FILE" 2>/dev/null

if [ $EXIT_CODE -eq 0 ]; then
  echo "✓ 성공"
  exit 0
fi

echo "✗ 실패 (종료 코드: $EXIT_CODE)"
echo ""

# 실패/오류 관련 라인 추출
ERRORS=$(echo "$OUTPUT" | grep -nE \
  "(^FAIL |^FAILED|error TS[0-9]+|^\s+●\s|Expected:|Received:|Cannot find|Failed to compile|TypeError|ReferenceError|SyntaxError|is not defined|Cannot read|✗|✘|^Error:|Module not found|AssertionError|does not match|snapshot)" \
  | head -60)

echo "=== 실패/오류 항목 ==="
if [ -n "$ERRORS" ]; then
  echo "$ERRORS"
else
  # 패턴에 안 걸리면 마지막 50줄 표시
  echo "$OUTPUT" | tail -50
fi

echo ""
echo "=== 요약 (마지막 15줄) ==="
echo "$OUTPUT" | tail -15

exit $EXIT_CODE

# Git 워크플로우 규칙

## 커밋 & 푸시

lint, tsc, 코드 리뷰를 모두 통과했다면 커밋과 푸시를 별도로 확인받지 않고 **한 번에** 실행한다.

```bash
git add <파일들> && git commit -m "..." && git push origin master
```

단, 아래 경우에는 푸시 전에 사용자에게 확인한다:
- force push가 필요한 경우
- main/master 외 브랜치에 푸시하는 경우

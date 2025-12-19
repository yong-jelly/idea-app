원격(origin)에 있는 **가장 최신 상태**로 맞추려는 거라면(로컬 변경은 버리거나/살리거나에 따라) 아래 중 하나를 고르면 됩니다.

### 1) 로컬 커밋/변경사항이 없어야 하는 경우: 원격을 그대로 강제 반영(가장 깔끔)
로컬 브랜치를 원격 브랜치의 “마지막 커밋”으로 완전히 맞춥니다.

```bash
git fetch origin
git reset --hard origin/$(git rev-parse --abbrev-ref HEAD)
```

추적되지 않는 파일/디렉터리까지 싹 지우고 완전 동일하게 만들고 싶으면(주의):

```bash
git clean -fd
```

### 2) 로컬 커밋은 살리고, 원격 최신 위에 내 커밋을 얹고 싶은 경우: rebase
원격 최신을 기준으로 내 로컬 커밋을 다시 쌓습니다.

```bash
git pull --rebase
```

### 3) 로컬에서 작업한 내용(스테이징 전/후 포함)이 있는데 버리긴 싫은 경우: stash 후 최신으로
```bash
git stash -u
git pull --rebase
git stash pop
```

### 앞으로 이 경고 안 뜨게 기본값 설정
대부분 “최신을 깔끔하게 따라가겠다”면 rebase 기본값을 많이 씁니다.

```bash
git config --global pull.rebase true
```
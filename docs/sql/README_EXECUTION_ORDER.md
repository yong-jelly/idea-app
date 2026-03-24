# SQL 파일 실행 순서

## 전체 실행 순서 (초기 설정 시)

### 1단계: 기본 테이블 생성
```
005_v1_update_user_profile.sql
006_storage_bucket_setup.sql
007_create_projects_table.sql
012_create_posts_table.sql
013_create_comments_table.sql
014_create_interactions_tables.sql
```

### 2단계: 함수 및 정책 설정
```
008_v1_create_project.sql
009_fix_projects_rls_policy.sql
010_v1_fetch_projects.sql
011_v1_fetch_project_detail.sql
015_v1_create_post.sql
016_v1_fetch_feed.sql
017_v1_post_interactions.sql
```

### 3단계: 댓글 시스템 확장
```
019_update_comments_for_projects.sql  (댓글 테이블 수정: 프로젝트 댓글 지원)
022_remove_comments_foreign_key.sql   (외래키 제약조건 제거 - 프로젝트 댓글 지원)
018_v1_comment_functions.sql          (댓글 함수들 - 기존 버전)
```

### 4단계: 댓글 출처 구분 시스템 추가 (신규)
```
020_create_codes_table.sql            (코드 테이블 생성)
021_add_comment_source_type.sql       (댓글 테이블에 source_type_code 추가)
018_v1_comment_functions.sql         (댓글 함수 업데이트 - source_type_code 지원)
```

---

## 댓글 출처 구분 시스템만 추가하는 경우

기존 시스템이 이미 구축되어 있다면, 다음 순서로 실행:

```bash
# 0. 외래키 제약조건 제거 (프로젝트 댓글 지원을 위해 필요)
psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/022_remove_comments_foreign_key.sql

# 1. 코드 테이블 생성
psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/020_create_codes_table.sql

# 2. 댓글 테이블에 source_type_code 컬럼 추가
psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/021_add_comment_source_type.sql

# 3. 댓글 함수 업데이트 (source_type_code 자동 추론 로직 추가)
psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/018_v1_comment_functions.sql
```

---

## 블로그 (Markdown 게시글)

`tbl_users` 이후에 실행합니다.

**신규 설치(처음부터 적용)** — `070`에 `link_url` 컬럼이 포함되어 있습니다.

```
070_create_blog_tables.sql
071_v1_blog_functions.sql
```

**이미 `070`·`071`만 적용한 기존 DB** — 게시글에 외부 링크(`link_url`)와 `v1_upsert_blog_post` 7번째 인자를 쓰려면 아래 순서로 보강합니다.

1. `072_add_blog_posts_link_url.sql` — `odd.blog_posts.link_url` 컬럼 추가  
2. `071_v1_blog_functions.sql` — 목록/상세 JSON에 `link_url` 포함, `v1_upsert_blog_post`에 `p_link_url` 반영 (컬럼이 있어야 RPC가 정상 동작)

> `071`만 다시 실행하면 `link_url` 컬럼이 없으면 RPC 실행 시 오류가 날 수 있으므로, **반드시 `072`를 먼저** 적용합니다.

## 의존성 관계

```
tbl_users, tbl_posts
    ↓
013_create_comments_table.sql (댓글 테이블 생성)
    ↓
019_update_comments_for_projects.sql (프로젝트 댓글 지원)
022_remove_comments_foreign_key.sql (외래키 제약조건 제거)
    ↓
020_create_codes_table.sql (코드 테이블 생성 - 독립적)
    ↓
021_add_comment_source_type.sql (source_type_code 컬럼 추가 - tbl_codes 참조)
    ↓
018_v1_comment_functions.sql (댓글 함수 - source_type_code 사용)
```

---

## 주의사항

1. **018_v1_comment_functions.sql**은 기존에 실행했다면 다시 실행해야 합니다 (업데이트된 버전)
2. **021_add_comment_source_type.sql**은 기존 댓글 데이터에 `source_type_code`가 NULL로 설정됩니다
3. 새로운 댓글 생성 시 함수가 자동으로 `source_type_code`를 추론하므로 기존 데이터 마이그레이션은 선택사항입니다


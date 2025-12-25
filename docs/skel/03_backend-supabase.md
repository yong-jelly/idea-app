# 백엔드 구조 가이드 (Supabase)

이 문서는 Supabase를 사용한 백엔드 구조 및 설정 가이드를 제공합니다.

## 📋 목차

1. [Supabase 프로젝트 생성](#1-supabase-프로젝트-생성)
2. [데이터베이스 스키마 설계](#2-데이터베이스-스키마-설계)
3. [인증 설정](#3-인증-설정)
4. [Storage 설정](#4-storage-설정)
5. [Row Level Security (RLS)](#5-row-level-security-rls)
6. [RPC 함수 작성](#6-rpc-함수-작성)
7. [트리거 및 함수](#7-트리거-및-함수)

## 1. Supabase 프로젝트 생성

### 1.1 프로젝트 생성

1. [Supabase Dashboard](https://app.supabase.com)에 접속
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: 프로젝트 이름
   - **Database Password**: 강력한 비밀번호 설정
   - **Region**: 가장 가까운 리전 선택 (예: `ap-northeast-2`)

### 1.2 환경 변수 설정

프로젝트 설정에서 다음 정보를 확인하고 `.env` 파일에 추가:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 2. 데이터베이스 스키마 설계

### 2.1 스키마 생성

모든 테이블은 `odd` 스키마에 생성합니다.

```sql
-- 스키마 생성
CREATE SCHEMA IF NOT EXISTS odd;

-- 스키마 권한 부여
GRANT ALL ON SCHEMA odd TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA odd TO authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA odd TO authenticated, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA odd GRANT ALL ON TABLES TO authenticated, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA odd GRANT ALL ON SEQUENCES TO authenticated, anon;
```

### 2.2 테이블 명명 규칙

- 모든 테이블은 `tbl_` 접두사를 사용합니다
- 예: `odd.tbl_users`, `odd.tbl_projects`, `odd.tbl_posts`

### 2.3 기본 테이블 구조 예시

#### 사용자 테이블

```sql
CREATE TABLE odd.tbl_users (
  id BIGSERIAL PRIMARY KEY,
  auth_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE,
  display_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  github VARCHAR(100),
  twitter VARCHAR(100),
  points INTEGER DEFAULT 0,
  level VARCHAR(20) DEFAULT 'bronze',
  subscribed_projects_count INTEGER DEFAULT 0,
  supported_projects_count INTEGER DEFAULT 0,
  projects_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_users_auth_id ON odd.tbl_users(auth_id);
CREATE INDEX idx_users_username ON odd.tbl_users(username);
```

#### 프로젝트 테이블

```sql
CREATE TABLE odd.tbl_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id BIGINT NOT NULL REFERENCES odd.tbl_users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  short_description TEXT NOT NULL,
  full_description TEXT,
  category VARCHAR(50),
  category_id VARCHAR(50),
  tech_stack TEXT[],
  thumbnail TEXT,
  gallery_images TEXT[],
  repository_url TEXT,
  demo_url TEXT,
  current_funding INTEGER DEFAULT 0,
  target_funding INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  featured BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_projects_author_id ON odd.tbl_projects(author_id);
CREATE INDEX idx_projects_category ON odd.tbl_projects(category);
CREATE INDEX idx_projects_status ON odd.tbl_projects(status);
CREATE INDEX idx_projects_deleted_at ON odd.tbl_projects(deleted_at) WHERE deleted_at IS NULL;
```

### 2.4 SQL 파일 관리

모든 SQL 변경사항은 `docs/sql/` 디렉토리에 순차적으로 저장합니다.

**파일 명명 규칙**:
- `001_*.sql` - 초기 스키마 생성
- `002_*.sql` - 테이블 생성
- `003_*.sql` - 인덱스 생성
- `010_v1_*.sql` - RPC 함수 (v1 버전)
- `020_*.sql` - 트리거 및 함수

**예시**:
```
docs/sql/
├── 001_create_schema.sql
├── 002_create_users_table.sql
├── 003_create_projects_table.sql
├── 010_v1_create_user.sql
└── 020_trigger_update_updated_at.sql
```

## 3. 인증 설정

### 3.1 Supabase Auth 설정

1. **Authentication** → **Providers**에서 원하는 인증 방법 활성화
2. **Google OAuth** 설정:
   - Google Cloud Console에서 OAuth 2.0 클라이언트 ID 생성
   - Redirect URI: `https://your-project.supabase.co/auth/v1/callback`
   - Client ID와 Secret을 Supabase에 등록

### 3.2 인증 콜백 URL 설정

**Site URL**: `http://localhost:5177` (개발 환경)
**Redirect URLs**: 
- `http://localhost:5177/auth/callback`
- `https://your-domain.vercel.app/auth/callback`

### 3.3 클라이언트 설정

```typescript
// src/shared/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});
```

## 4. Storage 설정

### 4.1 Storage 버킷 생성

```sql
-- Storage 버킷 생성 (Supabase Dashboard에서도 가능)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true),
       ('project-images', 'project-images', true),
       ('post-images', 'post-images', true);
```

### 4.2 Storage 정책 설정

```sql
-- 아바타 업로드 정책
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 아바타 읽기 정책
CREATE POLICY "Avatars are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

## 5. Row Level Security (RLS)

### 5.1 RLS 활성화

모든 테이블에 RLS를 활성화합니다:

```sql
ALTER TABLE odd.tbl_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE odd.tbl_projects ENABLE ROW LEVEL SECURITY;
```

### 5.2 정책 예시

#### 사용자 테이블 정책

```sql
-- 모든 사용자 읽기 가능
CREATE POLICY "Users are viewable by everyone"
ON odd.tbl_users FOR SELECT
TO public
USING (true);

-- 인증된 사용자만 자신의 정보 수정 가능
CREATE POLICY "Users can update own profile"
ON odd.tbl_users FOR UPDATE
TO authenticated
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());
```

#### 프로젝트 테이블 정책

```sql
-- 모든 프로젝트 읽기 가능 (삭제되지 않은 것만)
CREATE POLICY "Projects are viewable by everyone"
ON odd.tbl_projects FOR SELECT
TO public
USING (deleted_at IS NULL);

-- 인증된 사용자만 프로젝트 생성 가능
CREATE POLICY "Authenticated users can create projects"
ON odd.tbl_projects FOR INSERT
TO authenticated
WITH CHECK (author_id IN (
  SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
));

-- 작성자만 프로젝트 수정/삭제 가능
CREATE POLICY "Authors can update own projects"
ON odd.tbl_projects FOR UPDATE
TO authenticated
USING (
  author_id IN (
    SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
  ) AND deleted_at IS NULL
)
WITH CHECK (
  author_id IN (
    SELECT id FROM odd.tbl_users WHERE auth_id = auth.uid()
  )
);
```

## 6. RPC 함수 작성

### 6.1 함수 명명 규칙

- 버전 관리: `v1_*`, `v2_*` 등
- 기능 설명: `v1_create_user`, `v1_fetch_projects`
- 예: `v1_upsert_user`, `v1_fetch_unified_feed`

### 6.2 함수 작성 예시

#### 사용자 생성/업데이트 함수

```sql
CREATE OR REPLACE FUNCTION odd.v1_upsert_user(
  p_auth_id UUID,
  p_email TEXT,
  p_display_name TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS odd.tbl_users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user odd.tbl_users;
BEGIN
  INSERT INTO odd.tbl_users (auth_id, display_name, avatar_url)
  VALUES (p_auth_id, p_display_name, p_avatar_url)
  ON CONFLICT (auth_id) 
  DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, odd.tbl_users.display_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, odd.tbl_users.avatar_url),
    updated_at = NOW()
  RETURNING * INTO v_user;
  
  RETURN v_user;
END;
$$;
```

#### 프로젝트 목록 조회 함수

```sql
CREATE OR REPLACE FUNCTION odd.v1_fetch_projects(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_category VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  short_description TEXT,
  author JSONB,
  thumbnail TEXT,
  likes_count BIGINT,
  comments_count BIGINT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.short_description,
    jsonb_build_object(
      'id', u.id,
      'username', u.username,
      'displayName', u.display_name,
      'avatar', u.avatar_url
    ) AS author,
    p.thumbnail,
    COUNT(DISTINCT pl.id)::BIGINT AS likes_count,
    COUNT(DISTINCT c.id)::BIGINT AS comments_count,
    p.created_at
  FROM odd.tbl_projects p
  INNER JOIN odd.tbl_users u ON p.author_id = u.id
  LEFT JOIN odd.tbl_project_likes pl ON p.id = pl.project_id
  LEFT JOIN odd.tbl_comments c ON c.source_id = p.id::TEXT AND c.source_type = 'project'
  WHERE p.deleted_at IS NULL
    AND (p_category IS NULL OR p.category = p_category)
  GROUP BY p.id, u.id
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
```

### 6.3 함수 권한 설정

```sql
-- 모든 사용자가 함수 호출 가능
GRANT EXECUTE ON FUNCTION odd.v1_upsert_user TO authenticated, anon;
GRANT EXECUTE ON FUNCTION odd.v1_fetch_projects TO authenticated, anon;
```

## 7. 트리거 및 함수

### 7.1 updated_at 자동 업데이트 트리거

```sql
-- 트리거 함수 생성
CREATE OR REPLACE FUNCTION odd.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 적용
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON odd.tbl_users
FOR EACH ROW
EXECUTE FUNCTION odd.update_updated_at();

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON odd.tbl_projects
FOR EACH ROW
EXECUTE FUNCTION odd.update_updated_at();
```

### 7.2 Bot 시스템 트리거 예시

```sql
-- 프로젝트 생성 후 Bot이 피드 자동 생성
CREATE OR REPLACE FUNCTION odd.trigger_after_project_created()
RETURNS TRIGGER AS $$
DECLARE
  v_bot_id BIGINT;
BEGIN
  -- 시스템 Bot ID 조회
  SELECT id INTO v_bot_id
  FROM odd.tbl_users
  WHERE username = 'system' AND is_bot = true
  LIMIT 1;
  
  -- Bot이 없으면 생성
  IF v_bot_id IS NULL THEN
    INSERT INTO odd.tbl_users (auth_id, username, display_name, is_bot)
    VALUES (gen_random_uuid(), 'system', '시스템', true)
    RETURNING id INTO v_bot_id;
  END IF;
  
  -- 피드 자동 생성
  INSERT INTO odd.tbl_posts (author_id, content, post_type, source_id, source_type)
  VALUES (
    v_bot_id,
    NEW.title || ' 프로젝트가 생성되었습니다.',
    'project_created',
    NEW.id::TEXT,
    'project'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_project_created
AFTER INSERT ON odd.tbl_projects
FOR EACH ROW
EXECUTE FUNCTION odd.trigger_after_project_created();
```

## 8. 클라이언트에서 RPC 호출

### 8.1 TypeScript 타입 정의

```typescript
// src/entities/user/api/user.api.ts
import { supabase } from "@/shared/lib/supabase";

interface UpsertUserParams {
  p_auth_id: string;
  p_email: string;
  p_display_name?: string;
  p_avatar_url?: string;
}

export async function upsertUser(params: UpsertUserParams) {
  const { data, error } = await supabase
    .schema("odd")
    .rpc("v1_upsert_user", params)
    .single();
    
  if (error) throw error;
  return data;
}
```

### 8.2 에러 처리

```typescript
try {
  const user = await upsertUser({
    p_auth_id: authUser.id,
    p_email: authUser.email,
    p_display_name: authUser.user_metadata?.name,
  });
} catch (error) {
  console.error("사용자 생성 실패:", error);
  // 에러 처리 로직
}
```

## 9. 모범 사례

### 9.1 SQL 파일 관리

- 모든 SQL 변경사항은 `docs/sql/`에 저장
- 파일명에 순서 번호 포함 (`001_`, `002_` 등)
- 각 파일에 변경 목적 주석 추가

### 9.2 함수 버전 관리

- 기존 함수 수정 시 새 버전 생성 (`v1_*` → `v2_*`)
- 하위 호환성 유지
- 마이그레이션 가이드 작성

### 9.3 보안

- 모든 테이블에 RLS 활성화
- `SECURITY DEFINER` 함수는 신중하게 사용
- 입력값 검증 및 SQL 인젝션 방지

## 📚 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)
- [프로젝트 SQL 파일](../sql/)


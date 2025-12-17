# Supabase Storage 설정 가이드

## Storage 버킷 생성

프로필 이미지 업로드를 위해 `1dd-user-images` 버킷을 생성해야 합니다.

### Supabase 대시보드에서 생성

1. Supabase 대시보드 접속
2. **Storage** 메뉴 클릭
3. **New bucket** 클릭
4. 버킷 이름: `1dd-user-images`
5. **Public bucket**: 체크 해제 (비공개)
6. **Create bucket** 클릭

### RLS 정책 설정

버킷 생성 후 다음 RLS 정책을 추가합니다:

```sql
-- 사용자는 자신의 폴더에만 업로드 가능
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = '1dd-user-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 사용자는 자신의 폴더의 파일만 읽기 가능
CREATE POLICY "Users can read own folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = '1dd-user-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 사용자는 자신의 폴더의 파일만 삭제 가능
CREATE POLICY "Users can delete own folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = '1dd-user-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 공개 읽기 (프로필 이미지는 누구나 볼 수 있음)
CREATE POLICY "Public can read profile images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = '1dd-user-images');
```

### psql로 버킷 생성 및 RLS 정책 설정

```bash
# 버킷 생성
psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -c "
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  '1dd-user-images',
  '1dd-user-images',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;
"

# RLS 정책 설정
psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -c "
-- 기존 정책 삭제
DROP POLICY IF EXISTS \"Users can upload to own folder\" ON storage.objects;
DROP POLICY IF EXISTS \"Users can read own folder\" ON storage.objects;
DROP POLICY IF EXISTS \"Users can delete own folder\" ON storage.objects;
DROP POLICY IF EXISTS \"Public can read profile images\" ON storage.objects;

-- 사용자는 자신의 폴더에만 업로드 가능
CREATE POLICY \"Users can upload to own folder\"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = '1dd-user-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 사용자는 자신의 폴더의 파일만 읽기 가능
CREATE POLICY \"Users can read own folder\"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = '1dd-user-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 사용자는 자신의 폴더의 파일만 삭제 가능
CREATE POLICY \"Users can delete own folder\"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = '1dd-user-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 공개 읽기 (프로필 이미지는 누구나 볼 수 있음)
CREATE POLICY \"Public can read profile images\"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = '1dd-user-images');
"
```

## 이미지 경로 구조

```
{auth_id}/images/profile/profile-{timestamp}.{ext}
```

**중요**: 폴더명은 Supabase Auth의 `user.id` (UUID, `auth_id`)를 사용합니다.
- `user.id` (DB의 bigint)가 아닌 `auth.uid()` (UUID)를 사용
- 예: `b75408a1-c1cf-43b6-b6f1-3b7288745b62/images/profile/profile-1702800000000.jpg`

RLS 정책에서 `auth.uid()`와 폴더명을 비교하므로, 폴더명은 반드시 `auth_id` (UUID)여야 합니다.

## Image Transformations 사용

Supabase Image Transformations를 사용하여 on-the-fly 리사이즈가 가능합니다.

### 사용 예시

```typescript
import { getProfileImageUrl } from "@/shared/lib/storage";

// 작은 크기 (40x40)
const smallUrl = getProfileImageUrl(filePath, "sm");

// 중간 크기 (100x100) - 기본값
const mediumUrl = getProfileImageUrl(filePath, "md");

// 큰 크기 (400x400)
const largeUrl = getProfileImageUrl(filePath, "xl");
```

### 커스텀 리사이즈

```typescript
import { getImageUrl } from "@/shared/lib/storage";

const customUrl = getImageUrl(filePath, {
  width: 500,
  height: 500,
  resize: "cover",
  quality: 90,
});
```

## 제한 사항

- 파일 크기: 최대 5MB
- 지원 형식: JPEG, PNG, WebP, GIF
- Image Transformations: Pro 플랜 이상 필요 (무료 플랜에서는 사용 불가)


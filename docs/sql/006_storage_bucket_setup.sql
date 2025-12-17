-- =====================================================
-- Storage 버킷 생성 및 RLS 정책 설정
-- =====================================================
-- 
-- 프로필 이미지 업로드를 위한 user-images 버킷 설정
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/006_storage_bucket_setup.sql
-- 
-- =====================================================
-- 1. 버킷 생성
-- =====================================================

-- 버킷 생성 (이미 존재하면 public으로 업데이트)
-- 중요: Image Transformations 기능을 사용하려면 버킷을 공개(public: true)로 설정해야 합니다
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  '1dd-user-images',
  '1dd-user-images',
  true,                     -- 공개 버킷 (Image Transformations 사용 필수)
  5242880,                  -- 5MB 제한
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']  -- 지원 형식
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- =====================================================
-- 2. RLS 정책 설정
-- =====================================================

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own folder" ON storage.objects;
DROP POLICY IF EXISTS "Public can read profile images" ON storage.objects;

-- 정책 1: 사용자는 자신의 폴더에만 업로드 가능
-- 폴더 구조: {auth_id}/images/profile/{filename}
-- auth.uid()와 폴더명의 첫 번째 부분이 일치해야 함
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = '1dd-user-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 정책 2: 사용자는 자신의 폴더의 파일만 읽기 가능
CREATE POLICY "Users can read own folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = '1dd-user-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 정책 3: 사용자는 자신의 폴더의 파일만 삭제 가능
CREATE POLICY "Users can delete own folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = '1dd-user-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 정책 4: 공개 읽기 (프로필 이미지는 누구나 볼 수 있음)
-- 프로필 이미지는 공개적으로 접근 가능해야 하므로 public 정책 추가
CREATE POLICY "Public can read profile images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = '1dd-user-images');

-- =====================================================
-- 3. 정책 확인
-- =====================================================

-- 생성된 정책 확인
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND policyname LIKE '%folder%' 
  OR policyname LIKE '%profile%'
ORDER BY policyname;

-- 버킷 확인
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = '1dd-user-images';

-- =====================================================
-- 참고사항
-- =====================================================

/*
 * 폴더 구조:
 *   {auth_id}/images/profile/profile-{timestamp}.{ext}
 * 
 * 예시:
 *   b75408a1-c1cf-43b6-b6f1-3b7288745b62/images/profile/profile-1702800000000.jpg
 * 
 * 중요:
 *   - 폴더명은 Supabase Auth의 user.id (UUID, auth_id)를 사용
 *   - DB의 id (bigint)가 아닌 auth.uid() (UUID)를 사용해야 함
 *   - RLS 정책에서 auth.uid()와 폴더명을 비교하므로 일치해야 함
 * 
 * Image Transformations:
 *   - 원본은 하나만 저장
 *   - 표시 시 필요한 크기로 on-the-fly 리사이즈
 *   - getPublicUrl()에 transform 옵션 전달
 *   - 중요: Image Transformations를 사용하려면 버킷을 공개(public: true)로 설정해야 함
 *   - 비공개 버킷에서는 /render/image/public/ API가 작동하지 않아 400 에러 발생
 * 
 * 예시:
 *   getImageUrl(filePath, { width: 100, height: 100, resize: 'cover', quality: 85 })
 * 
 * 보안 고려사항:
 *   - 버킷이 공개이지만 RLS 정책으로 업로드/삭제 권한 제어
 *   - 인증된 사용자만 자신의 폴더에 업로드/삭제 가능
 *   - 모든 사용자는 이미지를 읽을 수 있음 (프로필 이미지이므로 적절함)
 */


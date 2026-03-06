-- =====================================================
-- Storage RLS 정책 수정 및 UPDATE 권한 추가
-- =====================================================
-- 
-- 문제: 프로젝트 등록/수정 시 이미지 업로드 실패 (403 Forbidden)
-- 원인: 
--   1. upsert: true 옵션 사용 시 UPDATE 권한이 필요함
--   2. 기존 RLS 정책에 UPDATE 권한이 누락됨
--   3. 폴더 구조 체크 로직 강화
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/060_fix_storage_rls_policies.sql
-- 
-- =====================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own folder" ON storage.objects;
    
-- 1. INSERT 정책 (업로드)
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = '1dd-user-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. UPDATE 정책 (덮어쓰기 - upsert: true 대응)
CREATE POLICY "Users can update own folder"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = '1dd-user-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = '1dd-user-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. DELETE 정책 (삭제)
CREATE POLICY "Users can delete own folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = '1dd-user-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. SELECT 정책 (조회 - 이미 public 정책이 있지만 authenticated 전용으로도 추가)
CREATE POLICY "Users can read own folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = '1dd-user-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. 공개 읽기 권한 추가
CREATE POLICY "Public can read from 1dd-user-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = '1dd-user-images');

-- 정책 확인
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
ORDER BY policyname;

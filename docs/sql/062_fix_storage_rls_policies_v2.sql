-- =====================================================
-- Storage RLS 정책 보강 및 수정
-- =====================================================
-- 
-- 문제: 피드백/공지사항 등 이미지 업로드 시 RLS 정책 위반 에러 발생
-- 원인: 
--   1. (storage.foldername(name))[1] 방식이 일부 환경에서 부정확할 수 있음
--   2. auth.uid()::text 비교 시 대소문자나 포맷 이슈 발생 가능성
--   3. upsert: true 사용 시 INSERT와 UPDATE 권한이 모두 정확히 맞아야 함
-- 
-- 해결:
--   1. 폴더 구조 체크 방식을 더 확실한 방식으로 변경
--   2. auth.uid()::text와 auth.jwt() ->> 'sub'를 모두 체크하여 인증 정보 누락 방지
-- 
-- =====================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own folder" ON storage.objects;
DROP POLICY IF EXISTS "Public can read from 1dd-user-images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read profile images" ON storage.objects;

-- 1. INSERT 정책 (업로드)
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = '1dd-user-images' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  )
);

-- 2. UPDATE 정책 (덮어쓰기)
CREATE POLICY "Users can update own folder"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = '1dd-user-images' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  )
)
WITH CHECK (
  bucket_id = '1dd-user-images' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  )
);

-- 3. DELETE 정책 (삭제)
CREATE POLICY "Users can delete own folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = '1dd-user-images' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  )
);

-- 4. SELECT 정책 (조회)
CREATE POLICY "Users can read own folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = '1dd-user-images' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  )
);

-- 5. 공개 읽기 권한 (프로필 및 포스트 이미지용)
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

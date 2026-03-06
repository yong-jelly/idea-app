-- =====================================================
-- 투표 응답 집계 무결성 보완
-- =====================================================
--
-- 목적:
--   - vote_option_id UPDATE 시 votes_count 동기화 누락 보완
--   - 응답이 존재하는 투표의 옵션/타입 변경 방지
--   - 기존 비정규화 카운트 재계산으로 집계 복구
--
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/060_fix_vote_response_integrity.sql

BEGIN;

-- =====================================================
-- 1. 투표 응답 UPDATE 시 votes_count 보정 트리거 추가
-- =====================================================

CREATE OR REPLACE FUNCTION odd.sync_post_vote_option_count_on_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.vote_option_id IS NOT DISTINCT FROM OLD.vote_option_id THEN
        RETURN NEW;
    END IF;

    UPDATE odd.tbl_post_votes
    SET votes_count = GREATEST(votes_count - 1, 0)
    WHERE id = OLD.vote_option_id;

    UPDATE odd.tbl_post_votes
    SET votes_count = votes_count + 1
    WHERE id = NEW.vote_option_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_post_vote_option_count_on_update ON odd.tbl_post_vote_responses;
CREATE TRIGGER trigger_sync_post_vote_option_count_on_update
    AFTER UPDATE OF vote_option_id ON odd.tbl_post_vote_responses
    FOR EACH ROW
    EXECUTE FUNCTION odd.sync_post_vote_option_count_on_update();

-- =====================================================
-- 2. votes_count 재계산 함수 추가
-- =====================================================

CREATE OR REPLACE FUNCTION odd.recalculate_post_vote_counts(p_post_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    v_updated_count integer;
BEGIN
    UPDATE odd.tbl_post_votes pv
    SET votes_count = COALESCE(src.votes_count, 0)
    FROM (
        SELECT
            pv_inner.id AS vote_option_id,
            COUNT(pvr.id)::integer AS votes_count
        FROM odd.tbl_post_votes pv_inner
        LEFT JOIN odd.tbl_post_vote_responses pvr
            ON pvr.vote_option_id = pv_inner.id
        WHERE p_post_id IS NULL OR pv_inner.post_id = p_post_id
        GROUP BY pv_inner.id
    ) src
    WHERE pv.id = src.vote_option_id
      AND (p_post_id IS NULL OR pv.post_id = p_post_id);

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
END;
$$;

COMMENT ON FUNCTION odd.recalculate_post_vote_counts(uuid) IS '투표 응답 테이블을 기준으로 tbl_post_votes.votes_count를 재계산합니다.';

-- =====================================================
-- 3. 투표 수정 함수 보호 로직 보강
-- =====================================================

DROP FUNCTION IF EXISTS odd.v1_update_community_post(uuid, text, text, jsonb, boolean, text[]);

CREATE OR REPLACE FUNCTION odd.v1_update_community_post(
    p_post_id uuid,
    p_title text DEFAULT NULL,
    p_content text DEFAULT NULL,
    p_images jsonb DEFAULT NULL,
    p_is_pinned boolean DEFAULT NULL,
    p_post_type text DEFAULT NULL,
    p_vote_options text[] DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = odd, public
AS $$
DECLARE
    v_auth_id uuid;
    v_user_id bigint;
    v_post_author_id bigint;
    v_post_type text;
    v_option_text text;
    v_sort_order integer;
    v_vote_response_count integer := 0;
BEGIN
    v_auth_id := auth.uid();

    IF v_auth_id IS NULL THEN
        RAISE EXCEPTION '인증이 필요합니다';
    END IF;

    SELECT u.id INTO v_user_id
    FROM odd.tbl_users u
    WHERE u.auth_id = v_auth_id;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '사용자를 찾을 수 없습니다';
    END IF;

    SELECT pst.author_id INTO v_post_author_id
    FROM odd.tbl_posts pst
    WHERE pst.id = p_post_id;

    IF v_post_author_id IS NULL THEN
        RAISE EXCEPTION '포스트를 찾을 수 없습니다';
    END IF;

    IF v_post_author_id != v_user_id THEN
        RAISE EXCEPTION '작성자만 포스트를 수정할 수 있습니다';
    END IF;

    SELECT post_type INTO v_post_type
    FROM odd.tbl_post_announcements
    WHERE post_id = p_post_id;

    IF p_post_type IS NOT NULL AND p_post_type NOT IN ('announcement', 'update', 'vote') THEN
        RAISE EXCEPTION '유효하지 않은 포스트 타입입니다: %', p_post_type;
    END IF;

    IF v_post_type != 'vote' AND p_post_type = 'vote' AND p_vote_options IS NULL THEN
        RAISE EXCEPTION '투표 타입으로 변경할 때는 투표 옵션이 필요합니다';
    END IF;

    IF p_vote_options IS NOT NULL THEN
        IF array_length(p_vote_options, 1) < 2 THEN
            RAISE EXCEPTION '투표 옵션은 최소 2개 이상 필요합니다';
        END IF;

        IF array_length(p_vote_options, 1) > 5 THEN
            RAISE EXCEPTION '투표 옵션은 최대 5개까지 가능합니다';
        END IF;
    END IF;

    IF v_post_type = 'vote' AND (
        (p_post_type IS NOT NULL AND p_post_type != 'vote')
        OR p_vote_options IS NOT NULL
    ) THEN
        SELECT COUNT(*)::integer INTO v_vote_response_count
        FROM odd.tbl_post_vote_responses
        WHERE post_id = p_post_id;

        IF v_vote_response_count > 0 THEN
            IF p_post_type IS NOT NULL AND p_post_type != 'vote' THEN
                RAISE EXCEPTION '응답이 있는 투표는 다른 타입으로 변경할 수 없습니다';
            END IF;

            IF p_vote_options IS NOT NULL THEN
                RAISE EXCEPTION '응답이 있는 투표는 옵션을 수정할 수 없습니다';
            END IF;
        END IF;
    END IF;

    IF p_post_type IS NOT NULL AND v_post_type = 'vote' AND p_post_type != 'vote' THEN
        DELETE FROM odd.tbl_post_votes
        WHERE post_id = p_post_id;
    END IF;

    IF p_content IS NOT NULL OR p_images IS NOT NULL OR p_is_pinned IS NOT NULL THEN
        UPDATE odd.tbl_posts
        SET
            content = COALESCE(p_content, content),
            images = CASE
                WHEN p_images IS NULL THEN '[]'::jsonb
                ELSE p_images
            END,
            is_pinned = COALESCE(p_is_pinned, is_pinned)
        WHERE id = p_post_id;
    END IF;

    IF p_title IS NOT NULL OR p_is_pinned IS NOT NULL OR p_post_type IS NOT NULL THEN
        UPDATE odd.tbl_post_announcements
        SET
            title = COALESCE(p_title, title),
            is_pinned = COALESCE(p_is_pinned, is_pinned),
            post_type = COALESCE(p_post_type, post_type)
        WHERE post_id = p_post_id;
    END IF;

    IF p_post_type IS NOT NULL THEN
        v_post_type := p_post_type;
    END IF;

    IF v_post_type = 'vote' AND p_vote_options IS NOT NULL THEN
        DELETE FROM odd.tbl_post_votes
        WHERE post_id = p_post_id;

        v_sort_order := 0;
        FOREACH v_option_text IN ARRAY p_vote_options
        LOOP
            IF v_option_text IS NOT NULL AND trim(v_option_text) != '' THEN
                INSERT INTO odd.tbl_post_votes (
                    post_id,
                    option_text,
                    sort_order
                ) VALUES (
                    p_post_id,
                    trim(v_option_text),
                    v_sort_order
                );
                v_sort_order := v_sort_order + 1;
            END IF;
        END LOOP;
    END IF;

    RETURN true;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in v1_update_community_post: %', SQLERRM;
END;
$$;

-- =====================================================
-- 4. 기존 집계 복구
-- =====================================================

SELECT odd.recalculate_post_vote_counts();

COMMIT;

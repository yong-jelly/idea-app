-- =====================================================
-- 태스크 테이블 생성
-- =====================================================
-- 
-- 마일스톤의 태스크를 관리하는 테이블입니다.
-- 
-- 사용 위치:
--   - MilestoneDetailPage: 태스크 목록 및 관리
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/030_create_tasks_table.sql
-- 
-- =====================================================
-- 1. 태스크 테이블 생성
-- =====================================================

CREATE TABLE IF NOT EXISTS odd.tbl_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id uuid NOT NULL REFERENCES odd.tbl_milestones(id) ON DELETE CASCADE,
    author_id bigint NOT NULL REFERENCES odd.tbl_users(id) ON DELETE CASCADE,
    
    -- 태스크 정보
    title text NOT NULL,  -- 제목 (최대 50자)
    description text,  -- 설명 (최대 200자)
    due_date date,  -- 마감일
    
    -- 상태
    status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'done')),  -- 상태
    
    -- 타임스탬프
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    completed_at timestamptz  -- 완료일시 (status가 'done'일 때 설정)
);

-- 인덱스: 마일스톤별 태스크 조회
CREATE INDEX IF NOT EXISTS idx_tbl_tasks_milestone_id ON odd.tbl_tasks(milestone_id);

-- 인덱스: 작성자별 조회
CREATE INDEX IF NOT EXISTS idx_tbl_tasks_author_id ON odd.tbl_tasks(author_id);

-- 인덱스: 상태별 조회
CREATE INDEX IF NOT EXISTS idx_tbl_tasks_status ON odd.tbl_tasks(status);

-- 인덱스: 최신순 정렬
CREATE INDEX IF NOT EXISTS idx_tbl_tasks_created_at ON odd.tbl_tasks(created_at DESC);

-- =====================================================
-- 2. updated_at 자동 업데이트 트리거
-- =====================================================

CREATE OR REPLACE FUNCTION odd.update_tbl_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tbl_tasks_updated_at ON odd.tbl_tasks;
CREATE TRIGGER trigger_tbl_tasks_updated_at
    BEFORE UPDATE ON odd.tbl_tasks
    FOR EACH ROW
    EXECUTE FUNCTION odd.update_tbl_tasks_updated_at();

-- =====================================================
-- 3. 마일스톤 이슈 카운트 자동 업데이트 트리거
-- =====================================================

-- 태스크 생성 시 마일스톤 카운트 업데이트
CREATE OR REPLACE FUNCTION odd.update_milestone_counts_on_task_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- 새 태스크는 항상 'todo' 상태로 생성되므로 open_issues_count 증가
    UPDATE odd.tbl_milestones
    SET open_issues_count = open_issues_count + 1
    WHERE id = NEW.milestone_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_milestone_counts_on_task_insert ON odd.tbl_tasks;
CREATE TRIGGER trigger_update_milestone_counts_on_task_insert
    AFTER INSERT ON odd.tbl_tasks
    FOR EACH ROW
    EXECUTE FUNCTION odd.update_milestone_counts_on_task_insert();

-- 태스크 삭제 시 마일스톤 카운트 업데이트
CREATE OR REPLACE FUNCTION odd.update_milestone_counts_on_task_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- 삭제되는 태스크의 상태에 따라 카운트 감소
    IF OLD.status = 'todo' THEN
        UPDATE odd.tbl_milestones
        SET open_issues_count = GREATEST(open_issues_count - 1, 0)
        WHERE id = OLD.milestone_id;
    ELSIF OLD.status = 'done' THEN
        UPDATE odd.tbl_milestones
        SET closed_issues_count = GREATEST(closed_issues_count - 1, 0)
        WHERE id = OLD.milestone_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_milestone_counts_on_task_delete ON odd.tbl_tasks;
CREATE TRIGGER trigger_update_milestone_counts_on_task_delete
    AFTER DELETE ON odd.tbl_tasks
    FOR EACH ROW
    EXECUTE FUNCTION odd.update_milestone_counts_on_task_delete();

-- 태스크 상태 변경 시 마일스톤 카운트 업데이트
CREATE OR REPLACE FUNCTION odd.update_milestone_counts_on_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- 상태가 변경된 경우에만 처리
    IF OLD.status != NEW.status THEN
        -- 이전 상태에 따라 카운트 감소
        IF OLD.status = 'todo' THEN
            UPDATE odd.tbl_milestones
            SET open_issues_count = GREATEST(open_issues_count - 1, 0)
            WHERE id = NEW.milestone_id;
        ELSIF OLD.status = 'done' THEN
            UPDATE odd.tbl_milestones
            SET closed_issues_count = GREATEST(closed_issues_count - 1, 0)
            WHERE id = NEW.milestone_id;
        END IF;
        
        -- 새 상태에 따라 카운트 증가
        IF NEW.status = 'todo' THEN
            UPDATE odd.tbl_milestones
            SET open_issues_count = open_issues_count + 1
            WHERE id = NEW.milestone_id;
        ELSIF NEW.status = 'done' THEN
            UPDATE odd.tbl_milestones
            SET closed_issues_count = closed_issues_count + 1
            WHERE id = NEW.milestone_id;
            -- completed_at 설정
            IF NEW.completed_at IS NULL THEN
                NEW.completed_at := now();
            END IF;
        END IF;
        
        -- todo로 변경되면 completed_at 초기화
        IF NEW.status = 'todo' THEN
            NEW.completed_at := NULL;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_milestone_counts_on_task_status_change ON odd.tbl_tasks;
CREATE TRIGGER trigger_update_milestone_counts_on_task_status_change
    BEFORE UPDATE ON odd.tbl_tasks
    FOR EACH ROW
    EXECUTE FUNCTION odd.update_milestone_counts_on_task_status_change();

-- =====================================================
-- 4. RLS (Row Level Security) 정책 설정
-- =====================================================

-- RLS 활성화
ALTER TABLE odd.tbl_tasks ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 태스크를 읽을 수 있음 (공개)
CREATE POLICY "Anyone can read tasks"
    ON odd.tbl_tasks
    FOR SELECT
    TO public
    USING (true);

-- 인증된 사용자만 태스크를 생성할 수 있음 (권한 체크는 함수에서 수행)
CREATE POLICY "Authenticated users can create tasks"
    ON odd.tbl_tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (true);  -- 권한 체크는 함수에서 수행

-- 인증된 사용자만 태스크를 수정할 수 있음 (권한 체크는 함수에서 수행)
CREATE POLICY "Authenticated users can update tasks"
    ON odd.tbl_tasks
    FOR UPDATE
    TO authenticated
    USING (true)  -- 권한 체크는 함수에서 수행
    WITH CHECK (true);

-- 인증된 사용자만 태스크를 삭제할 수 있음 (권한 체크는 함수에서 수행)
CREATE POLICY "Authenticated users can delete tasks"
    ON odd.tbl_tasks
    FOR DELETE
    TO authenticated
    USING (true);  -- 권한 체크는 함수에서 수행

-- =====================================================
-- 5. 권한 부여
-- =====================================================

GRANT SELECT ON odd.tbl_tasks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON odd.tbl_tasks TO authenticated;

-- =====================================================
-- 6. 코멘트 추가
-- =====================================================

COMMENT ON TABLE odd.tbl_tasks IS '마일스톤의 태스크를 저장하는 테이블';
COMMENT ON COLUMN odd.tbl_tasks.id IS '고유 ID';
COMMENT ON COLUMN odd.tbl_tasks.milestone_id IS '마일스톤 ID (tbl_milestones.id 참조)';
COMMENT ON COLUMN odd.tbl_tasks.author_id IS '태스크 생성자 ID (tbl_users.id 참조)';
COMMENT ON COLUMN odd.tbl_tasks.title IS '제목 (최대 50자)';
COMMENT ON COLUMN odd.tbl_tasks.description IS '설명 (최대 200자)';
COMMENT ON COLUMN odd.tbl_tasks.due_date IS '마감일';
COMMENT ON COLUMN odd.tbl_tasks.status IS '상태 (todo, done)';
COMMENT ON COLUMN odd.tbl_tasks.created_at IS '생성일시';
COMMENT ON COLUMN odd.tbl_tasks.updated_at IS '수정일시';
COMMENT ON COLUMN odd.tbl_tasks.completed_at IS '완료일시 (status가 done일 때 설정)';


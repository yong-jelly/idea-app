#!/usr/bin/env python3
"""
LLM 공개 API로 공지 본문을 평문(마크다운 없음)으로 교체합니다.

- `LLM_PAT` 환경변수에 액세스 토큰(odd_pat_…) 평문을 넣고 실행하세요.
- 예: LLM_PAT='odd_pat_...' python3 docs/todo/apply-plain-announcement-update.py
"""

from __future__ import annotations

import json
import os
import sys
import urllib.request

SUPABASE_URL = "https://xyqpggpilgcdsawuvpzn.supabase.co"
ANON = "sb_publishable_4rByGLkIJH0y9Qz7CKm1MA_ulfWQZtj"

POST_ID = "4d5f4634-c346-4247-9152-e1ad21452a3c"
PROJECT_KEY = "prj_c9187c3a_3eda4d5b"

PLAIN_CONTENT = """안녕하세요, 1DD 팀입니다.

인디 해커와 팀이 프로젝트를 만들고 운영할 때, Cursor·Claude 같은 도구나 자동화 스크립트와 안전하게 연결할 수 있도록, 프로젝트 단위로 액세스 토큰과 연동 문서를 쓸 수 있는 기능을 단계적으로 넣었습니다. 이번 배포에서는 설정 화면, 공개 연동 매뉴얼 URL, 토큰 기반 공개 RPC(읽기·쓰기)까지 이어집니다.

[이번에 추가·정리된 것]

1. 프로젝트 설정
   - 프로젝트 소유자만 /project/…/settings 에서 일반 정보와 LLM 및 API 메뉴를 이용할 수 있습니다.
   - 프로젝트 키(prj_로 시작하는 문자열)는 공개해도 되는 식별자로, 문서·예제에 넣어도 됩니다.
   - 액세스 토큰은 비밀 값입니다. 발급 직후 평문은 한 번만 보여 주며, 이후에는 서버에 해시만 저장됩니다.

2. 공개 LLM 연동 문서 (…/llm-manual)
   - 로그인 없이 열 수 있는 프로젝트별 공개 URL입니다.
   - 연동에 필요한 식별자·스코프·REST/RPC 호출 예시를 한곳에 정리해 두었고, Markdown 전체 복사로 도구에 붙여 넣기 쉽게 했습니다.
   - 페이지 상단에 API 플레이그라운드를 두어, 같은 화면에서 RPC를 바로 시험해 볼 수 있습니다.
   - 이 페이지 자체에는 토큰 평문이 절대 포함되지 않습니다. 토큰은 반드시 설정 화면에서 발급·복사하세요.

3. 스코프(권한)
   - 토큰마다 project.read, project.write, echo.invoke, manual.read, announcement.read, announcement.write 등 필요한 권한만 골라 발급할 수 있습니다. 최소 권한을 권장합니다.

4. 공개 API (시험 단계)
   - Supabase PostgREST RPC(odd 스키마)로, 로그인 세션 없이 anon 키와 프로젝트 액세스 토큰으로 호출합니다.
   - 예: 에코, 프로젝트 읽기/일부 필드 수정, 매뉴얼 메타, 공지 목록·공지 작성·수정·삭제(소프트) 등. 세부는 공개 문서의 공개 API 절을 참고하세요.
   - 공지 작성에는 토큰에 announcement.write 스코프가 있어야 합니다.

5. 그 밖의 메뉴
   - 연동 메뉴얼(설정 내)과 에코 테스트 메뉴는 UI를 열어 두었고, 앞으로 내용·백엔드 연결을 이어갈 예정입니다.

[이용 시 꼭 알아 두실 점]

- 토큰이 유출되었다고 생각되면 즉시 폐기하고 새로 발급해 주세요.
- 공개 URL(llm-manual)은 누구나 볼 수 있어 프로젝트 존재·연동 방식이 드러날 수 있습니다. 민감한 프로젝트는 공유 범위를 조절해 주세요.

앞으로도 문서 품질, API 범위(마일스톤 등 스코프별 연동), 운영·보안을 차근차근 다듬어 가겠습니다. 사용해 보시다가 불편하거나 아이디어가 있으면 커뮤니티에 남겨 주세요.

감사합니다.
1DD 팀 드림"""


def main() -> int:
    token = os.environ.get("LLM_PAT") or os.environ.get("ODD_PROJECT_ACCESS_TOKEN")
    if not token or not token.strip():
        print(
            "LLM_PAT 환경변수에 액세스 토큰(odd_pat_…)을 설정한 뒤 다시 실행하세요.\n"
            "예: LLM_PAT='odd_pat_...' python3 docs/todo/apply-plain-announcement-update.py",
            file=sys.stderr,
        )
        return 1

    body = {
        "p_plain_token": token.strip(),
        "p_project_key": PROJECT_KEY,
        "p_post_id": POST_ID,
        "p_content": PLAIN_CONTENT,
    }
    data = json.dumps(body, ensure_ascii=False).encode("utf-8")

    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/rpc/v1_llm_public_announcement_update",
        data=data,
        method="POST",
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "Accept-Profile": "odd",
            "Content-Profile": "odd",
            "apikey": ANON,
            "Authorization": f"Bearer {ANON}",
        },
    )

    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read().decode("utf-8")

    print(raw)
    parsed = json.loads(raw)
    if not parsed.get("ok"):
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

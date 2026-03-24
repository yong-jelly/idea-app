/**
 * @file postAuthor.ts
 * @description 블로그 글 `author_id`(tbl_users.id)와 로그인 사용자 `user.id` 일치 여부.
 */

/**
 * 현재 사용자가 해당 글 작성자인지 판별한다.
 * @param user 앱 사용자. `id`는 `tbl_users.id`와 동일한 숫자 문자열.
 * @param authorId RPC `author_id`(bigint를 number로 온 값)
 */
export function isBlogPostAuthor(
  user: { id: string } | null | undefined,
  authorId: number
): boolean {
  if (!user?.id) return false;
  const n = Number(user.id);
  return Number.isFinite(n) && n > 0 && n === authorId;
}

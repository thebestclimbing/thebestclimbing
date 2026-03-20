-- 관리자 회원 목록 조회용: 각 회원의 최근 출석 체크 시각(checked_at) 1건
-- 반환 필드: profiles + latest_checked_at

CREATE OR REPLACE FUNCTION public.get_admin_members_with_latest_attendance()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  phone text,
  phone_tail4 text,
  membership_start date,
  membership_end date,
  membership_paused boolean,
  membership_paused_at integer,
  role user_role,
  created_at timestamptz,
  latest_checked_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.id,
    p.name,
    p.email,
    p.phone,
    p.phone_tail4,
    p.membership_start,
    p.membership_end,
    p.membership_paused,
    p.membership_paused_at,
    p.role,
    p.created_at,
    la.checked_at AS latest_checked_at
  FROM public.profiles p
  LEFT JOIN LATERAL (
    SELECT a.checked_at
    FROM public.attendances a
    WHERE a.profile_id = p.id
    ORDER BY a.checked_at DESC
    LIMIT 1
  ) la ON true
  ORDER BY p.name ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_members_with_latest_attendance() TO authenticated;


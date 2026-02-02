-- 메인 화면(완등자) · 출석체크: 비로그인 상태에서도 동작하도록 RLS 및 함수 추가
-- 참고: public.routes, public.profiles 등은 001_initial_schema.sql에서 생성됩니다. 먼저 적용 후 이 마이그레이션을 실행하세요.

-- 1) 루트: 비로그인(anon)도 읽기 허용 (메인 완등자 조회 시 routes 조인 필요)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'routes') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'routes' AND policyname = '루트 비로그인 읽기') THEN
      CREATE POLICY "루트 비로그인 읽기" ON public.routes
        FOR SELECT TO anon USING (true);
    END IF;
  END IF;
END $$;

-- 2) 프로필: 비로그인도 완등자 프로필(id, name)만 조회 허용 (메인 완등자 표시용)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'exercise_logs') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = '완등자 프로필 공개') THEN
      CREATE POLICY "완등자 프로필 공개" ON public.profiles
        FOR SELECT TO anon
        USING (
          EXISTS (
            SELECT 1 FROM public.exercise_logs el
            WHERE el.profile_id = profiles.id AND el.is_completed = true
          )
        );
    END IF;
  END IF;
END $$;

-- 3) 출석 등록: 비로그인 키오스크에서 전화뒷4자리 검증 후 출석 등록 (SECURITY DEFINER)
-- 반환: 'ok' = 등록됨, 'already' = 오늘 이미 출석함
-- attendances 테이블과 get_profiles_for_attendance 함수가 있을 때만 생성 (001, 009 선행 필요)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attendances')
     AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'get_profiles_for_attendance') THEN
    -- 매개변수 순서: p_profile_id, p_tail4 (PostgREST 스키마 캐시가 알파벳 순으로 조회함)
    CREATE OR REPLACE FUNCTION public.insert_attendance_for_tail4(p_profile_id uuid, p_tail4 text)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $fn$
    DECLARE
      v_found boolean;
    BEGIN
      IF char_length(p_tail4) <> 4 THEN
        RAISE EXCEPTION '전화뒷4자리는 4자리여야 합니다.';
      END IF;

      SELECT EXISTS (
        SELECT 1 FROM public.get_profiles_for_attendance(p_tail4) pr WHERE pr.id = p_profile_id
      ) INTO v_found;

      IF NOT v_found THEN
        RAISE EXCEPTION '해당 전화뒷4자리와 일치하는 회원이 없거나 선택한 회원이 아닙니다.';
      END IF;

      INSERT INTO public.attendances (profile_id, attended_at)
      VALUES (p_profile_id, (now() AT TIME ZONE 'Asia/Seoul')::date);
      RETURN 'ok';
    EXCEPTION
      WHEN unique_violation THEN
        RETURN 'already';
    END;
    $fn$;

    GRANT EXECUTE ON FUNCTION public.insert_attendance_for_tail4(uuid, text) TO anon;
    GRANT EXECUTE ON FUNCTION public.insert_attendance_for_tail4(uuid, text) TO authenticated;
  END IF;
END $$;
